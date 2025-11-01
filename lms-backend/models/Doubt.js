const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doubt = sequelize.define('Doubt', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id'
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
  batchId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    },
    field: 'batch_id'
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'content',
      key: 'id'
    },
    field: 'content_id'
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
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000]
    }
  },
  category: {
    type: DataTypes.ENUM('conceptual', 'technical', 'assignment', 'exam', 'other'),
    allowNull: false,
    defaultValue: 'conceptual'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    allowNull: false,
    defaultValue: 'open'
  },
  resolvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'resolved_by'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at'
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT, // JSON array of tags
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_public'
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
  tableName: 'doubts',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['course_id']
    },
    {
      fields: ['batch_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['category']
    },
    {
      fields: ['priority']
    }
  ]
});

module.exports = Doubt;
