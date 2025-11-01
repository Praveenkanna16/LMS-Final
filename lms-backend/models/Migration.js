const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Migration = sequelize.define('Migration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'rolled_back'),
    defaultValue: 'pending'
  },
  executedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rolledBackAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  executedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'migrations_log',
  timestamps: true
});

module.exports = Migration;
