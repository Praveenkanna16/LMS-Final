const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Caption = sequelize.define('Caption', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  videoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'videos',
      key: 'id'
    }
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  format: {
    type: DataTypes.ENUM('srt', 'vtt', 'sub'),
    allowNull: false
  }
}, {
  tableName: 'captions',
  timestamps: true
});

module.exports = Caption;
