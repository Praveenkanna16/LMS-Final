const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumPost = sequelize.define('ForumPost', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 5000]
    }
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'forum_posts',
      key: 'id'
    },
    field: 'parent_id',
    comment: 'ID of parent post for replies'
  },
  isAnswer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_answer',
    comment: 'Whether this post is marked as the answer'
  },
  upvotes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  downvotes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'hidden', 'deleted', 'pinned'),
    allowNull: false,
    defaultValue: 'active'
  },
  tags: {
    type: DataTypes.TEXT, // JSON array of tags
    allowNull: true
  },
  attachments: {
    type: DataTypes.TEXT, // JSON array of attachment URLs
    allowNull: true
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_edited'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at'
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
  tableName: 'forum_posts',
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
      fields: ['parent_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_answer']
    }
  ]
});

module.exports = ForumPost;
