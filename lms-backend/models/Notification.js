const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 1000]
    }
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'recipient_id', // Map to actual database column
    onDelete: 'CASCADE'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'sender_id', // Map to actual database column
    onDelete: 'SET NULL'
  },
  type: {
    type: DataTypes.ENUM(
      'class_reminder',
      'assignment_due',
      'grade_released',
      'payment_received',
      'payout_approved',
      'batch_joined',
      'achievement_earned',
      'system_announcement',
      'course_update',
      'live_class',
      'assessment_reminder',
      'payment_reminder',
      'welcome',
      'profile_update'
    ),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('academic', 'financial', 'social', 'system', 'achievement'),
    defaultValue: 'system'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  isUrgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  relatedCourseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'id'
    },
    field: 'related_course_id' // Map to actual database column
  },
  relatedBatchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    },
    field: 'related_batch_id' // Map to actual database column
  },
  relatedAssessmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'assessments',
      key: 'id'
    },
    field: 'related_assessment_id' // Map to actual database column
  },
  relatedPaymentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'payments',
      key: 'id'
    },
    field: 'related_payment_id' // Map to actual database column
  },
  channels: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{"email":true,"push":true,"sms":false,"inApp":true}'
  },
  scheduledFor: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'scheduled_for' // Map to actual database column
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
    defaultValue: 'pending'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read' // Map to actual database column
  },
  actionRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  actionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  actionText: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{}'
  },
  delivery: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{"emailSent":false,"pushSent":false,"smsSent":false,"attempts":0}'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at' // Map to actual database column
  },
  groupId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isGroupNotification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['recipient_id'] },
    { fields: ['sender_id'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['is_read'] },
    { fields: ['scheduled_for'] },
    { fields: ['expires_at'] },
    { fields: ['created_at'] }
  ]
});

// Hooks
Notification.beforeUpdate(async (notification) => {
  if (notification.changed('status')) {
    if (notification.status === 'sent' && !notification.sentAt) {
      notification.sentAt = new Date();
    } else if (notification.status === 'delivered' && !notification.deliveredAt) {
      notification.deliveredAt = new Date();
    }
  }

  if (notification.changed('isRead') && notification.isRead && !notification.readAt) {
    notification.readAt = new Date();
  }
});

// Static methods
Notification.getUnreadCount = async function(recipientId) {
  const now = new Date();

  return await this.count({
    where: {
      recipient_id: recipientId,
      is_read: false,
      status: { [Op.in]: ['sent', 'delivered'] },
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: now } }
      ]
    }
  });
};

Notification.getNotificationsByUser = async function(recipientId, options = {}) {
  const whereClause = {
    recipient_id: recipientId,
    status: { [Op.in]: ['sent', 'delivered'] },
    [Op.or]: [
      { expires_at: null },
      { expires_at: { [Op.gt]: new Date() } }
    ]
  };

  if (options.type) whereClause.type = options.type;
  if (options.read !== undefined) whereClause.is_read = options.read;

  return await this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.skip || 0
  });
};

// Instance methods
Notification.prototype.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

Notification.prototype.markAsDelivered = async function(channel = 'inApp') {
  this.status = 'delivered';
  this.deliveredAt = new Date();

  // Update delivery status based on channel
  const delivery = JSON.parse(this.delivery || '{}');
  if (channel === 'email') {
    delivery.emailSent = true;
    delivery.emailSentAt = new Date().toISOString();
  } else if (channel === 'push') {
    delivery.pushSent = true;
    delivery.pushSentAt = new Date().toISOString();
  } else if (channel === 'sms') {
    delivery.smsSent = true;
    delivery.smsSentAt = new Date().toISOString();
  }
  delivery.attempts = (delivery.attempts || 0) + 1;
  delivery.lastAttemptAt = new Date().toISOString();

  this.delivery = JSON.stringify(delivery);
  await this.save();
  return this;
};

Notification.prototype.scheduleDelivery = async function(deliveryTime) {
  this.scheduledFor = deliveryTime;
  this.status = 'pending';
  await this.save();
  return this;
};

// Associations
Notification.associate = (models) => {
  Notification.belongsTo(models.User, { foreignKey: 'recipientId', as: 'recipient' });
  Notification.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
  Notification.belongsTo(models.Course, { foreignKey: 'relatedCourseId', as: 'relatedCourse' });
  Notification.belongsTo(models.Batch, { foreignKey: 'relatedBatchId', as: 'relatedBatch' });
  Notification.belongsTo(models.Assessment, { foreignKey: 'relatedAssessmentId', as: 'relatedAssessment' });
  Notification.belongsTo(models.Payment, { foreignKey: 'relatedPaymentId', as: 'relatedPayment' });
};

module.exports = Notification;
