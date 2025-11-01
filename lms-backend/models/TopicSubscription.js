const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TopicSubscription = sequelize.define('TopicSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userId' // Map to actual database column
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'topicId' // Map to actual database column
  },
  channels: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['database', 'push', 'email'],
    comment: 'Array of notification channels for this subscription'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'topic_subscriptions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'topicId'],
      unique: true
    },
    {
      fields: ['userId']
    },
    {
      fields: ['topicId']
    }
  ]
});

module.exports = TopicSubscription;
