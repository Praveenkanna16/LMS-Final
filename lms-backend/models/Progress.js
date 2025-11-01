const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Progress extends Model {}

Progress.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  batchId: {
    type: DataTypes.UUID,
    references: {
      model: 'batches',
      key: 'id'
    }
  },
  completionStatus: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
    defaultValue: 'not_started',
    allowNull: false
  },
  timeSpent: {
    type: DataTypes.INTEGER, // Time in seconds
    defaultValue: 0,
    allowNull: false
  },
  score: {
    type: DataTypes.FLOAT,
    validate: {
      min: 0,
      max: 100
    }
  },
  notes: {
    type: DataTypes.TEXT
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  completedAt: {
    type: DataTypes.DATE
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Progress',
  tableName: 'progress',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['moduleId']
    },
    {
      fields: ['courseId']
    },
    {
      fields: ['batchId']
    },
    {
      fields: ['completionStatus']
    },
    {
      fields: ['userId', 'moduleId'],
      unique: true
    }
  ]
});

// Define model associations
Progress.associate = function(models) {
  // Progress belongs to a User
  Progress.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // Progress belongs to a Course
  Progress.belongsTo(models.Course, {
    foreignKey: 'courseId',
    as: 'course'
  });

  // Progress belongs to a Batch (optional)
  Progress.belongsTo(models.Batch, {
    foreignKey: 'batchId',
    as: 'batch'
  });
};

module.exports = Progress;
