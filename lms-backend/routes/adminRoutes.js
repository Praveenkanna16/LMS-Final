const express = require('express');
const { param, body, query } = require('express-validator');
const {
  getAdminDashboard,
  getSystemAnalytics,
  getAllUsers,
  getLiveClasses,
  getPendingPayouts,
  approvePayout,
  rejectPayout,
  getSystemHealth,
  getActivityLogs,
  getAllNotifications,
  sendNotification,
  scheduleNotification,
  deleteNotification,
  getAllStudents,
  getStudentDetails
} = require('../controllers/adminController');
const {
  getDataStats,
  getBackupHistory,
  createBackup,
  deleteBackup,
  exportDatabase,
  getTableData,
  getAllTables
} = require('../controllers/dataController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const approvePayoutValidation = [
  body('amount')
    .isFloat({ min: 1000 })
    .withMessage('Minimum payout amount is ₹1000')
];

const updateSettingsValidation = [
  body('settings')
    .isObject()
    .withMessage('Settings must be an object')
];

const tableDataValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sortBy').optional().isString().withMessage('SortBy must be a string'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be asc or desc')
];

const sendNotificationValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['system', 'course', 'payment', 'achievement', 'reminder']).withMessage('Invalid notification type'),
  body('target').notEmpty().isIn(['all', 'teachers', 'students', 'specific']).withMessage('Target is required and must be valid'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('userIds').optional().isArray().withMessage('UserIds must be an array')
];

const scheduleNotificationValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('scheduledDate').notEmpty().isISO8601().withMessage('Valid scheduled date is required'),
  body('type').optional().isIn(['system', 'course', 'payment', 'achievement', 'reminder']).withMessage('Invalid notification type'),
  body('target').notEmpty().isIn(['all', 'teachers', 'students', 'specific']).withMessage('Target is required and must be valid'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('userIds').optional().isArray().withMessage('UserIds must be an array')
];

const createBackupValidation = [
  body('type').optional().isIn(['full', 'incremental', 'manual']).withMessage('Invalid backup type'),
  body('description').optional().isString().withMessage('Description must be a string')
];

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// Dashboard and analytics
router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getSystemAnalytics);

// User management
router.get('/users', getAllUsers);

// Student Management
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentDetails);

// Live Classes Management
router.get('/live-classes', getLiveClasses);

// Payout Management
router.get('/payouts', getPendingPayouts);
router.post('/payouts/:payoutId/approve', approvePayout);
router.post('/payouts/:payoutId/reject', rejectPayout);

// System monitoring
router.get('/system/health', getSystemHealth);
router.get('/logs/actions', getActivityLogs);

// Notifications
router.get('/notifications', getAllNotifications);
router.post('/notifications/send', sendNotificationValidation, sendNotification);
router.post('/notifications/schedule', scheduleNotificationValidation, scheduleNotification);
router.delete('/notifications/:id', deleteNotification);

// Data Management
router.get('/data/stats', getDataStats);
router.get('/data/backups', getBackupHistory);
router.post('/data/backups', createBackupValidation, createBackup);
router.delete('/data/backups/:backupId', deleteBackup);
router.get('/data/export', exportDatabase);
router.get('/data/tables', getAllTables);
router.get('/data/tables/:tableName', tableDataValidation, getTableData);

module.exports = router;
