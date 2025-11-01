const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActiveSession = sequelize.define('ActiveSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sessionToken: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  deviceInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'active_sessions',
  timestamps: true
});

module.exports = ActiveSession;
