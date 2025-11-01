const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payout = sequelize.define('Payout', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('requested', 'approved', 'processing', 'completed', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'requested'
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'requested_at'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'rejected_at'
  },
  paymentMethod: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'payment_method',
    comment: 'Bank transfer, UPI, etc.'
  },
  paymentDetails: {
    type: DataTypes.TEXT, // JSON payment details
    allowNull: false,
    field: 'payment_details',
    comment: 'Bank account or UPI details'
  },
  transactionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'transaction_id'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
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
  tableName: 'payouts',
  timestamps: true,
  indexes: [
    {
      fields: ['teacher_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['requested_at']
    },
    {
      fields: ['payment_method']
    }
  ]
});

module.exports = Payout;
