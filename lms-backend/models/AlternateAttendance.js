const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AlternateAttendance = sequelize.define('AlternateAttendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  originalBatchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'original_batch_id'
  },
  attendedBatchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'attended_batch_id'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'approved_by'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'alternate_attendance',
  timestamps: true,
  underscored: true
});

module.exports = AlternateAttendance;
