const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllLiveClasses,
  createLiveSession,
  getBatchLiveClasses,
  joinLiveClass,
  endLiveClass,
  updateLiveClass,
  deleteLiveClass
} = require('../controllers/liveClassController');

const router = express.Router();

// Validation rules
const createSessionValidation = [
  body('batchId')
    .notEmpty()
    .withMessage('Batch ID is required'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Invalid start time format'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('zoomLink')
    .optional()
    .isURL()
    .withMessage('Invalid Google Meet link URL')
];

const sessionIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid session ID')
];

// Public routes (with auth)
router.get('/', auth.authMiddleware, getAllLiveClasses);

// Teacher/Admin routes
router.post('/', 
  auth.authMiddleware, 
  auth.requireRole('teacher', 'admin'), 
  createSessionValidation, 
  createLiveSession
);

// Batch-specific routes
router.get('/batch/:batchId', auth.authMiddleware, getBatchLiveClasses);

// Session-specific routes
router.get('/:id/join', auth.authMiddleware, sessionIdValidation, joinLiveClass);
router.put('/:id/end', 
  auth.authMiddleware, 
  auth.requireRole('teacher', 'admin'), 
  sessionIdValidation, 
  endLiveClass
);
router.put('/:id', 
  auth.authMiddleware, 
  auth.requireRole('teacher', 'admin'), 
  sessionIdValidation, 
  updateLiveClass
);
router.delete('/:id', 
  auth.authMiddleware, 
  auth.requireRole('teacher', 'admin'), 
  sessionIdValidation, 
  deleteLiveClass
);

// Legacy routes for backward compatibility
router.post('/create-meeting', auth.authMiddleware, auth.requireRole('teacher'), createLiveSession);
router.get('/:meetingId/join', auth.authMiddleware, joinLiveClass);

module.exports = router;
