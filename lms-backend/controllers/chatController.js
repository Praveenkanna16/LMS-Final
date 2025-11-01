const ChatMessage = require('../models/ChatMessage');
const logger = require('../config/logger');

exports.saveMessage = async (req, res) => {
  try {
    const { batchId, message, type } = req.body;
    const userId = req.user.id;

    const chatMessage = await ChatMessage.create({
      batchId,
      userId,
      message,
      type: type || 'public',
      isGif: message.startsWith('http') && (message.includes('giphy') || message.includes('.gif'))
    });

    res.status(201).json({
      success: true,
      message: 'Message saved successfully',
      data: chatMessage
    });
  } catch (error) {
    logger.error('Error saving chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save message',
      error: error.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { limit = 100, type = 'public' } = req.query;

    const messages = await ChatMessage.findAll({
      where: {
        batchId,
        type
      },
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    logger.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can delete messages'
      });
    }

    await ChatMessage.destroy({
      where: { id: messageId }
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};
