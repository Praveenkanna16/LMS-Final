const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationTopic = sequelize.define('NotificationTopic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique identifier for the topic (e.g., course_updates_123)'
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Human-readable name for the topic (e.g., "Updates for JavaScript Basics")'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of what kind of notifications this topic includes'
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of topic (e.g., course, batch, general)'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional topic metadata (e.g., courseId, batchId)'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether users can freely subscribe to this topic'
  }
}, {
  tableName: 'notification_topics',
  timestamps: true,
  indexes: [
    {
      fields: ['name'],
      unique: true
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = NotificationTopic;
