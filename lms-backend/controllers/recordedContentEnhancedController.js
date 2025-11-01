const { RecordedContent, VideoProgress, Playlist, User, Batch, Course, Payment, sequelize } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/appError');

/**
 * @desc    Update video progress for student
 * @route   POST /api/recorded-content/:videoId/progress
 * @access  Private/Student
 */
const updateVideoProgress = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { currentTime, duration, watchedSegments } = req.body;
  const studentId = req.user.id;

  // Find or create progress record
  let progress = await VideoProgress.findOne({
    where: { userId: studentId, recordedContentId: videoId }
  });

  if (!progress) {
    progress = await VideoProgress.create({
      userId: studentId,
      recordedContentId: videoId,
      currentTime,
      duration,
      watchedSegments: watchedSegments || []
    });
  } else {
    await progress.update({
      currentTime,
      duration: duration || progress.duration,
      watchedSegments: watchedSegments || progress.watchedSegments,
      lastWatchedAt: new Date()
    });
  }

  // Update video view count if this is first time
  if (progress.watchCount === 0) {
    await RecordedContent.increment('views', { 
      where: { id: videoId } 
    });
  }

  await progress.increment('watchCount');

  res.status(200).json({
    success: true,
    data: { progress }
  });
});

/**
 * @desc    Get student's video progress
 * @route   GET /api/recorded-content/:videoId/progress
 * @access  Private/Student
 */
const getVideoProgress = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const studentId = req.user.id;

  const progress = await VideoProgress.findOne({
    where: { userId: studentId, recordedContentId: videoId }
  });

  res.status(200).json({
    success: true,
    data: { progress: progress || null }
  });
});

/**
 * @desc    Get student's watch history
 * @route   GET /api/student/watch-history
 * @access  Private/Student
 */
const getWatchHistory = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { status, limit = 20 } = req.query;

  const where = { userId: studentId };
  if (status) {
    where.completionStatus = status;
  }

  const history = await VideoProgress.findAll({
    where,
    include: [{
      model: RecordedContent,
      as: 'recordedContent',
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name'] },
        { model: Batch, as: 'batch', attributes: ['id', 'name'] }
      ]
    }],
    order: [['lastWatchedAt', 'DESC']],
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    data: { history }
  });
});

/**
 * @desc    Change video visibility (public/batch/paid/private)
 * @route   PATCH /api/recorded-content/:id/visibility
 * @access  Private/Teacher
 */
const changeVisibility = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { visibility, price, isFreePreview, previewDuration } = req.body;

  const video = await RecordedContent.findByPk(id);

  if (!video) {
    throw new AppError('Video not found', 404);
  }

  // Check authorization
  if (req.user.role !== 'admin' && video.teacherId !== req.user.id) {
    throw new AppError('Not authorized to modify this video', 403);
  }

  // If setting to paid, require approval
  const updates = {
    visibility,
    isFreePreview: isFreePreview || false,
    previewDuration: previewDuration || null
  };

  if (visibility === 'paid') {
    if (!price || price <= 0) {
      throw new AppError('Price is required for paid content', 400);
    }
    updates.price = price;
    updates.isPaidContent = true;
    updates.isApproved = false; // Requires admin approval
  }

  await video.update(updates);

  res.status(200).json({
    success: true,
    message: visibility === 'paid' ? 'Video marked as paid. Awaiting admin approval.' : 'Visibility updated',
    data: { video }
  });
});

/**
 * @desc    Admin approve paid content
 * @route   POST /api/admin/recorded-content/:id/approve
 * @access  Private/Admin
 */
const approvePaidContent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await RecordedContent.findByPk(id);

  if (!video) {
    throw new AppError('Video not found', 404);
  }

  await video.update({
    isApproved: true,
    approvedBy: req.user.id,
    approvedAt: new Date()
  });

  // Notify teacher
  // Add notification logic here

  res.status(200).json({
    success: true,
    message: 'Content approved successfully',
    data: { video }
  });
});

/**
 * @desc    Create playlist/course
 * @route   POST /api/teacher/playlists
 * @access  Private/Teacher
 */
const createPlaylist = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    batchId,
    courseId,
    visibility,
    price,
    tags,
    category,
    level,
    language
  } = req.body;

  const playlist = await Playlist.create({
    title,
    description,
    teacherId: req.user.id,
    batchId: batchId || null,
    courseId: courseId || null,
    visibility: visibility || 'batch',
    price: price || 0,
    isPaid: visibility === 'paid' && price > 0,
    tags,
    category,
    level,
    language: language || 'English'
  });

  res.status(201).json({
    success: true,
    message: 'Playlist created successfully',
    data: { playlist }
  });
});

/**
 * @desc    Add video to playlist
 * @route   POST /api/teacher/playlists/:playlistId/videos
 * @access  Private/Teacher
 */
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoId, order } = req.body;

  const playlist = await Playlist.findByPk(playlistId);
  if (!playlist) {
    throw new AppError('Playlist not found', 404);
  }

  if (playlist.teacherId !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  const video = await RecordedContent.findByPk(videoId);
  if (!video) {
    throw new AppError('Video not found', 404);
  }

  await video.update({
    playlistId,
    orderInPlaylist: order || 0
  });

  // Update playlist stats
  const videos = await RecordedContent.findAll({ where: { playlistId } });
  const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
  
  await playlist.update({
    totalVideos: videos.length,
    totalDuration
  });

  res.status(200).json({
    success: true,
    message: 'Video added to playlist',
    data: { playlist }
  });
});

/**
 * @desc    Get teacher's analytics for video
 * @route   GET /api/teacher/recorded-content/:id/analytics
 * @access  Private/Teacher
 */
const getVideoAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await RecordedContent.findByPk(id);

  if (!video) {
    throw new AppError('Video not found', 404);
  }

  if (video.teacherId !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  // Get student progress data
  const progressData = await VideoProgress.findAll({
    where: { recordedContentId: id },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalStudents'],
      [sequelize.fn('SUM', sequelize.col('totalWatchTime')), 'totalWatchTime'],
      [sequelize.fn('AVG', sequelize.col('watchedPercentage')), 'avgCompletion']
    ],
    raw: true
  });

  // Get completion breakdown
  const completionBreakdown = await VideoProgress.findAll({
    where: { recordedContentId: id },
    attributes: [
      'completionStatus',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['completionStatus'],
    raw: true
  });

  res.status(200).json({
    success: true,
    data: {
      video: {
        id: video.id,
        title: video.title,
        views: video.views,
        totalRevenue: video.totalRevenue,
        duration: video.duration
      },
      analytics: {
        totalStudents: progressData[0]?.totalStudents || 0,
        totalWatchTime: progressData[0]?.totalWatchTime || 0,
        avgCompletion: parseFloat(progressData[0]?.avgCompletion || 0).toFixed(2),
        completionBreakdown
      }
    }
  });
});

/**
 * @desc    Get student's accessible videos (filtered by enrollment/purchase)
 * @route   GET /api/student/videos
 * @access  Private/Student
 */
const getStudentAccessibleVideos = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { batchId, playlistId, search } = req.query;

  // Get student's enrolled batches
  const enrolledBatches = await sequelize.models.BatchEnrollment.findAll({
    where: { studentId, status: 'active' },
    attributes: ['batchId']
  });
  const batchIds = enrolledBatches.map(b => b.batchId);

  // Get purchased videos/courses
  const purchases = await Payment.findAll({
    where: {
      studentId,
      status: 'completed',
      itemType: { [Op.in]: ['video', 'playlist', 'course'] }
    },
    attributes: ['itemId', 'itemType']
  });
  const purchasedVideoIds = purchases.filter(p => p.itemType === 'video').map(p => p.itemId);
  const purchasedPlaylistIds = purchases.filter(p => p.itemType === 'playlist').map(p => p.itemId);

  // Build query
  const where = {
    isApproved: true,
    status: 'ready',
    [Op.or]: [
      { visibility: 'public' },
      { batchId: { [Op.in]: batchIds } },
      { id: { [Op.in]: purchasedVideoIds } },
      { playlistId: { [Op.in]: purchasedPlaylistIds } }
    ]
  };

  if (batchId) {
    where.batchId = batchId;
  }

  if (playlistId) {
    where.playlistId = playlistId;
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  const videos = await RecordedContent.findAll({
    where,
    include: [
      { model: User, as: 'uploader', attributes: ['id', 'name'] },
      { model: Batch, as: 'batch', attributes: ['id', 'name'] },
      { model: Playlist, as: 'playlist', attributes: ['id', 'title'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Add progress info for each video
  const videosWithProgress = await Promise.all(videos.map(async (video) => {
    const progress = await VideoProgress.findOne({
      where: { userId: studentId, recordedContentId: video.id }
    });

    return {
      ...video.toJSON(),
      progress: progress || null
    };
  }));

  res.status(200).json({
    success: true,
    data: { videos: videosWithProgress }
  });
});

module.exports = {
  updateVideoProgress,
  getVideoProgress,
  getWatchHistory,
  changeVisibility,
  approvePaidContent,
  createPlaylist,
  addVideoToPlaylist,
  getVideoAnalytics,
  getStudentAccessibleVideos
};
