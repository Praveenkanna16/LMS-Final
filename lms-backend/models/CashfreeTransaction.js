const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashfreeTransaction = sequelize.define('CashfreeTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paymentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'payments',
      key: 'id'
    }
  },
  cfOrderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Cashfree order ID'
  },
  cfPaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Cashfree payment ID'
  },
  cfTxnId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Cashfree transaction ID'
  },
  orderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  orderCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentGroup: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gatewayResponse: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Full gateway response'
  },
  webhookSignature: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'PAID', 'EXPIRED', 'CANCELLED', 'FAILED'),
    defaultValue: 'ACTIVE'
  },
  paymentTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  settlementTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'cashfree_transactions'
});

module.exports = CashfreeTransaction;
