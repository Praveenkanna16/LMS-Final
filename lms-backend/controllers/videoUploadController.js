const { RecordedContent, User, Progress } = require('../models');
const cloudStorageService = require('../services/cloudStorageService');
const { videoUpload, chunkUpload, chunksDir, videosDir } = require('../config/multer');
const logger = require('../config/logger');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced Video Upload Controller
 * Supports chunked uploads, cloud storage, and progress tracking
 */

// Temporary storage for upload sessions
const uploadSessions = new Map();

// ==================== CHUNKED UPLOAD ====================

/**
 * Initialize chunked upload session
 */
const initializeChunkedUpload = async (req, res) => {
  try {
    const { fileName, fileSize, totalChunks, metadata } = req.body;
    const userId = req.user.id;

    if (!fileName || !fileSize || !totalChunks) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const uploadId = uuidv4();
    
    uploadSessions.set(uploadId, {
      uploadId,
      userId,
      fileName,
      fileSize,
      totalChunks: parseInt(totalChunks),
      uploadedChunks: [],
      metadata: metadata || {},
      startTime: new Date(),
      status: 'initialized'
    });

    logger.info(`Chunked upload initialized: ${uploadId} for user ${userId}`);

    res.json({
      success: true,
      uploadId,
      message: 'Upload session initialized'
    });
  } catch (error) {
    logger.error('Error initializing chunked upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize upload'
    });
  }
};

/**
 * Upload chunk
 */
const uploadChunk = async (req, res) => {
  try {
    chunkUpload.single('chunk')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      const { uploadId, chunkIndex } = req.body;
      
      if (!uploadSessions.has(uploadId)) {
        return res.status(404).json({
          success: false,
          message: 'Upload session not found'
        });
      }

      const session = uploadSessions.get(uploadId);
      session.uploadedChunks.push(parseInt(chunkIndex));
      session.uploadedChunks.sort((a, b) => a - b);

      const progress = (session.uploadedChunks.length / session.totalChunks) * 100;

      logger.info(`Chunk ${chunkIndex} uploaded for session ${uploadId} (${progress.toFixed(2)}%)`);

      res.json({
        success: true,
        progress: progress.toFixed(2),
        uploadedChunks: session.uploadedChunks.length,
        totalChunks: session.totalChunks,
        message: 'Chunk uploaded successfully'
      });
    });
  } catch (error) {
    logger.error('Error uploading chunk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload chunk'
    });
  }
};

/**
 * Complete chunked upload and merge chunks
 */
const completeChunkedUpload = async (req, res) => {
  try {
    const { uploadId } = req.body;
    const userId = req.user.id;

    if (!uploadSessions.has(uploadId)) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found'
      });
    }

    const session = uploadSessions.get(uploadId);
    
    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify all chunks uploaded
    if (session.uploadedChunks.length !== session.totalChunks) {
      return res.status(400).json({
        success: false,
        message: `Missing chunks. Uploaded: ${session.uploadedChunks.length}/${session.totalChunks}`
      });
    }

    // Merge chunks
    const chunkDir = path.join(chunksDir, uploadId);
    const finalFilePath = path.join(videosDir, `${uploadId}-${session.fileName}`);
    const writeStream = fsSync.createWriteStream(finalFilePath);

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `chunk-${i}`);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Clean up chunks
    await fs.rm(chunkDir, { recursive: true, force: true });

    logger.info(`Chunks merged successfully: ${uploadId}`);

    // Upload to cloud storage
    try {
      const cloudResult = await cloudStorageService.uploadVideo(finalFilePath, {
        title: session.metadata.title,
        description: session.metadata.description
      });

      // Create database record
      const recordedContent = await RecordedContent.create({
        title: session.metadata.title || session.fileName,
        description: session.metadata.description,
        courseId: session.metadata.courseId,
        batchId: session.metadata.batchId,
        teacherId: userId,
        videoUrl: cloudResult.streamingUrl || cloudResult.url,
        thumbnailUrl: cloudResult.thumbnailUrl,
        duration: cloudResult.duration,
        fileSize: session.fileSize,
        format: path.extname(session.fileName).substring(1),
        status: 'ready',
        metadata: {
          cloudProvider: process.env.VIDEO_STORAGE_PROVIDER || 'cloudflare',
          cloudVideoId: cloudResult.videoId || cloudResult.key,
          uploadId
        }
      });

      // Clean up local file (optional - keep for backup)
      // await fs.unlink(finalFilePath);

      uploadSessions.delete(uploadId);

      res.json({
        success: true,
        message: 'Video uploaded successfully',
        data: recordedContent
      });
    } catch (cloudError) {
      logger.error('Cloud upload failed:', cloudError);
      
      // Keep local file as fallback
      const recordedContent = await RecordedContent.create({
        title: session.metadata.title || session.fileName,
        description: session.metadata.description,
        courseId: session.metadata.courseId,
        batchId: session.metadata.batchId,
        teacherId: userId,
        videoUrl: `/uploads/videos/${uploadId}-${session.fileName}`,
        fileSize: session.fileSize,
        format: path.extname(session.fileName).substring(1),
        status: 'ready',
        metadata: {
          cloudProvider: 'local',
          uploadId,
          cloudUploadFailed: true
        }
      });

      uploadSessions.delete(uploadId);

      res.json({
        success: true,
        message: 'Video uploaded locally (cloud upload failed)',
        data: recordedContent,
        warning: 'Cloud storage upload failed, video stored locally'
      });
    }
  } catch (error) {
    logger.error('Error completing chunked upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete upload'
    });
  }
};

/**
 * Get upload progress
 */
const getUploadProgress = async (req, res) => {
  try {
    const { uploadId } = req.params;

    if (!uploadSessions.has(uploadId)) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found'
      });
    }

    const session = uploadSessions.get(uploadId);
    const progress = (session.uploadedChunks.length / session.totalChunks) * 100;

    res.json({
      success: true,
      uploadId,
      progress: progress.toFixed(2),
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
      fileName: session.fileName,
      fileSize: session.fileSize,
      status: session.status
    });
  } catch (error) {
    logger.error('Error getting upload progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload progress'
    });
  }
};

/**
 * Cancel upload
 */
const cancelUpload = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user.id;

    if (!uploadSessions.has(uploadId)) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found'
      });
    }

    const session = uploadSessions.get(uploadId);
    
    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Clean up chunks
    const chunkDir = path.join(chunksDir, uploadId);
    try {
      await fs.rm(chunkDir, { recursive: true, force: true });
    } catch (err) {
      logger.warn(`Failed to clean up chunks for ${uploadId}:`, err);
    }

    uploadSessions.delete(uploadId);

    logger.info(`Upload cancelled: ${uploadId}`);

    res.json({
      success: true,
      message: 'Upload cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel upload'
    });
  }
};

// ==================== SIMPLE UPLOAD (Non-chunked) ====================

/**
 * Simple video upload (for smaller files)
 */
const uploadVideo = async (req, res) => {
  try {
    videoUpload.single('video')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No video file provided'
        });
      }

      const { title, description, courseId, batchId } = req.body;
      const userId = req.user.id;

      // Upload to cloud storage
      try {
        const cloudResult = await cloudStorageService.uploadVideo(req.file.path, {
          title,
          description
        });

        // Create database record
        const recordedContent = await RecordedContent.create({
          title: title || req.file.originalname,
          description,
          courseId,
          batchId,
          teacherId: userId,
          videoUrl: cloudResult.streamingUrl || cloudResult.url,
          thumbnailUrl: cloudResult.thumbnailUrl,
          duration: cloudResult.duration,
          fileSize: req.file.size,
          format: path.extname(req.file.originalname).substring(1),
          status: 'ready',
          metadata: {
            cloudProvider: process.env.VIDEO_STORAGE_PROVIDER || 'cloudflare',
            cloudVideoId: cloudResult.videoId || cloudResult.key
          }
        });

        res.json({
          success: true,
          message: 'Video uploaded successfully',
          data: recordedContent
        });
      } catch (cloudError) {
        logger.error('Cloud upload failed:', cloudError);
        
        // Keep local file as fallback
        const recordedContent = await RecordedContent.create({
          title: title || req.file.originalname,
          description,
          courseId,
          batchId,
          teacherId: userId,
          videoUrl: `/uploads/videos/${req.file.filename}`,
          fileSize: req.file.size,
          format: path.extname(req.file.originalname).substring(1),
          status: 'ready',
          metadata: {
            cloudProvider: 'local',
            cloudUploadFailed: true
          }
        });

        res.json({
          success: true,
          message: 'Video uploaded locally (cloud upload failed)',
          data: recordedContent,
          warning: 'Cloud storage upload failed, video stored locally'
        });
      }
    });
  } catch (error) {
    logger.error('Error uploading video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video'
    });
  }
};

module.exports = {
  // Chunked upload
  initializeChunkedUpload,
  uploadChunk,
  completeChunkedUpload,
  getUploadProgress,
  cancelUpload,
  
  // Simple upload
  uploadVideo
};
