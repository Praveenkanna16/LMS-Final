const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('doubt', 'attendance_issue', 'payment_issue', 'technical', 'general'),
    allowNull: false,
    defaultValue: 'general'
  },
  subject: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    allowNull: false,
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'low'
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string with additional data (batchId, sessionId, etc.)'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at'
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'resolved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'support_tickets'
});

module.exports = SupportTicket;
