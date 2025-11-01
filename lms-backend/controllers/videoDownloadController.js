const crypto = require('crypto');
const cloudStorageService = require('../services/cloudStorageService');
const logger = require('../config/logger');

// Store active download tokens (in production, use Redis)
const downloadTokens = new Map();

// Token expiry time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

exports.generateDownloadToken = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    // Check if user has access to this video
    // TODO: Add video access validation

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + TOKEN_EXPIRY;

    // Store token
    downloadTokens.set(token, {
      videoId,
      userId,
      expiresAt
    });

    // Clean up expired tokens every 5 minutes
    if (downloadTokens.size > 100) {
      const now = Date.now();
      for (const [key, value] of downloadTokens.entries()) {
        if (value.expiresAt < now) {
          downloadTokens.delete(key);
        }
      }
    }

    // Get video details from database
    const { Video } = require('../models');
    const video = await Video.findByPk(videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Generate signed URL from cloud storage
    let downloadUrl;
    
    if (video.storageProvider === 's3') {
      downloadUrl = await cloudStorageService.getS3SignedUrl(video.storageKey, 3600);
    } else {
      // For Cloudflare or local storage
      downloadUrl = `${process.env.API_URL}/api/videos/download/${token}`;
    }

    res.json({
      downloadUrl,
      expiresAt,
      expiresIn: TOKEN_EXPIRY / 1000 // seconds
    });
  } catch (error) {
    logger.error('Download token generation error:', error);
    res.status(500).json({ message: 'Failed to generate download token' });
  }
};

exports.downloadVideo = async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token
    const tokenData = downloadTokens.get(token);

    if (!tokenData) {
      return res.status(404).json({ message: 'Invalid or expired download token' });
    }

    if (tokenData.expiresAt < Date.now()) {
      downloadTokens.delete(token);
      return res.status(410).json({ message: 'Download token has expired' });
    }

    // Get video
    const { Video } = require('../models');
    const video = await Video.findByPk(tokenData.videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Stream video file
    const fs = require('fs');
    const path = require('path');
    
    const videoPath = path.join(__dirname, '../uploads', video.filePath);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': fileSize,
      'Content-Disposition': `attachment; filename="${video.title}.mp4"`
    });

    const readStream = fs.createReadStream(videoPath);
    readStream.pipe(res);

    // Delete token after use (one-time download)
    downloadTokens.delete(token);

    logger.info(`Video downloaded: ${video.id} by user ${tokenData.userId}`);
  } catch (error) {
    logger.error('Video download error:', error);
    res.status(500).json({ message: 'Failed to download video' });
  }
};
