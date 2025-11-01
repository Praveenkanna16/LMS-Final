const Assessment = require('../models/Assessment');
const AssessmentSubmission = require('../models/AssessmentSubmission');
const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// Helper function to parse JSON fields safely
function parseJSONField(field) {
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch (error) {
    return {};
  }
}

// Helper function to calculate grade
function calculateGrade(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

// Helper function to determine status
function determineStatus(assessment, submission) {
  if (!submission) {
    // No submission yet
    if (new Date() > new Date(assessment.deadline)) {
      return 'overdue';
    }
    return 'pending';
  }

  if (submission.status === 'submitted' || submission.status === 'graded') {
    return submission.status;
  }

  return 'in_progress';
}

// @desc    Get all student assessments with their submission status
// @route   GET /api/student/assessments
// @access  Private/Student
const getStudentAssessments = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status; // 'pending', 'submitted', 'graded', 'overdue'
  const type = req.query.type; // 'assignment', 'quiz', 'exam', etc.

  // Get all assessments that the student has access to
  // For now, get all published assessments
  let whereClause = {
    isActive: true,
    status: 'published'
  };

  if (type) {
    whereClause.type = type;
  }

  const assessments = await Assessment.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Course,
        as: 'course', // ✅ Added alias
        attributes: ['id', 'title', 'category']
      },
      {
        model: Batch,
        as: 'batch', // ✅ Added alias
        attributes: ['id', 'name']
      }
    ],
    order: [['deadline', 'DESC']]
  });

  // Get all submissions for this student
  const submissions = await AssessmentSubmission.findAll({
    where: { userId: studentId }, // ✅ Changed from studentId to userId
    attributes: [
      'id',
      'assessmentId',
      'status',
      'submittedAt',
      'startedAt',
      'timeSpent',
      'totalPoints',
      'score', // ✅ Changed from earnedPoints to score
      'percentage',
      'passed',
      'feedback'
    ]
  });

  // Create a map of submissions by assessment ID
  const submissionMap = {};
  submissions.forEach(sub => {
    submissionMap[sub.assessmentId] = sub;
  });

  // Combine assessments with submission status
  let formattedAssessments = assessments.map(assessment => {
    const submission = submissionMap[assessment.id];
    const assessmentStatus = determineStatus(assessment, submission);

    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      subject: assessment.course?.title || 'General', // ✅ Changed Course to course
      type: assessment.type,
      status: assessmentStatus,
      dueDate: assessment.deadline,
      submittedDate: submission?.submittedAt || null,
      points: submission?.score || null,
      maxPoints: assessment.totalPoints,
      totalPoints: assessment.totalPoints,
      instructions: assessment.description,
      attachments: [], // TODO: Add attachments support
      timeLimit: assessment.timeLimit,
      scheduledFor: assessment.scheduledFor,
      grade: submission?.percentage ? calculateGrade(submission.percentage) : null,
      percentage: submission?.percentage || null,
      passed: submission?.passed || null,
      feedback: submission?.feedback || null,
      teacher: {
        id: assessment.teacher?.id,
        name: assessment.teacher?.name || 'Unknown'
      },
      course: assessment.Course ? {
        id: assessment.Course.id,
        title: assessment.Course.title
      } : null,
      batch: assessment.Batch ? {
        id: assessment.Batch.id,
        name: assessment.Batch.name
      } : null
    };
  });

  // Filter by status if provided
  if (status) {
    if (status === 'all') {
      // No filtering
    } else {
      formattedAssessments = formattedAssessments.filter(a => a.status === status);
    }
  }

  // Apply pagination
  const total = formattedAssessments.length;
  const paginatedAssessments = formattedAssessments.slice(offset, offset + limit);

  res.json({
    success: true,
    data: {
      assessments: paginatedAssessments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get student's performance summary
// @route   GET /api/student/assessments/performance
// @access  Private/Student
const getStudentPerformance = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  // Get all graded submissions
  const submissions = await AssessmentSubmission.findAll({
    where: {
      userId: studentId,
      status: 'graded'
    },
    include: [
      {
        model: Assessment,
        required: true,
        include: [
          {
            model: Course,
            as: 'course', // ✅ Added alias
            attributes: ['id', 'title', 'category']
          }
        ]
      }
    ]
  });

  // Group by subject/course
  const subjectPerformance = {};

  submissions.forEach(submission => {
    const subject = submission.Assessment.course?.title || 'General'; // ✅ Changed Course to course

    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = {
        subject,
        totalAssessments: 0,
        totalScore: 0,
        totalMaxScore: 0,
        scores: []
      };
    }

    subjectPerformance[subject].totalAssessments++;
    subjectPerformance[subject].totalScore += submission.score || 0;
    subjectPerformance[subject].totalMaxScore += submission.totalPoints || 0;
    subjectPerformance[subject].scores.push(submission.percentage || 0);
  });

  // Calculate averages and grades
  const recentScores = Object.values(subjectPerformance).map(perf => {
    const avgPercentage = perf.scores.length > 0
      ? perf.scores.reduce((a, b) => a + b, 0) / perf.scores.length
      : 0;

    const grade = calculateGrade(avgPercentage);

    // Determine trend (simple: compare last score with average)
    const lastScore = perf.scores[perf.scores.length - 1] || 0;
    const trend = lastScore > avgPercentage ? 'up' : lastScore < avgPercentage ? 'down' : 'stable';

    return {
      subject: perf.subject,
      score: Math.round(perf.totalScore),
      maxScore: Math.round(perf.totalMaxScore),
      percentage: Math.round(avgPercentage),
      grade,
      trend
    };
  });

  res.json({
    success: true,
    data: {
      recentScores,
      totalAssessments: submissions.length,
      averageScore: recentScores.length > 0
        ? Math.round(recentScores.reduce((sum, s) => sum + s.percentage, 0) / recentScores.length)
        : 0
    }
  });
});

// @desc    Get upcoming quizzes/tests
// @route   GET /api/student/assessments/upcoming
// @access  Private/Student
const getUpcomingQuizzes = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  // Get upcoming assessments that student hasn't completed
  const upcomingAssessments = await Assessment.findAll({
    where: {
      isActive: true,
      status: 'published',
      scheduledFor: {
        [Op.gte]: new Date()
      },
      deadline: {
        [Op.gte]: new Date()
      }
    },
    include: [
      {
        model: Course,
        as: 'course', // ✅ Added alias
        attributes: ['id', 'title', 'category']
      }
    ],
    order: [['scheduledFor', 'ASC']],
    limit
  });

  // Check if student has already submitted
  const assessmentIds = upcomingAssessments.map(a => a.id);
  const submissions = await AssessmentSubmission.findAll({
    where: {
      userId: studentId,
      assessmentId: {
        [Op.in]: assessmentIds
      },
      status: {
        [Op.in]: ['submitted', 'graded']
      }
    },
    attributes: ['assessmentId']
  });

  const submittedIds = new Set(submissions.map(s => s.assessmentId));

  // Filter out completed assessments
  const upcomingQuizzes = upcomingAssessments
    .filter(assessment => !submittedIds.has(assessment.id))
    .map(assessment => {
      const settings = parseJSONField(assessment.settings);
      const questions = parseJSONField(assessment.questions);

      return {
        id: assessment.id,
        title: assessment.title,
        subject: assessment.course?.title || 'General', // ✅ Changed Course to course
        date: assessment.scheduledFor,
        time: new Date(assessment.scheduledFor).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        duration: `${assessment.timeLimit} min`,
        questions: questions.length || 0,
        totalPoints: assessment.totalPoints
      };
    });

  res.json({
    success: true,
    data: upcomingQuizzes
  });
});

// @desc    Start an assessment
// @route   POST /api/student/assessments/:id/start
// @access  Private/Student
const startAssessment = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const assessmentId = req.params.id;

  const assessment = await Assessment.findByPk(assessmentId, {
    include: [
      {
        model: Course,
        as: 'course', // ✅ Added alias
        attributes: ['id', 'title']
      }
    ]
  });

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Check if assessment is available
  if (!assessment.isActive || assessment.status !== 'published') {
    throw new AppError('Assessment is not available', 400);
  }

  // Check if deadline has passed
  if (new Date() > new Date(assessment.deadline)) {
    throw new AppError('Assessment deadline has passed', 400);
  }

  // Check if student has already submitted
  const existingSubmission = await AssessmentSubmission.findOne({
    where: {
      assessmentId,
      userId: studentId,
      status: {
        [Op.in]: ['submitted', 'graded']
      }
    }
  });

  if (existingSubmission) {
    throw new AppError('You have already submitted this assessment', 400);
  }

  // Create or update submission record
  let submission = await AssessmentSubmission.findOne({
    where: {
      assessmentId,
      userId: studentId,
      status: 'in_progress'
    }
  });

  if (!submission) {
    submission = await AssessmentSubmission.create({
      assessmentId,
      userId: studentId,
      status: 'in_progress',
      startedAt: new Date()
    });
  }

  // Get questions
  const questions = parseJSONField(assessment.questions);
  const settings = parseJSONField(assessment.settings);

  // Randomize if needed
  let assessmentQuestions = questions;
  if (settings.randomizeQuestions) {
    assessmentQuestions = [...questions].sort(() => Math.random() - 0.5);
  }

  res.json({
    success: true,
    message: 'Assessment started successfully',
    data: {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        timeLimit: assessment.timeLimit,
        totalPoints: assessment.totalPoints,
        instructions: assessment.description
      },
      submission: {
        id: submission.id,
        startedAt: submission.startedAt
      },
      questions: assessmentQuestions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        points: q.points
      })),
      settings: {
        allowReview: settings.allowReview,
        showResults: settings.showResults
      }
    }
  });
});

// @desc    Submit an assessment
// @route   POST /api/student/assessments/:id/submit
// @access  Private/Student
const submitAssessment = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const assessmentId = req.params.id;
  const { answers, timeSpent } = req.body;

  const assessment = await Assessment.findByPk(assessmentId);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Find submission
  const submission = await AssessmentSubmission.findOne({
    where: {
      assessmentId,
      userId: studentId,
      status: 'in_progress'
    }
  });

  if (!submission) {
    throw new AppError('No active assessment session found', 404);
  }

  // Get questions and calculate score
  const questions = parseJSONField(assessment.questions);
  const settings = parseJSONField(assessment.settings);

  let totalPoints = 0;
  let earnedPoints = 0;

  const gradedAnswers = answers.map(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return answer;

    totalPoints += question.points || 0;

    // Auto-grade if possible
    let pointsEarned = 0;
    let isCorrect = false;

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      isCorrect = answer.answer === question.correctAnswer;
      pointsEarned = isCorrect ? question.points : 0;
    } else if (question.type === 'multiple_select') {
      // Check if all correct answers are selected
      const correctAnswers = question.correctAnswers || [];
      const selectedAnswers = answer.answer || [];
      isCorrect = correctAnswers.length === selectedAnswers.length &&
                  correctAnswers.every(a => selectedAnswers.includes(a));
      pointsEarned = isCorrect ? question.points : 0;
    }
    // For essay/short answer, leave pointsEarned as 0 (needs manual grading)

    earnedPoints += pointsEarned;

    return {
      ...answer,
      pointsEarned,
      isCorrect,
      correctAnswer: settings.showCorrectAnswers ? question.correctAnswer : undefined
    };
  });

  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const grade = calculateGrade(percentage);
  const passed = percentage >= (settings.passingScore || 60);

  // Update submission
  await submission.update({
    submittedAt: new Date(),
    status: 'submitted',
    timeSpent: timeSpent || 0,
    answers: JSON.stringify(gradedAnswers),
    totalPoints,
    earnedPoints,
    percentage,
    grade,
    passed
  });

  logger.info(`Assessment submitted: ${assessment.title} by student ${studentId}`);

  // Determine if results should be shown
  let showResults = false;
  if (settings.showResults === 'immediate') {
    showResults = true;
  } else if (settings.showResults === 'after_deadline') {
    showResults = new Date() > new Date(assessment.deadline);
  }

  res.json({
    success: true,
    message: 'Assessment submitted successfully',
    data: {
      submissionId: submission.id,
      showResults,
      results: showResults ? {
        totalPoints,
        earnedPoints,
        percentage: Math.round(percentage),
        grade,
        passed
      } : null
    }
  });
});

// @desc    Get assessment results
// @route   GET /api/student/assessments/:id/results
// @access  Private/Student
const getAssessmentResults = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const assessmentId = req.params.id;

  const submission = await AssessmentSubmission.findOne({
    where: {
      assessmentId,
      userId: studentId,
      status: {
        [Op.in]: ['submitted', 'graded']
      }
    },
    include: [
      {
        model: Assessment,
        include: [
          {
            model: Course,
            as: 'course', // ✅ Added alias
            attributes: ['id', 'title']
          }
        ]
      }
    ]
  });

  if (!submission) {
    throw new AppError('Submission not found', 404);
  }

  const settings = parseJSONField(submission.Assessment.settings);
  const answers = parseJSONField(submission.answers);

  // Check if results should be shown
  let showResults = false;
  if (settings.showResults === 'immediate') {
    showResults = true;
  } else if (settings.showResults === 'after_deadline') {
    showResults = new Date() > new Date(submission.Assessment.deadline);
  } else if (settings.showResults === 'after_grading' && submission.status === 'graded') {
    showResults = true;
  }

  if (!showResults) {
    return res.json({
      success: true,
      data: {
        message: 'Results will be available after grading',
        status: submission.status,
        submittedAt: submission.submittedAt
      }
    });
  }

  res.json({
    success: true,
    data: {
      assessment: {
        id: submission.Assessment.id,
        title: submission.Assessment.title,
        type: submission.Assessment.type,
        subject: submission.Assessment.course?.title || 'General' // ✅ Changed Course to course
      },
      submission: {
        submittedAt: submission.submittedAt,
        timeSpent: submission.timeSpent,
        totalPoints: submission.totalPoints,
        earnedPoints: submission.score,
        percentage: submission.percentage,
        grade: submission.percentage ? calculateGrade(submission.percentage) : null,
        passed: submission.passed,
        feedback: submission.feedback
      },
      answers: settings.allowReview ? answers : [],
      showCorrectAnswers: settings.showCorrectAnswers
    }
  });
});

module.exports = {
  getStudentAssessments,
  getStudentPerformance,
  getUpcomingQuizzes,
  startAssessment,
  submitAssessment,
  getAssessmentResults
};
