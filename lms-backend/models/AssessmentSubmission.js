const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssessmentSubmission = sequelize.define('AssessmentSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assessmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'assessments',
      key: 'id'
    },
    field: 'assessment_id' // Map to actual database column
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id' // Map to actual database column
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'submitted_at' // Map to actual database column
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Time spent in seconds'
  },
  // Answers stored as JSON string for SQLite
  answers: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('answers');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('answers', JSON.stringify(value));
    }
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  passed: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  gradedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'graded_at' // Map to actual database column
  },
  gradedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'graded_by' // Map to actual database column
  },
  // Feedback stored as JSON string for SQLite
  feedback: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('feedback');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('feedback', JSON.stringify(value));
    }
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'submitted', 'auto_graded', 'manually_graded', 'needs_review'),
    defaultValue: 'in_progress'
  },
  attemptNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  // Analytics stored as JSON string for SQLite
  analytics: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const rawValue = this.getDataValue('analytics');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('analytics', JSON.stringify(value));
    }
  },
  plagiarismScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  needsManualGrading: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'assessment_submissions',
  timestamps: true,
  indexes: [
    {
      fields: ['assessment_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['submitted_at']
    }
  ]
});

// Hooks
AssessmentSubmission.beforeSave(async (submission) => {
  if (submission.submittedAt && !submission.timeSpent) {
    submission.timeSpent = Math.round((submission.submittedAt - submission.startedAt) / 1000);
  }
});

// Instance methods
AssessmentSubmission.prototype.calculateScore = function() {
  if (!this.answers || !Array.isArray(this.answers)) {
    return 0;
  }

  let score = 0;
  let totalPoints = 0;

  for (const answer of this.answers) {
    if (typeof answer.points === 'number') {
      score += answer.points;
    }
    if (typeof answer.totalPoints === 'number') {
      totalPoints += answer.totalPoints;
    }
  }

  this.score = score;
  this.totalPoints = totalPoints;
  this.percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

  return score;
};

AssessmentSubmission.prototype.autoGrade = async function(assessment) {
  try {
    if (!this.answers || !Array.isArray(this.answers)) {
      throw new Error('No answers to grade');
    }

    const questions = assessment.questions || [];
    let totalPoints = 0;
    let earnedPoints = 0;
    let needsManualGrading = false;

    this.answers = this.answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      
      if (!question) {
        console.warn(`Question ${answer.questionId} not found in assessment`);
        return answer;
      }

      totalPoints += question.points || 0;

      // Auto-grade based on question type
      switch (question.type) {
        case 'multiple_choice':
        case 'true_false':
          if (answer.answer === question.correctAnswer) {
            answer.points = question.points;
            answer.isCorrect = true;
          } else {
            answer.points = 0;
            answer.isCorrect = false;
          }
          break;

        case 'short_answer':
        case 'fill_in_blank':
          // Simple exact match for now
          if (answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            answer.points = question.points;
            answer.isCorrect = true;
          } else {
            answer.points = 0;
            answer.isCorrect = false;
          }
          break;

        case 'essay':
        case 'coding':
          needsManualGrading = true;
          answer.needsManualGrading = true;
          break;

        default:
          console.warn(`Unsupported question type: ${question.type}`);
          needsManualGrading = true;
          answer.needsManualGrading = true;
      }

      if (!answer.needsManualGrading) {
        earnedPoints += answer.points || 0;
      }

      return answer;
    });

    // Update submission stats
    this.totalPoints = totalPoints;
    this.score = earnedPoints;
    this.percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    this.passed = this.percentage >= assessment.passingScore;
    this.needsManualGrading = needsManualGrading;
    this.status = needsManualGrading ? 'needs_review' : 'auto_graded';
    this.gradedAt = new Date();

    // Save the changes
    await this.save();

    return {
      score: this.score,
      totalPoints: this.totalPoints,
      percentage: this.percentage,
      passed: this.passed,
      needsManualGrading
    };
  } catch (error) {
    console.error('Error during auto-grading:', error);
    throw error;
  }
};

// Static methods
AssessmentSubmission.findByUserAndAssessment = async function(userId, assessmentId) {
  return await this.findOne({
    where: {
      user_id: userId,
      assessment_id: assessmentId
    },
    order: [['submitted_at', 'DESC']]
  });
};

AssessmentSubmission.findPendingGrading = async function(teacherId, options = {}) {
  const whereClause = {
    status: 'needs_review'
  };

  if (options.assessmentId) {
    whereClause.assessment_id = options.assessmentId;
  }

  return await this.findAll({
    where: whereClause,
    order: [['submitted_at', 'ASC']],
    limit: options.limit
  });
};

module.exports = AssessmentSubmission;