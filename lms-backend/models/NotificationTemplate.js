const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationTemplate = sequelize.define('NotificationTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('enrollment', 'payment', 'course', 'live-class', 'general', 'reminder', 'welcome'),
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('email', 'sms', 'push', 'in-app'),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For email and push notifications'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Template content with placeholders like {{name}}, {{course}}'
  },
  variables: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Available template variables'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'notification_templates'
});

module.exports = NotificationTemplate;
