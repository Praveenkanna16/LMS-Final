const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const FCMToken = require('../models/FCMToken');
const logger = require('../config/logger');

// Register FCM token
router.post('/register', auth.authMiddleware, async (req, res) => {
  try {
    const { token, deviceInfo } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Update or create token
    const [fcmToken, created] = await FCMToken.findOrCreate({
      where: { token },
      defaults: {
        userId,
        deviceInfo,
        isActive: true,
        lastUsed: new Date()
      }
    });

    if (!created) {
      // Update existing token
      await fcmToken.update({
        userId,
        deviceInfo,
        isActive: true,
        lastUsed: new Date()
      });
    }

    res.json({ message: 'FCM token registered successfully', fcmToken });
  } catch (error) {
    logger.error('Error registering FCM token:', error);
    res.status(500).json({ message: 'Error registering FCM token' });
  }
});

// Unregister FCM token
router.delete('/unregister/:token', auth.authMiddleware, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    const fcmToken = await FCMToken.findOne({
      where: { token, userId }
    });

    if (!fcmToken) {
      return res.status(404).json({ message: 'Token not found' });
    }

    await fcmToken.update({ isActive: false });
    res.json({ message: 'FCM token unregistered successfully' });
  } catch (error) {
    logger.error('Error unregistering FCM token:', error);
    res.status(500).json({ message: 'Error unregistering FCM token' });
  }
});

// Get user's FCM tokens
router.get('/tokens', auth.authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const tokens = await FCMToken.findAll({
      where: { userId, isActive: true },
      attributes: ['id', 'token', 'deviceInfo', 'lastUsed', 'createdAt', 'updatedAt']
    });

    res.json(tokens);
  } catch (error) {
    logger.error('Error fetching FCM tokens:', error);
    res.status(500).json({ message: 'Error fetching FCM tokens' });
  }
});

module.exports = router;
