const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParentAccess = sequelize.define('ParentAccess', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  parentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  parentPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accessCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique code for parent login'
  },
  relationship: {
    type: DataTypes.ENUM('father', 'mother', 'guardian'),
    allowNull: false
  },
  notificationPreferences: {
    type: DataTypes.JSON,
    defaultValue: {
      attendance: true,
      assessment: true,
      payment: true,
      announcements: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastAccessAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'parent_access',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['accessCode']
    },
    {
      fields: ['studentId']
    },
    {
      fields: ['parentEmail']
    }
  ]
});

/**
 * Generate unique access code
 */
ParentAccess.generateAccessCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'PAR-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = ParentAccess;
