const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    },
    field: 'course_id'
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
  contentType: {
    type: DataTypes.ENUM('video', 'document', 'text', 'quiz', 'assignment', 'link'),
    allowNull: false,
    defaultValue: 'text',
    field: 'content_type'
  },
  contentUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'content_url'
  },
  contentText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'content_text'
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isPreview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_preview'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  prerequisites: {
    type: DataTypes.TEXT, // JSON array of content IDs
    allowNull: true
  },
  learningObjectives: {
    type: DataTypes.TEXT, // JSON array
    allowNull: true,
    field: 'learning_objectives'
  },
  resources: {
    type: DataTypes.TEXT, // JSON array of resource objects
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
  tableName: 'content',
  timestamps: true,
  indexes: [
    {
      fields: ['course_id']
    },
    {
      fields: ['content_type']
    },
    {
      fields: ['order']
    }
  ]
});

module.exports = Content;
