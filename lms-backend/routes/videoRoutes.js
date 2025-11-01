const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const videoUploadController = require('../controllers/videoUploadController');
const videoPlayerController = require('../controllers/videoPlayerController');

// ==================== VIDEO UPLOAD ROUTES ====================

// Initialize chunked upload
router.post(
  '/upload/chunked/initialize',
  auth.authMiddleware,
  auth.requireRole(['teacher', 'admin']),
  videoUploadController.initializeChunkedUpload
);

// Upload chunk
router.post(
  '/upload/chunked/chunk',
  auth.authMiddleware,
  auth.requireRole(['teacher', 'admin']),
  videoUploadController.uploadChunk
);

// Complete chunked upload
router.post(
  '/upload/chunked/complete',
  auth.authMiddleware,
  auth.requireRole(['teacher', 'admin']),
  videoUploadController.completeChunkedUpload
);

// Get upload progress
router.get(
  '/upload/chunked/progress/:uploadId',
  auth.authMiddleware,
  auth.requireRole(['teacher', 'admin']),
  videoUploadController.getUploadProgress
);

// Cancel upload
router.delete(
  '/upload/chunked/cancel/:uploadId',
  auth.authMiddleware,
  auth.requireRole(['teacher', 'admin']),
  videoUploadController.cancelUpload
);

// Simple video upload (non-chunked)
router.post(
  '/upload/simple',
  auth.authMiddleware,
  auth.requireRole(['teacher', 'admin']),
  videoUploadController.uploadVideo
);

// ==================== VIDEO PLAYBACK ROUTES ====================

// Get video for playback
router.get(
  '/:id/play',
  auth.authMiddleware,
  videoPlayerController.getVideoForPlayback
);

// Update video progress
router.post(
  '/:id/progress',
  auth.authMiddleware,
  videoPlayerController.updateVideoProgress
);

// Mark video as completed
router.post(
  '/:id/complete',
  auth.authMiddleware,
  videoPlayerController.markVideoCompleted
);

// Get student's video progress
router.get(
  '/my-progress',
  auth.authMiddleware,
  videoPlayerController.getStudentVideoProgress
);

// Mark video as downloaded
router.post(
  '/:id/download',
  auth.authMiddleware,
  videoPlayerController.markVideoDownloaded
);

// Get downloaded videos
router.get(
  '/my-downloads',
  auth.authMiddleware,
  videoPlayerController.getDownloadedVideos
);

module.exports = router;
