const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string'
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'system_settings',
  timestamps: true
});

module.exports = SystemSettings;
