const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPreferences = sequelize.define('UserPreferences', {
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
  learningStyle: {
    type: DataTypes.ENUM('visual', 'auditory', 'kinesthetic', 'reading', 'mixed'),
    defaultValue: 'mixed'
  },
  pace: {
    type: DataTypes.ENUM('slow', 'medium', 'fast'),
    defaultValue: 'medium'
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard', 'adaptive'),
    defaultValue: 'adaptive'
  },
  notificationEmail: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationPush: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationSms: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notificationReminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationAchievements: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  privacyProfileVisibility: {
    type: DataTypes.ENUM('public', 'private', 'connections'),
    defaultValue: 'public'
  },
  privacyShowProgress: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  privacyShowAchievements: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'user_preferences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserPreferences;
