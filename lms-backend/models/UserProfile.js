const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
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
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  linkedin: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  github: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Kolkata'
  },
  learningStyle: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  pace: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  difficulty: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserProfile;
