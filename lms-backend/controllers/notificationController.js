const Notification = require('../models/Notification');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const socketManager = require('../services/socketManager');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Support mailbox selection: by default show inbox (received notifications).
  // Allow `box=sent` to return notifications sent by the current user (useful for teachers to view history).
  const box = String(req.query.box || '').toLowerCase();
  let whereClause = {};

  if (box === 'sent') {
    whereClause.senderId = req.user.id;
  } else {
    whereClause.recipientId = req.user.id;
  }

  if (req.query.type) whereClause.type = req.query.type;
  if (req.query.read !== undefined) whereClause.isRead = req.query.read === 'true';
  if (req.query.category) whereClause.category = req.query.category;
  if (req.query.priority) whereClause.priority = req.query.priority;

  const notifications = await Notification.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'email']
      },
      {
        model: User,
        as: 'recipient',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  const total = await Notification.count({ where: whereClause });
  // For sent mailbox, unread count doesn't apply the same way; return 0 for sent.
  const unreadCount = box === 'sent' ? 0 : await Notification.getUnreadCount(req.user.id);

  // For sent notifications, add read count statistics
  let notificationsWithStats = notifications;
  if (box === 'sent') {
    notificationsWithStats = await Promise.all(notifications.map(async (notif) => {
      const notifData = notif.toJSON();
      // Get read count for this notification (count all notifications with same title/message sent by this sender)
      const readCount = await Notification.count({
        where: {
          senderId: req.user.id,
          title: notif.title,
          message: notif.message,
          isRead: true,
          sentAt: {
            [Op.gte]: new Date(notif.sentAt || notif.createdAt).getTime() - 1000, // Within 1 second
            [Op.lte]: new Date(notif.sentAt || notif.createdAt).getTime() + 1000
          }
        }
      });
      
      const totalRecipients = await Notification.count({
        where: {
          senderId: req.user.id,
          title: notif.title,
          message: notif.message,
          sentAt: {
            [Op.gte]: new Date(notif.sentAt || notif.createdAt).getTime() - 1000,
            [Op.lte]: new Date(notif.sentAt || notif.createdAt).getTime() + 1000
          }
        }
      });
      
      return {
        ...notifData,
        readCount,
        recipientsCount: totalRecipients
      };
    }));
  }

  res.json({
    success: true,
    data: {
      notifications: notificationsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        total,
        unread: unreadCount,
        read: total - unreadCount
      }
    }
  });
});

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
const getNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    where: {
      id: req.params.id,
      recipientId: req.user.id
    },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'email']
      },
      {
        model: User,
        as: 'recipient',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.json({
    success: true,
    data: { notification }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    where: {
      id: req.params.id,
      recipientId: req.user.id
    }
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const [affectedRows] = await Notification.update(
    {
      isRead: true,
      readAt: new Date()
    },
    {
      where: {
        recipientId: req.user.id,
        isRead: false
      }
    }
  );

  logger.info(`Marked ${affectedRows} notifications as read for user ${req.user.email}`);

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: {
      markedCount: affectedRows
    }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    where: {
      id: req.params.id,
      recipientId: req.user.id
    }
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  await notification.destroy();

  logger.info(`Notification deleted: ${notification.id} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const { type, read } = req.query;

  let whereClause = { recipientId: req.user.id };

  if (type) whereClause.type = type;
  if (read !== undefined) whereClause.isRead = read === 'true';

  const deletedCount = await Notification.destroy({
    where: whereClause
  });

  logger.info(`Deleted ${deletedCount} notifications for user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Notifications deleted successfully',
    data: {
      deletedCount
    }
  });
});

// @desc    Create system notification (Admin only)
// @route   POST /api/notifications/system
// @access  Private/Admin
const createSystemNotification = asyncHandler(async (req, res) => {
  const { title, message, recipients, type, priority, channels, scheduledFor } = req.body;

  if (!recipients || recipients.length === 0) {
    throw new AppError('Recipients are required', 400);
  }

  const notificationsData = recipients.map(recipientId => ({
    title,
    message,
    recipientId,
    senderId: req.user.id,
    type,
    priority: priority || 'medium',
    channels: channels || JSON.stringify({
      email: true,
      push: true,
      sms: false,
      inApp: true
    }),
    scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
    status: 'sent',
    sentAt: new Date()
  }));

  const notifications = await Notification.bulkCreate(notificationsData);

  logger.info(`System notification created by ${req.user.email} for ${recipients.length} recipients`);

  res.status(201).json({
    success: true,
    message: 'System notifications created successfully',
    data: {
      recipientCount: recipients.length,
      notificationsCreated: notifications.length
    }
  });
});

// @desc    Teacher sends notification (to students/admin)
// @route   POST /api/notifications/send
// @access  Private/Teacher
const createTeacherNotification = asyncHandler(async (req, res) => {
  const { title, message, target = 'students', batchId, userIds = [] } = req.body;

  // Debug logging: show incoming payload for troubleshooting
  logger.info(`createTeacherNotification called by ${req.user?.email || req.user?.id || 'unknown'} with target=${target} batchId=${batchId} userIds=${JSON.stringify(userIds)}`);

  // Determine recipients
  let recipients = [];
  if (target === 'students' && batchId) {
    // fetch students in batch (use studentId column)
    const BatchEnrollment = require('../models/BatchEnrollment');
    const enrollments = await BatchEnrollment.findAll({ where: { batchId }, attributes: ['studentId'] });
    recipients = enrollments.map(e => ({ id: e.studentId || e.student_id || e.student }));
  } else if (target === 'specific' && userIds.length > 0) {
    recipients = userIds.map(id => ({ id }));
  } else if (target === 'admin') {
    const User = require('../models/User');
    const admins = await User.findAll({ where: { role: 'admin', status: 'active' }, attributes: ['id'] });
    recipients = admins.map(a => ({ id: a.id }));
  }

  if (!recipients || recipients.length === 0) {
    logger.warn(`createTeacherNotification: resolved 0 recipients for target=${target} batchId=${batchId} userIds=${JSON.stringify(userIds)}`);
    return res.status(400).json({ success: false, message: 'No recipients found for the selected target' });
  }

  // Create notifications and emit via socketManager
  const Notification = require('../models/Notification');
  const created = [];
  for (const r of recipients) {
    const n = await Notification.create({
      recipientId: r.id,
      senderId: req.user.id,
      title,
      message,
      type: 'system_announcement',
      priority: 'medium',
      status: 'sent',
      isRead: false,
      sentAt: new Date()
    });
    created.push(n);

    // Emit to user if connected
    try {
      socketManager.sendNotificationToUser(String(r.id), n);
    } catch (e) {
      logger.warn('socket emit failed for user', r.id, e.message || e);
    }
  }

  res.status(201).json({ success: true, message: `Notification sent to ${created.length} user(s)`, data: { count: created.length } });
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
const getNotificationPreferences = asyncHandler(async (req, res) => {
  // Note: User model doesn't have preferences field yet
  // This would need to be added to the User model
  const preferences = {
    email: true,
    push: true,
    sms: false,
    reminders: true,
    achievements: true
  };

  res.json({
    success: true,
    data: { preferences }
  });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;

  // Note: User model doesn't have preferences field yet
  // This would need to be added to the User model
  // For now, just log the update and return success
  logger.info(`Notification preferences updated for user ${req.user.email}`);

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      preferences
    }
  });
});

// @desc    Get read receipts for a notification
// @route   GET /api/notifications/:id/receipts
// @access  Private
const getReadReceipts = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  
  // Get the notification to verify sender
  const notification = await Notification.findOne({
    where: { id: notificationId }
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  // Only sender or admin can see read receipts
  if (notification.senderId !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view read receipts', 403);
  }

  // Get all notifications with same title/message sent around the same time (batch send)
  const relatedNotifications = await Notification.findAll({
    where: {
      senderId: notification.senderId,
      title: notification.title,
      message: notification.message,
      sentAt: {
        [Op.gte]: new Date(notification.sentAt || notification.createdAt).getTime() - 1000,
        [Op.lte]: new Date(notification.sentAt || notification.createdAt).getTime() + 1000
      }
    },
    include: [
      {
        model: User,
        as: 'recipient',
        attributes: ['id', 'name', 'email', 'role']
      }
    ],
    order: [['isRead', 'DESC'], ['readAt', 'DESC']]
  });

  const readReceipts = relatedNotifications.map(notif => ({
    recipientId: notif.recipientId,
    recipientName: notif.recipient?.name || 'Unknown',
    recipientEmail: notif.recipient?.email || 'N/A',
    recipientRole: notif.recipient?.role || 'N/A',
    isRead: notif.isRead,
    readAt: notif.readAt,
    sentAt: notif.sentAt
  }));

  const stats = {
    total: readReceipts.length,
    read: readReceipts.filter(r => r.isRead).length,
    unread: readReceipts.filter(r => !r.isRead).length,
    readPercentage: readReceipts.length > 0 ? Math.round((readReceipts.filter(r => r.isRead).length / readReceipts.length) * 100) : 0
  };

  res.json({
    success: true,
    data: {
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        sentAt: notification.sentAt
      },
      receipts: readReceipts,
      stats
    }
  });
});

module.exports = {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createSystemNotification,
  // allow teachers to send notifications (to students/admins)
  createTeacherNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getReadReceipts
};
