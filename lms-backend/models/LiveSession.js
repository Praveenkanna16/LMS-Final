const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LiveSession = sequelize.define('LiveSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'batches',
      key: 'id'
    },
    field: 'batch_id'
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'teacher_id'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meetingId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'meeting_id' // Zoom meeting ID
  },
  zoomLink: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'zoom_link'
  },
  passcode: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_time'
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'live', 'ended', 'cancelled'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  recordingUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'recording_url'
  },
  isRecorded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_recorded'
  },
  settings: {
    type: DataTypes.TEXT, // JSON for session settings
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
  tableName: 'live_sessions',
  timestamps: true,
  indexes: [
    {
      fields: ['batch_id']
    },
    {
      fields: ['teacher_id']
    },
    {
      fields: ['start_time']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = LiveSession;
