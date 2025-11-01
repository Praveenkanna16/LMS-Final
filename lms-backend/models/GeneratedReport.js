const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeneratedReport = sequelize.define('GeneratedReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('attendance', 'revenue', 'teacher_performance', 'student_progress', 'system_usage', 'batch_analytics'),
    allowNull: false
  },
  format: {
    type: DataTypes.ENUM('pdf', 'excel', 'csv'),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  parameters: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Report generation parameters like date range, filters'
  },
  generatedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('generating', 'completed', 'failed'),
    defaultValue: 'generating'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Auto-delete date for temporary reports'
  }
}, {
  timestamps: true,
  tableName: 'generated_reports'
});

module.exports = GeneratedReport;
