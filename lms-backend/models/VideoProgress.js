const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * VideoProgress Model
 * Tracks student progress while watching recorded videos
 */
const VideoProgress = sequelize.define('VideoProgress', {
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
  recordedContentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'recorded_content',
      key: 'id'
    }
  },
  currentTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Current playback position in seconds'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total video duration in seconds'
  },
  watchedPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Percentage of video watched'
  },
  watchedSegments: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of watched time segments [{start: 0, end: 30}, ...]'
  },
  totalWatchTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total time spent watching in seconds (excluding replays)'
  },
  completionStatus: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
    defaultValue: 'not_started'
  },
  lastWatchedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  playbackSpeed: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    comment: 'Last used playback speed'
  },
  quality: {
    type: DataTypes.STRING,
    defaultValue: 'auto',
    comment: 'Last used video quality'
  },
  isDownloaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether video is downloaded for offline viewing'
  },
  downloadedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional tracking data'
  }
}, {
  timestamps: true,
  tableName: 'video_progress',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'recordedContentId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['recordedContentId']
    },
    {
      fields: ['completionStatus']
    }
  ]
});

// Hooks to update completion status
VideoProgress.beforeSave(async (videoProgress) => {
  // Calculate watched percentage if duration is available
  if (videoProgress.duration && videoProgress.currentTime) {
    videoProgress.watchedPercentage = (videoProgress.currentTime / videoProgress.duration) * 100;
  }

  // Update completion status based on watched percentage
  if (videoProgress.watchedPercentage >= 90) {
    videoProgress.completionStatus = 'completed';
    if (!videoProgress.completedAt) {
      videoProgress.completedAt = new Date();
    }
  } else if (videoProgress.watchedPercentage > 0) {
    videoProgress.completionStatus = 'in_progress';
  }
});

module.exports = VideoProgress;
