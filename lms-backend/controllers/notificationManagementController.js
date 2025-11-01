const { 
  NotificationTemplate, 
  NotificationLog, 
  User, 
  Notification, 
  FCMToken,
  NotificationPreference 
} = require('../models');
const { sendNotificationEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const { sendPushNotification } = require('../services/fcmService');
const { Op } = require('sequelize');

// Get all notification templates
const getNotificationTemplates = async (req, res) => {
  try {
    const templates = await NotificationTemplate.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification templates'
    });
  }
};

// Create notification template
const createNotificationTemplate = async (req, res) => {
  try {
    const {
      name,
      type,
      channel,
      subject,
      content,
      variables,
      isActive = true
    } = req.body;

    const template = await NotificationTemplate.create({
      name,
      type,
      channel,
      subject,
      content,
      variables: JSON.stringify(variables || []),
      isActive,
      createdBy: req.user.id
    });

    const templateWithCreator = await NotificationTemplate.findByPk(template.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      data: templateWithCreator,
      message: 'Notification template created successfully'
    });
  } catch (error) {
    console.error('Error creating notification template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification template'
    });
  }
};

// Update notification template
const updateNotificationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      channel,
      subject,
      content,
      variables,
      isActive
    } = req.body;

    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Notification template not found'
      });
    }

    await template.update({
      name: name || template.name,
      type: type || template.type,
      channel: channel || template.channel,
      subject: subject || template.subject,
      content: content || template.content,
      variables: variables ? JSON.stringify(variables) : template.variables,
      isActive: isActive !== undefined ? isActive : template.isActive
    });

    const updatedTemplate = await NotificationTemplate.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Notification template updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification template'
    });
  }
};

// Delete notification template
const deleteNotificationTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Notification template not found'
      });
    }

    await template.destroy();

    res.json({
      success: true,
      message: 'Notification template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification template'
    });
  }
};

// Send notification using template
const sendNotificationFromTemplate = async (req, res) => {
  try {
    const { templateId, recipients, variables = {} } = req.body;

    const template = await NotificationTemplate.findByPk(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Notification template not found'
      });
    }

    if (!template.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Notification template is inactive'
      });
    }

    // Process recipients (can be user IDs, roles, or 'all')
    let targetUsers = [];
    if (recipients.includes('all')) {
      targetUsers = await User.findAll({ where: { isActive: true } });
    } else if (recipients.includes('students')) {
      targetUsers = await User.findAll({ where: { role: 'student', isActive: true } });
    } else if (recipients.includes('teachers')) {
      targetUsers = await User.findAll({ where: { role: 'teacher', isActive: true } });
    } else {
      // Specific user IDs
      targetUsers = await User.findAll({ where: { id: recipients, isActive: true } });
    }

    const sentNotifications = [];
    const failedNotifications = [];

    for (const user of targetUsers) {
      try {
        // Replace variables in content
        let processedContent = template.content;
        let processedSubject = template.subject;

        Object.keys(variables).forEach(key => {
          const placeholder = `{{${key}}}`;
          processedContent = processedContent.replace(new RegExp(placeholder, 'g'), variables[key]);
          processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), variables[key]);
        });

        // Replace user-specific variables
        processedContent = processedContent.replace(/{{user\.name}}/g, user.name);
        processedContent = processedContent.replace(/{{user\.email}}/g, user.email);
        processedSubject = processedSubject.replace(/{{user\.name}}/g, user.name);

        let deliveryStatus = 'pending';
        let errorMessage = null;

        // Send notification based on channel
        if (template.channel === 'email') {
          try {
            await sendNotificationEmail(user.email, processedSubject, processedContent);
            deliveryStatus = 'sent';
          } catch (error) {
            deliveryStatus = 'failed';
            errorMessage = error.message;
          }
        } else if (template.channel === 'sms') {
          try {
            await sendSMS(user.phone, processedContent);
            deliveryStatus = 'sent';
          } catch (error) {
            deliveryStatus = 'failed';
            errorMessage = error.message;
          }
        } else if (template.channel === 'push') {
          try {
            const tokens = await FCMToken.findAll({ where: { userId: user.id } });
            if (tokens.length > 0) {
              for (const token of tokens) {
                await sendPushNotification(token.token, processedSubject, processedContent);
              }
              deliveryStatus = 'sent';
            } else {
              deliveryStatus = 'failed';
              errorMessage = 'No FCM tokens found for user';
            }
          } catch (error) {
            deliveryStatus = 'failed';
            errorMessage = error.message;
          }
        } else if (template.channel === 'in-app') {
          try {
            await Notification.create({
              userId: user.id,
              title: processedSubject,
              message: processedContent,
              type: template.type,
              isRead: false
            });
            deliveryStatus = 'sent';
          } catch (error) {
            deliveryStatus = 'failed';
            errorMessage = error.message;
          }
        }

        // Log the notification
        const notificationLog = await NotificationLog.create({
          userId: user.id,
          templateId: template.id,
          channel: template.channel,
          subject: processedSubject,
          content: processedContent,
          deliveryStatus,
          errorMessage,
          sentAt: deliveryStatus === 'sent' ? new Date() : null
        });

        if (deliveryStatus === 'sent') {
          sentNotifications.push({ userId: user.id, logId: notificationLog.id });
        } else {
          failedNotifications.push({ userId: user.id, logId: notificationLog.id, error: errorMessage });
        }

      } catch (error) {
        failedNotifications.push({ userId: user.id, error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        totalRecipients: targetUsers.length,
        sentCount: sentNotifications.length,
        failedCount: failedNotifications.length,
        sentNotifications,
        failedNotifications
      },
      message: `Notification sent to ${sentNotifications.length} out of ${targetUsers.length} recipients`
    });

  } catch (error) {
    console.error('Error sending notification from template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
};

// Get notification logs with filters
const getNotificationLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      channel,
      deliveryStatus,
      templateId,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (channel) whereClause.channel = channel;
    if (deliveryStatus) whereClause.deliveryStatus = deliveryStatus;
    if (templateId) whereClause.templateId = templateId;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: logs } = await NotificationLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email']
        },
        {
          model: NotificationTemplate,
          as: 'template',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification logs'
    });
  }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Get total notifications sent
    const totalSent = await NotificationLog.count({
      where: {
        ...whereClause,
        deliveryStatus: 'sent'
      }
    });

    // Get failed notifications
    const totalFailed = await NotificationLog.count({
      where: {
        ...whereClause,
        deliveryStatus: 'failed'
      }
    });

    // Get notifications by channel
    const byChannel = await NotificationLog.findAll({
      where: whereClause,
      attributes: [
        'channel',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['channel'],
      raw: true
    });

    // Get notifications by template
    const byTemplate = await NotificationLog.findAll({
      where: whereClause,
      include: [{
        model: NotificationTemplate,
        as: 'template',
        attributes: ['name']
      }],
      attributes: [
        'templateId',
        [sequelize.fn('COUNT', sequelize.col('NotificationLog.id')), 'count']
      ],
      group: ['templateId', 'template.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('NotificationLog.id')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      success: true,
      data: {
        period,
        totalSent,
        totalFailed,
        successRate: totalSent + totalFailed > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(2) : 0,
        byChannel,
        topTemplates: byTemplate
      }
    });
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
};

module.exports = {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  sendNotificationFromTemplate,
  getNotificationLogs,
  getNotificationStats
};
