const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketReply = sequelize.define('TicketReply', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ticket_id',
    references: {
      model: 'support_tickets',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_internal',
    comment: 'Internal notes not visible to student'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'ticket_replies'
});

module.exports = TicketReply;
