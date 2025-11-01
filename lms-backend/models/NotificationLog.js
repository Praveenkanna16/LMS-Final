const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationLog = sequelize.define('NotificationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  notificationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'notifications',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  channel: {
    type: DataTypes.ENUM('email', 'sms', 'push', 'in-app'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked'),
    defaultValue: 'pending'
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Email address, phone number, or device token'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  openedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clickedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Provider message ID for tracking'
  }
}, {
  timestamps: true,
  tableName: 'notification_logs'
});

module.exports = NotificationLog;
