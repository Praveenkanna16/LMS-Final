const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const {
  getUserPreferences,
  updateUserPreferences,
  getAllUsersPreferences,
  bulkUpdatePreferences,
  resetToDefault
} = require('../controllers/notificationPreferenceController');
const { subscribeTopic, unsubscribeTopic } = require('../services/fcmService');

// All notification preference routes require authentication
router.use(authMiddleware);

// Get user notification preferences
router.get('/user', getUserPreferences);

// Update user notification preferences
router.put('/user', updateUserPreferences);

// Reset to default preferences
router.post('/user/reset', resetToDefault);

// Get all users notification preferences (admin only)
router.get('/all', requireRole('admin'), getAllUsersPreferences);

// Bulk update preferences (admin only)
router.post('/bulk-update', requireRole('admin'), bulkUpdatePreferences);

// Subscribe to FCM topic
router.post('/subscribe', async (req, res) => {
  try {
    const { fcmToken, topic } = req.body;
    
    if (!fcmToken || !topic) {
      return res.status(400).json({
        success: false,
        message: 'FCM token and topic are required'
      });
    }

    await subscribeTopic(fcmToken, topic);
    
    res.json({
      success: true,
      message: `Subscribed to ${topic} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe',
      error: error.message
    });
  }
});

// Unsubscribe from FCM topic
router.post('/unsubscribe', async (req, res) => {
  try {
    const { fcmToken, topic } = req.body;
    
    if (!fcmToken || !topic) {
      return res.status(400).json({
        success: false,
        message: 'FCM token and topic are required'
      });
    }

    await unsubscribeTopic(fcmToken, topic);
    
    res.json({
      success: true,
      message: `Unsubscribed from ${topic} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe',
      error: error.message
    });
  }
});

module.exports = router;