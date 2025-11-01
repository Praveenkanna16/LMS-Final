const express = require('express');
const router = express.Router();
const {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  sendNotificationFromTemplate,
  getNotificationLogs,
  getNotificationStats
} = require('../controllers/notificationManagementController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Notification Templates
router.get('/templates', requireRole(['admin']), getNotificationTemplates);
router.post('/templates', requireRole(['admin']), createNotificationTemplate);
router.put('/templates/:id', requireRole(['admin']), updateNotificationTemplate);
router.delete('/templates/:id', requireRole(['admin']), deleteNotificationTemplate);

// Send Notifications
router.post('/send', requireRole(['admin']), sendNotificationFromTemplate);

// Notification Logs
router.get('/logs', requireRole(['admin']), getNotificationLogs);

// Notification Statistics
router.get('/stats', requireRole(['admin']), getNotificationStats);

module.exports = router;
