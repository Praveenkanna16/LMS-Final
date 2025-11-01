const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FCMToken = sequelize.define('FCMToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUsed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'lastUsed' // Map to actual database column
  }
}, {
  tableName: 'fcm_tokens',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['token']
    }
  ],
  constraints: false // Disable automatic constraints to avoid duplicate foreign keys
});

module.exports = FCMToken;
