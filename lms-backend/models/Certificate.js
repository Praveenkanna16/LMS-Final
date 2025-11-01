const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define('Certificate', {
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
    allowNull: true,
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
  certificateId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'certificate_id'
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
  certificateType: {
    type: DataTypes.ENUM('completion', 'excellence', 'participation', 'achievement'),
    allowNull: false,
    defaultValue: 'completion',
    field: 'certificate_type'
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  grade: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  issuedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'issued_by'
  },
  issuedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'issued_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  },
  template: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Certificate template used'
  },
  metadata: {
    type: DataTypes.TEXT, // JSON metadata
    allowNull: true
  },
  verificationUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'verification_url'
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_revoked'
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'revoked_at'
  },
  revokedReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'revoked_reason'
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
  tableName: 'certificates',
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
      fields: ['certificate_id'],
      unique: true
    },
    {
      fields: ['issued_at']
    },
    {
      fields: ['is_revoked']
    }
  ]
});

module.exports = Certificate;
