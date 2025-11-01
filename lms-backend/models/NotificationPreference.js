const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
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
    },
    field: 'user_id'
  },
  type: {
    type: DataTypes.ENUM('general', 'assessment', 'batch', 'course', 'payment', 'live_class'),
    allowNull: false
  },
  channels: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('channels');
      return rawValue ? JSON.parse(rawValue) : ['database'];
    },
    set(value) {
      this.setDataValue('channels', JSON.stringify(value));
    }
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  schedule: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('schedule');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('schedule', JSON.stringify(value));
    }
  }
}, {
  tableName: 'notification_preferences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = NotificationPreference;
