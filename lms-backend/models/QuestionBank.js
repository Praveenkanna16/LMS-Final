const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * QuestionBank Model
 * Centralized repository for reusable questions
 */
const QuestionBank = sequelize.define('QuestionBank', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM(
      'multiple_choice',
      'true_false',
      'short_answer',
      'essay',
      'matching',
      'fill_in_blank',
      'coding',
      'file_upload'
    ),
    allowNull: false
  },
  options: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of answer options for MCQ/matching'
  },
  correctAnswer: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Correct answer(s) - JSON for multiple correct answers'
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0,
      max: 100
    }
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Topic/chapter of the question'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Tags for categorization'
  },
  hint: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Explanation of the correct answer'
  },
  bloomsLevel: {
    type: DataTypes.ENUM('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'),
    allowNull: true,
    comment: "Bloom's Taxonomy level"
  },
  estimatedTime: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    comment: 'Estimated time to answer in seconds'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times used in assessments'
  },
  successRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Percentage of correct answers'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether visible to other teachers'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata (images, code snippets, etc.)'
  }
}, {
  tableName: 'question_bank',
  timestamps: true,
  indexes: [
    { fields: ['teacherId'] },
    { fields: ['courseId'] },
    { fields: ['type'] },
    { fields: ['difficulty'] },
    { fields: ['topic'] },
    { fields: ['isPublic'] }
  ]
});

// Instance methods
QuestionBank.prototype.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
};

QuestionBank.prototype.updateSuccessRate = async function(isCorrect) {
  // Calculate new success rate using exponential moving average
  const alpha = 0.1; // Smoothing factor
  const newRate = isCorrect ? 100 : 0;
  
  if (this.usageCount === 0) {
    this.successRate = newRate;
  } else {
    this.successRate = alpha * newRate + (1 - alpha) * this.successRate;
  }
  
  await this.save();
};

module.exports = QuestionBank;
