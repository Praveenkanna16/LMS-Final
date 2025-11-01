const { RecordedContent, VideoProgress, User, BatchEnrollment, Payment, Course } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');

/**
 * Video Player Controller with Progress Tracking
 */

/**
 * Get video for playback (with access control)
 */
const getVideoForPlayback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await RecordedContent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access permissions
    const hasAccess = await checkVideoAccess(userId, video);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this video'
      });
    }

    // Get or create progress record
    let progress = await VideoProgress.findOne({
      where: { userId, recordedContentId: id }
    });

    if (!progress) {
      progress = await VideoProgress.create({
        userId,
        recordedContentId: id,
        duration: video.duration,
        currentTime: 0,
        completionStatus: 'not_started'
      });
    }

    // Increment view count
    await video.increment('views');

    res.json({
      success: true,
      data: {
        video: {
          id: video.id,
          title: video.title,
          description: video.description,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          quality: video.quality,
          teacher: video.teacher,
          views: video.views + 1
        },
        progress: {
          currentTime: progress.currentTime,
          watchedPercentage: progress.watchedPercentage,
          completionStatus: progress.completionStatus,
          lastWatchedAt: progress.lastWatchedAt
        }
      }
    });
  } catch (error) {
    logger.error('Error getting video for playback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load video'
    });
  }
};

/**
 * Check if user has access to video
 */
const checkVideoAccess = async (userId, video) => {
  // Public videos are accessible to all
  if (video.isPublic) {
    return true;
  }

  // Teacher who uploaded has access
  if (video.teacherId === userId) {
    return true;
  }

  // Check if user is enrolled in the batch
  if (video.batchId) {
    const enrollment = await BatchEnrollment.findOne({
      where: {
        studentId: userId,
        batchId: video.batchId,
        status: 'active'
      }
    });
    
    return !!enrollment;
  }

  // Check if user has purchased the course
  if (video.courseId) {
    const payment = await Payment.findOne({
      where: {
        studentId: userId,
        courseId: video.courseId,
        status: 'completed' // Only completed payments grant access
      }
    });
    
    return !!payment;
  }

  return false;
};

/**
 * Update video progress
 */
const updateVideoProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { currentTime, duration, playbackSpeed, quality } = req.body;

    if (currentTime === undefined) {
      return res.status(400).json({
        success: false,
        message: 'currentTime is required'
      });
    }

    let progress = await VideoProgress.findOne({
      where: { userId, recordedContentId: id }
    });

    if (!progress) {
      progress = await VideoProgress.create({
        userId,
        recordedContentId: id,
        currentTime,
        duration,
        playbackSpeed,
        quality,
        lastWatchedAt: new Date()
      });
    } else {
      // Update watched segments
      const watchedSegments = progress.watchedSegments || [];
      const lastSegment = watchedSegments[watchedSegments.length - 1];
      
      // If continuing from last position, extend the segment
      if (lastSegment && Math.abs(lastSegment.end - progress.currentTime) <= 5) {
        lastSegment.end = currentTime;
      } else {
        // New segment
        watchedSegments.push({
          start: progress.currentTime,
          end: currentTime
        });
      }

      // Calculate total unique watch time
      const mergedSegments = mergeSegments(watchedSegments);
      const totalWatchTime = mergedSegments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);

      await progress.update({
        currentTime,
        duration: duration || progress.duration,
        watchedSegments,
        totalWatchTime,
        playbackSpeed: playbackSpeed || progress.playbackSpeed,
        quality: quality || progress.quality,
        lastWatchedAt: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        currentTime: progress.currentTime,
        watchedPercentage: progress.watchedPercentage,
        completionStatus: progress.completionStatus,
        totalWatchTime: progress.totalWatchTime
      }
    });
  } catch (error) {
    logger.error('Error updating video progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
};

/**
 * Merge overlapping time segments
 */
const mergeSegments = (segments) => {
  if (segments.length === 0) return [];
  
  const sorted = segments.sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }
  
  return merged;
};

/**
 * Mark video as completed
 */
const markVideoCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let progress = await VideoProgress.findOne({
      where: { userId, recordedContentId: id }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    await progress.update({
      completionStatus: 'completed',
      completedAt: new Date(),
      watchedPercentage: 100
    });

    res.json({
      success: true,
      message: 'Video marked as completed',
      data: progress
    });
  } catch (error) {
    logger.error('Error marking video completed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark video completed'
    });
  }
};

/**
 * Get student's video progress for a batch/course
 */
const getStudentVideoProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { batchId, courseId } = req.query;

    const whereClause = { userId };
    const videoWhere = {};

    if (batchId) videoWhere.batchId = batchId;
    if (courseId) videoWhere.courseId = courseId;

    const progressRecords = await VideoProgress.findAll({
      where: whereClause,
      include: [
        {
          model: RecordedContent,
          as: 'video',
          where: videoWhere,
          attributes: ['id', 'title', 'duration', 'thumbnailUrl', 'batchId', 'courseId']
        }
      ],
      order: [['lastWatchedAt', 'DESC']]
    });

    // Calculate summary stats
    const totalVideos = progressRecords.length;
    const completedVideos = progressRecords.filter(p => p.completionStatus === 'completed').length;
    const inProgressVideos = progressRecords.filter(p => p.completionStatus === 'in_progress').length;
    const totalWatchTime = progressRecords.reduce((sum, p) => sum + p.totalWatchTime, 0);

    res.json({
      success: true,
      data: {
        progress: progressRecords,
        summary: {
          totalVideos,
          completedVideos,
          inProgressVideos,
          totalWatchTime,
          completionPercentage: totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0
        }
      }
    });
  } catch (error) {
    logger.error('Error getting student video progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress'
    });
  }
};

/**
 * Mark video for download (offline viewing)
 */
const markVideoDownloaded = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let progress = await VideoProgress.findOne({
      where: { userId, recordedContentId: id }
    });

    if (!progress) {
      progress = await VideoProgress.create({
        userId,
        recordedContentId: id,
        isDownloaded: true,
        downloadedAt: new Date()
      });
    } else {
      await progress.update({
        isDownloaded: true,
        downloadedAt: new Date()
      });
    }

    // Increment download count
    await RecordedContent.increment('downloads', { where: { id } });

    res.json({
      success: true,
      message: 'Video marked as downloaded'
    });
  } catch (error) {
    logger.error('Error marking video downloaded:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark video downloaded'
    });
  }
};

/**
 * Get downloaded videos
 */
const getDownloadedVideos = async (req, res) => {
  try {
    const userId = req.user.id;

    const downloadedVideos = await VideoProgress.findAll({
      where: {
        userId,
        isDownloaded: true
      },
      include: [
        {
          model: RecordedContent,
          as: 'video',
          attributes: ['id', 'title', 'description', 'duration', 'thumbnailUrl', 'fileSize']
        }
      ],
      order: [['downloadedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: downloadedVideos
    });
  } catch (error) {
    logger.error('Error getting downloaded videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get downloaded videos'
    });
  }
};

module.exports = {
  getVideoForPlayback,
  updateVideoProgress,
  markVideoCompleted,
  getStudentVideoProgress,
  markVideoDownloaded,
  getDownloadedVideos
};
