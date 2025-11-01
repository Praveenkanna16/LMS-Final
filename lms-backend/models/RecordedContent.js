const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecordedContent = sequelize.define('RecordedContent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    }
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  liveSessionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'live_sessions',
      key: 'id'
    }
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'File size in bytes'
  },
  format: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'mp4'
  },
  quality: {
    type: DataTypes.ENUM('360p', '480p', '720p', '1080p'),
    defaultValue: '720p'
  },
  status: {
    type: DataTypes.ENUM('processing', 'ready', 'failed'),
    defaultValue: 'processing'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  downloads: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  visibility: {
    type: DataTypes.ENUM('public', 'batch', 'paid', 'private'),
    defaultValue: 'batch',
    comment: 'Access control: public=everyone, batch=enrolled students, paid=purchase required, private=teacher only'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Price in rupees if visibility is paid'
  },
  isPaidContent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Quick flag for paid content filtering'
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Admin approval for paid content'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  playlistId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Group videos into playlists/courses'
  },
  orderInPlaylist: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  isFreePreview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Allow free preview of paid content'
  },
  previewDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Free preview duration in seconds'
  },
  allowDownload: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Allow students to download for offline viewing'
  },
  transcriptUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'AI-generated transcript file URL'
  },
  subtitleUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'SRT/VTT subtitle file URL'
  },
  totalWatchTime: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Total watch time in seconds across all students'
  },
  avgWatchPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Average completion percentage'
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total revenue generated from this video'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Video metadata like resolution, codec, etc.'
  }
}, {
  timestamps: true,
  tableName: 'recorded_content'
});

RecordedContent.belongsTo(require('./User'), { foreignKey: 'teacherId', as: 'uploader' });
module.exports = RecordedContent;
