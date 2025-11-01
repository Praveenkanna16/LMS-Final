const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');

const {
  bulkUserActions,
  sendBulkEmails,
  importCSV,
} = require('../controllers/bulkOperationsController');

const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/csv/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Validation rules
const bulkUserActionsValidation = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds must be a non-empty array'),
  
  body('action')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Invalid action'),
];

const bulkEmailValidation = [
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must be less than 200 characters'),
  
  body('body')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Body must be between 10 and 5000 characters'),
  
  body('recipientType')
    .isIn(['all', 'students', 'teachers', 'selected'])
    .withMessage('Invalid recipient type'),
];

// All bulk operation routes require admin access
router.use(authMiddleware, requireRole('admin'));

// Bulk user actions
router.post('/users', bulkUserActionsValidation, bulkUserActions);

// Bulk emails
router.post('/emails', bulkEmailValidation, sendBulkEmails);

// CSV import
router.post('/import', upload.single('file'), importCSV);

module.exports = router;
