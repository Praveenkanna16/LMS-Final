const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getRecordedContent,
  getRecordedContentById,
  uploadRecordedContent,
  updateRecordedContent,
  deleteRecordedContent,
  getContentAnalytics,
  downloadRecordedContent
} = require('../controllers/recordedContentController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/recorded-content');
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `recorded-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only video files
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Apply authentication to all routes
router.use(authMiddleware);

// Content Management
router.get('/', getRecordedContent);
router.get('/analytics', requireRole(['admin']), getContentAnalytics);
router.get('/:id', getRecordedContentById);
router.get('/:id/download', downloadRecordedContent);

// Content Upload & Management (Teachers and Admins only)
router.post('/upload', 
  requireRole(['admin', 'teacher']), 
  upload.single('video'), 
  uploadRecordedContent
);
router.put('/:id', requireRole(['admin', 'teacher']), updateRecordedContent);
router.delete('/:id', requireRole(['admin', 'teacher']), deleteRecordedContent);

module.exports = router;
