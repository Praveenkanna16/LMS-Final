const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserGamification = sequelize.define('UserGamification', {
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
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  experienceToNext: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  levelProgress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  streakCurrent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  streakLongest: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  streakLastActivity: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'streakLastActivity' // Map to actual database column
  }
}, {
  tableName: 'user_gamification',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserGamification;
