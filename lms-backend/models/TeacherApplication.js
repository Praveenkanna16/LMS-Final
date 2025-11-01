const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherApplication = sequelize.define('TeacherApplication', {
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
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expertise: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Years of experience'
  },
  qualifications: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  introduction: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  portfolioUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewComments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 60.00,
    comment: 'Teacher commission percentage'
  }
}, {
  timestamps: true,
  tableName: 'teacher_applications'
});

module.exports = TeacherApplication;
