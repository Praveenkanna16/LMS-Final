const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assessmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assessment_id' // Map to actual database column
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
      'coding'
    ),
    allowNull: false
  },
  // Options stored as JSON string for SQLite
  options: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('options');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(value));
    }
  },
  correctAnswer: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0
    }
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  hint: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Metadata stored as JSON string for SQLite
  metadata: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const rawValue = this.getDataValue('metadata');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('metadata', JSON.stringify(value));
    }
  },
  // Statistics stored as JSON string for SQLite
  stats: {
    type: DataTypes.TEXT,
    defaultValue: '{"timesAnswered":0,"timesCorrect":0,"averageScore":0,"averageTime":0}',
    get() {
      const rawValue = this.getDataValue('stats');
      return rawValue ? JSON.parse(rawValue) : {
        timesAnswered: 0,
        timesCorrect: 0,
        averageScore: 0,
        averageTime: 0
      };
    },
    set(value) {
      this.setDataValue('stats', JSON.stringify(value));
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // Feedback rules stored as JSON string for SQLite
  feedbackRules: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('feedbackRules');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('feedbackRules', JSON.stringify(value));
    }
  }
}, {
  tableName: 'questions',
  timestamps: true,
  indexes: [
    {
      fields: ['assessment_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['difficulty']
    }
  ]
});

// Instance methods
Question.prototype.updateStats = function(isCorrect, score, time) {
  const stats = this.stats;
  
  stats.timesAnswered++;
  if (isCorrect) stats.timesCorrect++;
  
  // Update average score
  stats.averageScore = (
    (stats.averageScore * (stats.timesAnswered - 1) + score) / 
    stats.timesAnswered
  );
  
  // Update average time
  if (time) {
    stats.averageTime = (
      (stats.averageTime * (stats.timesAnswered - 1) + time) / 
      stats.timesAnswered
    );
  }
  
  this.stats = stats;
};

// Static methods
Question.createBatch = async function(questions, assessmentId, transaction = null) {
  const createdQuestions = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    question.assessmentId = assessmentId;
    question.sortOrder = i;
    
    const createdQuestion = await this.create(question, {
      transaction
    });
    
    createdQuestions.push(createdQuestion);
  }
  
  return createdQuestions;
};

module.exports = Question;