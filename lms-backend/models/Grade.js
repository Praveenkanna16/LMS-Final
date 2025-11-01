const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grade = sequelize.define('Grade', {
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
  assessmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'assessments',
      key: 'id'
    }
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  maxScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'grades',
  timestamps: true
});

module.exports = Grade;
