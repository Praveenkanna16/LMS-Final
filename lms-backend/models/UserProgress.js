const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProgress = sequelize.define('UserProgress', {
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
    onDelete: 'CASCADE'
  },
  coursesEnrolled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  coursesCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalStudyTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  averageScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_progress',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserProgress;
