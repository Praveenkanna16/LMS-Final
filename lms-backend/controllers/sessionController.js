const ActiveSession = require('../models/ActiveSession');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await ActiveSession.findAll({
      where: { userId, isActive: true },
      order: [['lastActivity', 'DESC']]
    });

    const sessionsWithDetails = sessions.map(session => ({
      id: session.id,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      lastActivity: session.lastActivity,
      isCurrent: session.sessionToken === req.headers.authorization?.split(' ')[1]
    }));

    res.json({ sessions: sessionsWithDetails });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ message: 'Failed to get sessions' });
  }
};

exports.terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await ActiveSession.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.isActive = false;
    await session.save();

    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    logger.error('Terminate session error:', error);
    res.status(500).json({ message: 'Failed to terminate session' });
  }
};

exports.terminateAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.headers.authorization?.split(' ')[1];

    await ActiveSession.update(
      { isActive: false },
      {
        where: {
          userId,
          sessionToken: { [require('sequelize').Op.ne]: currentToken },
          isActive: true
        }
      }
    );

    res.json({ message: 'All other sessions terminated successfully' });
  } catch (error) {
    logger.error('Terminate all sessions error:', error);
    res.status(500).json({ message: 'Failed to terminate sessions' });
  }
};

exports.createSession = async (userId, token, req) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const session = await ActiveSession.create({
      userId,
      sessionToken: token,
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      expiresAt,
      isActive: true
    });

    return session;
  } catch (error) {
    logger.error('Create session error:', error);
    throw error;
  }
};

exports.updateSessionActivity = async (token) => {
  try {
    await ActiveSession.update(
      { lastActivity: new Date() },
      { where: { sessionToken: token, isActive: true } }
    );
  } catch (error) {
    logger.error('Update session activity error:', error);
  }
};

exports.cleanupExpiredSessions = async () => {
  try {
    const now = new Date();
    
    await ActiveSession.update(
      { isActive: false },
      {
        where: {
          expiresAt: { [require('sequelize').Op.lt]: now },
          isActive: true
        }
      }
    );

    logger.info('Expired sessions cleaned up');
  } catch (error) {
    logger.error('Cleanup sessions error:', error);
  }
};

// Run cleanup every hour
setInterval(exports.cleanupExpiredSessions, 60 * 60 * 1000);
