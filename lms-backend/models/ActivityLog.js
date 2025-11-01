const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER
  },
  details: {
    type: DataTypes.TEXT
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    defaultValue: 'success'
  }
}, {
  tableName: 'activity_logs',
  timestamps: true
});

module.exports = ActivityLog;
