const FCMToken = require('../models/FCMToken');
const logger = require('../config/logger');

exports.registerToken = async (req, res) => {
  try {
    const { token, deviceType, deviceId } = req.body;
    const userId = req.user.id;

    if (!token || !deviceType) {
      return res.status(400).json({ message: 'Token and deviceType are required' });
    }

    // Check if token already exists
    const existingToken = await FCMToken.findOne({ where: { token } });
    
    if (existingToken) {
      // Update existing token
      existingToken.userId = userId;
      existingToken.deviceType = deviceType;
      existingToken.deviceId = deviceId;
      existingToken.isActive = true;
      existingToken.lastUsed = new Date();
      await existingToken.save();
      
      return res.json({ message: 'FCM token updated', token: existingToken });
    }

    // Create new token
    const fcmToken = await FCMToken.create({
      userId,
      token,
      deviceType,
      deviceId,
      isActive: true
    });

    res.status(201).json({ message: 'FCM token registered', token: fcmToken });
  } catch (error) {
    logger.error('FCM token registration error:', error);
    res.status(500).json({ message: 'Failed to register FCM token' });
  }
};

exports.unregisterToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const fcmToken = await FCMToken.findOne({ where: { token } });
    
    if (!fcmToken) {
      return res.status(404).json({ message: 'Token not found' });
    }

    fcmToken.isActive = false;
    await fcmToken.save();

    res.json({ message: 'FCM token unregistered' });
  } catch (error) {
    logger.error('FCM token unregistration error:', error);
    res.status(500).json({ message: 'Failed to unregister FCM token' });
  }
};

exports.getUserTokens = async (req, res) => {
  try {
    const userId = req.user.id;

    const tokens = await FCMToken.findAll({
      where: { userId, isActive: true }
    });

    res.json({ tokens });
  } catch (error) {
    logger.error('Failed to get user tokens:', error);
    res.status(500).json({ message: 'Failed to get tokens' });
  }
};
