const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const chunksDir = path.join(uploadsDir, 'chunks');

[uploadsDir, videosDir, thumbnailsDir, chunksDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

// File filter for images (thumbnails)
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};

// Storage configuration for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for thumbnails
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbnailsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `thumbnail-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for chunk uploads
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadId = req.body.uploadId;
    const chunkDir = path.join(chunksDir, uploadId);
    
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    
    cb(null, chunkDir);
  },
  filename: (req, file, cb) => {
    const chunkIndex = req.body.chunkIndex;
    cb(null, `chunk-${chunkIndex}`);
  }
});

// Video upload configuration
const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB max file size
  }
});

// Thumbnail upload configuration
const thumbnailUpload = multer({
  storage: thumbnailStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Chunk upload configuration
const chunkUpload = multer({
  storage: chunkStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per chunk
  }
});

module.exports = {
  videoUpload,
  thumbnailUpload,
  chunkUpload,
  videosDir,
  thumbnailsDir,
  chunksDir
};
