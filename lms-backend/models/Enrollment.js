const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'batches',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending', 'completed'),
    defaultValue: 'active'
  },
  enrolledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'enrollments',
  timestamps: true
});

module.exports = Enrollment;
