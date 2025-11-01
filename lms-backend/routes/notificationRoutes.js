const express = require('express');
const { param, body } = require('express-validator');
const {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createSystemNotification,
  createTeacherNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getReadReceipts
} = require('../controllers/notificationController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules - accept either numeric IDs (SQLite/integer) or 24-char hex Mongo IDs
const notificationIdValidation = [
  param('id')
    .custom(value => {
      if (typeof value !== 'string') throw new Error('Invalid notification ID');
      // numeric IDs (e.g. "123")
      if (/^\d+$/.test(value)) return true;
      // 24-char hex (Mongo ObjectId)
      if (/^[a-fA-F0-9]{24}$/.test(value)) return true;
      throw new Error('Invalid notification ID');
    })
    .withMessage('Invalid notification ID')
];

const createSystemNotificationValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('message')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),

  body('recipients')
    .isArray({ min: 1 })
    .withMessage('Recipients must be a non-empty array'),

  body('recipients.*')
    .custom(val => {
      if (typeof val !== 'string' && typeof val !== 'number') return false;
      const s = String(val);
      return /^\d+$/.test(s) || /^[a-fA-F0-9]{24}$/.test(s);
    })
    .withMessage('Each recipient must be a valid user ID'),

  body('type')
    .isIn([
      'class_reminder',
      'assignment_due',
      'grade_released',
      'payment_received',
      'payout_approved',
      'batch_joined',
      'achievement_earned',
      'system_announcement',
      'course_update',
      'live_class',
      'assessment_reminder',
      'payment_reminder',
      'welcome',
      'profile_update'
    ])
    .withMessage('Invalid notification type'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority')
];

// All notification routes require authentication
router.use(authMiddleware);

// Get notifications
router.get('/', getNotifications);
router.get('/preferences', getNotificationPreferences);

// Single notification
router.get('/:id', notificationIdValidation, getNotification);

// Get read receipts for a notification
router.get('/:id/receipts', notificationIdValidation, getReadReceipts);

// Mark as read
router.put('/:id/read', notificationIdValidation, markAsRead);
router.put('/mark-all-read', markAllAsRead);

// Delete notifications
router.delete('/:id', notificationIdValidation, deleteNotification);
router.delete('/', deleteAllNotifications);

// Update preferences
router.put('/preferences', updateNotificationPreferences);

// Admin routes
router.post('/system', requireRole('admin'), createSystemNotificationValidation, createSystemNotification);

// Allow teachers to send notifications to their students or admins
const createTeacherNotificationValidation = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title required'),
  body('message').isLength({ min: 5 }).withMessage('Message required'),
];

router.post('/send', requireRole('teacher'), createTeacherNotificationValidation, (req, res, next) => {
  return createTeacherNotification(req, res, next);
});

module.exports = router;
