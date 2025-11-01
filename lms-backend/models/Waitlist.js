const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Waitlist = sequelize.define('Waitlist', {
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
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'batch_id'
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('waiting', 'enrolled', 'cancelled'),
    defaultValue: 'waiting'
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
  tableName: 'waitlist',
  timestamps: true,
  underscored: true
});

module.exports = Waitlist;
