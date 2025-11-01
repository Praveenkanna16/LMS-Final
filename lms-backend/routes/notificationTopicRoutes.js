const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const NotificationTopic = require('../models/NotificationTopic');
const TopicSubscription = require('../models/TopicSubscription');
const NotificationService = require('../services/notificationService');
const logger = require('../config/logger');

// List all available topics
router.get('/topics', auth.authMiddleware, async (req, res) => {
  try {
    const topics = await NotificationTopic.findAll({
      where: { isPublic: true },
      attributes: ['id', 'name', 'displayName', 'description', 'type', 'metadata']
    });

    res.json(topics);
  } catch (error) {
    logger.error('Error fetching notification topics:', error);
    res.status(500).json({ message: 'Error fetching notification topics' });
  }
});

// Get user's topic subscriptions
router.get('/topics/subscriptions', auth.authMiddleware, async (req, res) => {
  try {
    const subscriptions = await TopicSubscription.findAll({
      where: { userId: req.user.id, isActive: true },
      include: [{
        model: NotificationTopic,
        attributes: ['name', 'displayName', 'description', 'type', 'metadata']
      }]
    });

    res.json(subscriptions);
  } catch (error) {
    logger.error('Error fetching topic subscriptions:', error);
    res.status(500).json({ message: 'Error fetching topic subscriptions' });
  }
});

// Subscribe to a topic
router.post('/topics/subscribe/:topicName', auth.authMiddleware, async (req, res) => {
  try {
    const { topicName } = req.params;
    const { channels } = req.body;

    if (channels && !Array.isArray(channels)) {
      return res.status(400).json({
        message: 'Channels must be an array'
      });
    }

    const subscription = await NotificationService.subscribeTopic(
      req.user.id,
      topicName,
      channels
    );

    res.json({ message: 'Successfully subscribed to topic', subscription });
  } catch (error) {
    logger.error('Error subscribing to topic:', error);
    res.status(500).json({ message: 'Error subscribing to topic' });
  }
});

// Unsubscribe from a topic
router.post('/topics/unsubscribe/:topicName', auth.authMiddleware, async (req, res) => {
  try {
    const { topicName } = req.params;

    await NotificationService.unsubscribeTopic(req.user.id, topicName);

    res.json({ message: 'Successfully unsubscribed from topic' });
  } catch (error) {
    logger.error('Error unsubscribing from topic:', error);
    res.status(500).json({ message: 'Error unsubscribing from topic' });
  }
});

// Admin routes for topic management
router.post('/topics', auth.authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to manage topics' });
    }

    const { name, displayName, type, description, metadata, isPublic } = req.body;

    // Validate required fields
    if (!name || !displayName || !type) {
      return res.status(400).json({
        message: 'Name, displayName, and type are required'
      });
    }

    const topic = await NotificationService.createTopic(
      name,
      displayName,
      type,
      description,
      metadata,
      isPublic
    );

    res.json(topic);
  } catch (error) {
    logger.error('Error creating notification topic:', error);
    res.status(500).json({ message: 'Error creating notification topic' });
  }
});

// Send notification to a topic
router.post('/topics/:topicName/notify', auth.authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to send topic notifications' });
    }

    const { topicName } = req.params;
    const { title, message, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: 'Title and message are required'
      });
    }

    await NotificationService.sendTopicNotification(
      topicName,
      title,
      message,
      metadata
    );

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    logger.error('Error sending topic notification:', error);
    res.status(500).json({ message: 'Error sending topic notification' });
  }
});

module.exports = router;
