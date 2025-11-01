const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Revenue = sequelize.define('Revenue', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'payments',
      key: 'id'
    },
    field: 'payment_id'
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'teacher_id'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  platformShare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'platform_share',
    validate: {
      min: 0
    }
  },
  teacherShare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'teacher_share',
    validate: {
      min: 0
    }
  },
  source: {
    type: DataTypes.ENUM('platform', 'teacher'),
    allowNull: false,
    comment: 'Source of the student (platform or teacher)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'paid'),
    allowNull: false,
    defaultValue: 'pending'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at'
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
  tableName: 'revenues',
  timestamps: true,
  indexes: [
    {
      fields: ['payment_id']
    },
    {
      fields: ['teacher_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['source']
    }
  ]
});

module.exports = Revenue;
