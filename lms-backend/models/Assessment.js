const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },

  courseId: {
    type: sequelize.getDialect() === 'postgres' ? DataTypes.UUID : DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'id'
    },
    field: 'course_id' // Map to actual database column
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    },
    field: 'batch_id' // Map to actual database column
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'teacher_id' // Map to actual database column
  },
  type: {
    type: DataTypes.ENUM('quiz', 'assignment', 'exam', 'lab_report', 'project', 'presentation'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('formative', 'summative', 'diagnostic', 'practice'),
    defaultValue: 'formative'
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'scheduled_for' // Map to actual database column
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'deadline' // Map to actual database column
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    validate: {
      min: 1,
      max: 480
    }
  },
  // Settings stored as JSON string for SQLite
  settings: {
    type: DataTypes.TEXT,
    defaultValue: '{"attemptsAllowed":1,"passingScore":60,"showResults":"after_grading","showCorrectAnswers":true,"allowReview":true,"randomizeQuestions":false,"isProctored":false}'
  },
  // Questions stored as JSON string for SQLite
  questions: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  // Adaptive settings stored as JSON string for SQLite
  adaptive: {
    type: DataTypes.TEXT,
    defaultValue: '{"enabled":false,"difficultyAdjustment":false,"questionSelection":"linear"}'
  },
  // Submissions stored as JSON string for SQLite
  submissions: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  averageScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard', 'adaptive'),
    defaultValue: 'medium'
  },
  learningObjectives: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '[]'
  },
  tags: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '[]'
  },
  // AI insights stored as JSON string for SQLite
  insights: {
    type: DataTypes.TEXT,
    defaultValue: '{"performance":"average","recommendations":[],"learningPath":null}'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'active', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Results stored as JSON string for SQLite
  results: {
    type: DataTypes.TEXT,
    defaultValue: '{"totalSubmissions":0,"averageTimeSpent":0,"passRate":0,"gradeDistribution":{"A":0,"B":0,"C":0,"D":0,"F":0}}'
  }
}, {
  tableName: 'assessments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['course_id'] },
    { fields: ['teacher_id'] },
    { fields: ['type'] },
    { fields: ['scheduled_for'] },
    { fields: ['deadline'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

// Hooks
Assessment.beforeUpdate(async (assessment) => {
  try {
    // Calculate total points from questions
    const questions = JSON.parse(assessment.questions || '[]');
    assessment.totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    // Update average score from submissions
    const submissions = JSON.parse(assessment.submissions || '[]');
    const gradedSubmissions = submissions.filter(s => s.grading?.manuallyGraded || s.grading?.autoGraded);

    if (gradedSubmissions.length > 0) {
      const totalPercentage = gradedSubmissions.reduce((sum, s) => sum + (s.scores?.percentage || 0), 0);
      assessment.averageScore = Math.round(totalPercentage / gradedSubmissions.length);
    }

    // Update results statistics
    const results = JSON.parse(assessment.results || '{}');
    results.totalSubmissions = submissions.length;

    if (gradedSubmissions.length > 0) {
      results.averageTimeSpent = gradedSubmissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / gradedSubmissions.length;
      results.passRate = (gradedSubmissions.filter(s => s.scores?.passed).length / gradedSubmissions.length) * 100;

      // Update grade distribution
      results.gradeDistribution = gradedSubmissions.reduce((dist, submission) => {
        const grade = submission.scores?.grade || 'F';
        dist[grade] = (dist[grade] || 0) + 1;
        return dist;
      }, { A: 0, B: 0, C: 0, D: 0, F: 0 });
    }

    assessment.results = JSON.stringify(results);
  } catch (error) {
    console.error('Error updating assessment statistics:', error);
  }
});

// Static methods
Assessment.getAssessmentsByStudent = async function(studentId, filters = {}) {
  // This would need a complex query to check submissions JSON
  return await this.findAll({
    where: {
      isActive: true
    },
    order: [['deadline', 'ASC']]
  });
};

Assessment.getAssessmentsByTeacher = async function(teacherId, filters = {}) {
  const whereClause = { teacherId };

  if (filters.status) whereClause.status = filters.status;
  if (filters.type) whereClause.type = filters.type;
  if (filters.dateFrom) whereClause.scheduledFor = { [Op.gte]: filters.dateFrom };
  if (filters.dateTo) whereClause.scheduledFor = { ...whereClause.scheduledFor, [Op.lte]: filters.dateTo };

  return await this.findAll({
    where: whereClause,
    order: [['scheduledFor', 'DESC']]
  });
};

Assessment.getUpcomingAssessments = async function(limit = 20) {
  const now = new Date();

  return await this.findAll({
    where: {
      scheduledFor: { [Op.gte]: now },
      status: { [Op.in]: ['published', 'active'] },
      isActive: true
    },
    order: [['scheduledFor', 'ASC']],
    limit
  });
};

Assessment.getPendingGradings = async function(teacherId) {
  // This would need a complex query to check submissions JSON for pending grading
  return await this.findAll({
    where: {
      teacherId,
      status: { [Op.in]: ['published', 'active'] }
    },
    order: [['deadline', 'ASC']]
  });
};

// Instance methods
Assessment.prototype.getSubmission = function(studentId) {
  try {
    const submissions = JSON.parse(this.submissions || '[]');
    return submissions.find(s => s.student === studentId);
  } catch (error) {
    console.error('Error parsing submissions:', error);
    return null;
  }
};

Assessment.prototype.addSubmission = async function(studentId, submissionData) {
  try {
    const submissions = JSON.parse(this.submissions || '[]');
    const settings = JSON.parse(this.settings || '{}');

    // Check if student already has a submission
    const existingSubmissionIndex = submissions.findIndex(s => s.student === studentId);

    let submission;
    if (existingSubmissionIndex >= 0) {
      // Update existing submission
      submission = submissions[existingSubmissionIndex];

      // Check attempt limit
      if (submission.attemptNumber >= settings.attemptsAllowed) {
        throw new Error('Maximum attempts exceeded');
      }

      submission.attemptNumber += 1;
      submission.startedAt = submissionData.startedAt || new Date().toISOString();
      submission.submittedAt = submissionData.submittedAt || new Date().toISOString();
      submission.answers = submissionData.answers || [];
      submission.timeSpent = submissionData.timeSpent || 0;
      submission.status = 'submitted';

      submissions[existingSubmissionIndex] = submission;
    } else {
      // Create new submission
      submission = {
        student: studentId,
        startedAt: submissionData.startedAt || new Date().toISOString(),
        submittedAt: submissionData.submittedAt || new Date().toISOString(),
        answers: submissionData.answers || [],
        timeSpent: submissionData.timeSpent || 0,
        status: 'submitted',
        attemptNumber: 1
      };

      submissions.push(submission);
    }

    // Calculate scores
    this.calculateScores(submission);

    this.submissions = JSON.stringify(submissions);
    await this.save();

    return submission;
  } catch (error) {
    console.error('Error adding submission:', error);
    throw error;
  }
};

Assessment.prototype.calculateScores = function(submission) {
  try {
    const questions = JSON.parse(this.questions || '[]');
    let totalPoints = 0;
    let earnedPoints = 0;

    submission.answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.question);
      if (question) {
        totalPoints += question.points || 0;
        earnedPoints += answer.pointsEarned || 0;
      }
    });

    submission.scores = {
      totalPoints,
      earnedPoints,
      percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      passed: totalPoints > 0 ? (earnedPoints / totalPoints) >= (JSON.parse(this.settings || '{}').passingScore / 100) : false
    };

    // Assign grade
    const percentage = submission.scores.percentage;
    if (percentage >= 90) submission.scores.grade = 'A';
    else if (percentage >= 80) submission.scores.grade = 'B';
    else if (percentage >= 70) submission.scores.grade = 'C';
    else if (percentage >= 60) submission.scores.grade = 'D';
    else submission.scores.grade = 'F';
  } catch (error) {
    console.error('Error calculating scores:', error);
  }
};

Assessment.prototype.gradeSubmission = async function(studentId, gradingData) {
  try {
    const submissions = JSON.parse(this.submissions || '[]');
    const submissionIndex = submissions.findIndex(s => s.student === studentId);

    if (submissionIndex === -1) {
      throw new Error('Submission not found');
    }

    const submission = submissions[submissionIndex];
    submission.grading = {
      manuallyGraded: true,
      gradedBy: gradingData.gradedBy,
      gradedAt: new Date().toISOString(),
      feedback: gradingData.feedback,
      comments: gradingData.comments || []
    };

    submission.status = 'graded';

    // Recalculate scores if manual grading overrides
    if (gradingData.scores) {
      submission.scores = gradingData.scores;
    }

    submissions[submissionIndex] = submission;
    this.submissions = JSON.stringify(submissions);
    await this.save();

    return submission;
  } catch (error) {
    console.error('Error grading submission:', error);
    throw error;
  }
};

Assessment.prototype.getAnalytics = function() {
  try {
    const submissions = JSON.parse(this.submissions || '[]');
    const gradedSubmissions = submissions.filter(s => s.grading?.manuallyGraded || s.grading?.autoGraded);

    if (gradedSubmissions.length === 0) {
      return {
        totalSubmissions: submissions.length,
        gradedSubmissions: 0,
        averageScore: 0,
        passRate: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
      };
    }

    const averageScore = gradedSubmissions.reduce((sum, s) => sum + (s.scores?.percentage || 0), 0) / gradedSubmissions.length;
    const passRate = (gradedSubmissions.filter(s => s.scores?.passed).length / gradedSubmissions.length) * 100;

    const gradeDistribution = gradedSubmissions.reduce((dist, submission) => {
      const grade = submission.scores?.grade || 'F';
      dist[grade] = (dist[grade] || 0) + 1;
      return dist;
    }, { A: 0, B: 0, C: 0, D: 0, F: 0 });

    return {
      totalSubmissions: submissions.length,
      gradedSubmissions: gradedSubmissions.length,
      averageScore: Math.round(averageScore),
      passRate: Math.round(passRate),
      gradeDistribution
    };
  } catch (error) {
    console.error('Error generating analytics:', error);
    return {
      totalSubmissions: 0,
      gradedSubmissions: 0,
      averageScore: 0,
      passRate: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
    };
  }
};

// Note: Associations are now defined in models/index.js

module.exports = Assessment;
