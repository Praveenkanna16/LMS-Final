const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'batch_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('public', 'teacher-only'),
    defaultValue: 'public'
  },
  isGif: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_gif'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'chat_messages',
  timestamps: false
});

module.exports = ChatMessage;
