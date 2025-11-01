const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Backup = sequelize.define('Backup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('full', 'incremental', 'manual'),
      allowNull: false,
      defaultValue: 'manual'
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Size in bytes'
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'in_progress'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recordsCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of records in backup'
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Path to backup file on server'
    },
    checksum: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'MD5 checksum for integrity verification'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'backups',
    timestamps: true,
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

module.exports = Backup;
