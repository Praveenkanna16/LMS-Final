const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SessionAttendance = sequelize.define('SessionAttendance', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'live_sessions',
      key: 'id'
    },
    field: 'session_id'
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'student_id'
  },
  joinTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'join_time'
  },
  leaveTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'leave_time'
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  attentiveness: {
    type: DataTypes.DECIMAL(3, 2), // 0.00 to 1.00
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    }
  },
  participationScore: {
    type: DataTypes.DECIMAL(3, 2), // 0.00 to 1.00
    allowNull: true,
    field: 'participation_score',
    validate: {
      min: 0,
      max: 1
    }
  },
  metadata: {
    type: DataTypes.TEXT, // JSON metadata
    allowNull: true
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
  tableName: 'session_attendances',
  timestamps: true,
  indexes: [
    {
      fields: ['session_id']
    },
    {
      fields: ['student_id']
    },
    {
      fields: ['session_id', 'student_id'],
      unique: true
    }
  ]
});

module.exports = SessionAttendance;
