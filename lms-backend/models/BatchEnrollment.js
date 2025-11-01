const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BatchEnrollment = sequelize.define('BatchEnrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  batchId: {
    type: sequelize.getDialect() === 'postgres' ? DataTypes.UUID : DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'batches',
      key: 'id'
    },
    field: 'batch_id' // Map to actual database column
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'student_id', // Map to actual database column
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'completed', 'dropped'),
    defaultValue: 'active'
  },
  enrolledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'enrolled_at' // Map to actual database column
  },
  progressModulesCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'progress_modules_completed' // Map to actual database column
  },
  progressTotalModules: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'progress_total_modules' // Map to actual database column
  },
  progressOverall: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'progress_overall' // Map to actual database column
  },
  progressLastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'progress_last_activity' // Map to actual database column
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at' // Map to actual database column
  }
}, {
  tableName: 'batch_enrollments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['batch_id'] },
    { fields: ['student_id'] },
    { fields: ['batch_id', 'student_id'], unique: true }
  ]
});

// Associations
BatchEnrollment.associate = (models) => {
  BatchEnrollment.belongsTo(models.Batch, {
    foreignKey: 'batchId',
    as: 'batch'
  });
  BatchEnrollment.belongsTo(models.User, {
    foreignKey: 'studentId',
  as: 'user'
  });
};

module.exports = BatchEnrollment;
