const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Playlist Model
 * Organize recorded videos into playlists/courses
 */
const Playlist = sequelize.define('Playlist', {
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
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
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
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  visibility: {
    type: DataTypes.ENUM('public', 'batch', 'paid', 'private'),
    defaultValue: 'batch'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalVideos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total duration in seconds'
  },
  totalViews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'English'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'playlists'
});

module.exports = Playlist;
