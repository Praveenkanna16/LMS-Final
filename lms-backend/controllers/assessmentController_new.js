const Assessment = require('../models/Assessment');
const AssessmentSubmission = require('../models/AssessmentSubmission');
const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');

// Helper function to parse JSON fields safely
function parseJSONField(field) {
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch (error) {
    return {};
  }
}

// @desc    Get all assessments
// @route   GET /api/assessments
// @access  Public (with filters)
const getAssessments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = {
    isActive: true,
    status: { [Op.in]: ['published', 'active'] }
  };

  if (req.query.type) whereClause.type = req.query.type;
  if (req.query.category) whereClause.category = req.query.category;
  if (req.query.difficulty) whereClause.difficulty = req.query.difficulty;
  if (req.query.courseId) whereClause.courseId = req.query.courseId;
  if (req.query.batchId) whereClause.batchId = req.query.batchId;
  if (req.query.teacherId) whereClause.teacherId = req.query.teacherId;

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
        attributes: ['id', 'title', 'category']
      },
      {
        model: Batch,
        attributes: ['id', 'name']
      }
    ],
    order: [['scheduledFor', 'ASC']],
    limit,
    offset
  });

  const total = await Assessment.count({ where: whereClause });

  res.json({
    success: true,
    data: {
      assessments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single assessment
// @route   GET /api/assessments/:id
// @access  Public
const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Course,
        attributes: ['id', 'title', 'category']
      },
      {
        model: Batch,
        attributes: ['id', 'name']
      }
    ]
  });

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Check if assessment is active
  if (!assessment.isActive) {
    throw new AppError('Assessment not available', 404);
  }

  // Check if assessment is published (unless user is the teacher)
  if (assessment.status !== 'published' && assessment.status !== 'active' && req.user?.id !== assessment.teacherId) {
    throw new AppError('Assessment not available', 404);
  }

  // Get user's submission if authenticated
  let userSubmission = null;
  if (req.user) {
    userSubmission = await AssessmentSubmission.findOne({
      where: {
        assessmentId: assessment.id,
        studentId: req.user.id
      }
    });
  }

  res.json({
    success: true,
    data: {
      assessment,
      userSubmission
    }
  });
});

// @desc    Create new assessment
// @route   POST /api/assessments
// @access  Private/Teacher
const createAssessment = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    courseId,
    batchId,
    type,
    category,
    scheduledFor,
    deadline,
    timeLimit,
    questions,
    settings,
    adaptive,
    learningObjectives,
    tags,
    difficulty
  } = req.body;

  // Verify course exists and user is the teacher
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (course.teacherId !== req.user.id) {
    throw new AppError('You can only create assessments for your own courses', 403);
  }

  // Verify batch exists (if provided)
  if (batchId) {
    const batch = await Batch.findByPk(batchId);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    if (batch.teacherId !== req.user.id) {
      throw new AppError('You can only create assessments for your own batches', 403);
    }
  }

  // Calculate total points from questions
  const parsedQuestions = questions || [];
  const totalPoints = parsedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

  // Prepare assessment data with settings
  const assessmentData = {
    title,
    description,
    courseId,
    batchId,
    teacherId: req.user.id,
    type,
    category: category || 'formative',
    scheduledFor: new Date(scheduledFor),
    deadline: new Date(deadline),
    timeLimit: timeLimit || 60,
    questions: JSON.stringify(questions || []),
    settings: JSON.stringify({
      attemptsAllowed: 1,
      passingScore: 60,
      showResults: 'after_grading',
      showCorrectAnswers: true,
      allowReview: true,
      randomizeQuestions: false,
      isProctored: false,
      ...settings
    }),
    adaptive: JSON.stringify({
      enabled: false,
      difficultyAdjustment: false,
      questionSelection: 'linear',
      ...adaptive
    }),
    learningObjectives: JSON.stringify(learningObjectives || []),
    tags: JSON.stringify(tags || []),
    totalPoints,
    difficulty: difficulty || 'medium',
    status: 'draft',
    isActive: true,
    isPublished: false
  };

  const assessment = await Assessment.create(assessmentData);

  logger.info(`Assessment created: ${assessment.title} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Assessment created successfully',
    data: { assessment }
  });
});

// @desc    Update assessment
// @route   PUT /api/assessments/:id
// @access  Private/Teacher (owner only)
const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Check ownership
  if (assessment.teacherId !== req.user.id) {
    throw new AppError('Not authorized to update this assessment', 403);
  }

  // Don't allow updates if assessment has submissions
  const submissionsCount = await AssessmentSubmission.count({
    where: { assessmentId: assessment.id }
  });

  if (submissionsCount > 0) {
    throw new AppError('Cannot update assessment with existing submissions', 400);
  }

  const updateData = { ...req.body };

  // Update JSON fields properly
  if (req.body.questions) {
    updateData.questions = JSON.stringify(req.body.questions);
    updateData.totalPoints = req.body.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  }

  if (req.body.settings) {
    updateData.settings = JSON.stringify(req.body.settings);
  }

  if (req.body.adaptive) {
    updateData.adaptive = JSON.stringify(req.body.adaptive);
  }

  if (req.body.learningObjectives) {
    updateData.learningObjectives = JSON.stringify(req.body.learningObjectives);
  }

  if (req.body.tags) {
    updateData.tags = JSON.stringify(req.body.tags);
  }

  const updatedAssessment = await assessment.update(updateData);

  logger.info(`Assessment updated: ${updatedAssessment.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Assessment updated successfully',
    data: { assessment: updatedAssessment }
  });
});

// @desc    Delete assessment
// @route   DELETE /api/assessments/:id
// @access  Private/Teacher (owner only)
const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Check ownership
  if (assessment.teacherId !== req.user.id) {
    throw new AppError('Not authorized to delete this assessment', 403);
  }

  // Don't allow deletion if assessment has submissions
  const submissionsCount = await AssessmentSubmission.count({
    where: { assessmentId: assessment.id }
  });

  if (submissionsCount > 0) {
    throw new AppError('Cannot delete assessment with existing submissions', 400);
  }

  await assessment.destroy();

  logger.info(`Assessment deleted: ${assessment.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Assessment deleted successfully'
  });
});

// @desc    Start assessment for student
// @route   POST /api/assessments/:id/start
// @access  Private/Student
const startAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Check if assessment is active and available
  if (!assessment.isActive || assessment.status !== 'published') {
    throw new AppError('Assessment not available', 400);
  }

  // Check if deadline has passed
  if (new Date() > new Date(assessment.deadline)) {
    throw new AppError('Assessment deadline has passed', 400);
  }

  // Check if user has already started/submitted
  const existingSubmission = await AssessmentSubmission.findOne({
    where: {
      assessmentId: assessment.id,
      studentId: req.user.id,
      status: 'submitted'
    }
  });

  if (existingSubmission) {
    throw new AppError('You have already submitted this assessment', 400);
  }

  // Get questions and settings data
  const questionData = parseJSONField(assessment.questions);
  const settingsData = parseJSONField(assessment.settings);

  // Shuffle questions if enabled
  let assessmentQuestions = questionData;
  if (settingsData.randomizeQuestions) {
    assessmentQuestions = [...questionData].sort(() => Math.random() - 0.5);
  }

  // Create initial submission record
  await AssessmentSubmission.create({
    assessmentId: assessment.id,
    studentId: req.user.id,
    status: 'in_progress',
    startedAt: new Date()
  });

  res.json({
    success: true,
    message: 'Assessment started successfully',
    data: {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        timeLimit: assessment.timeLimit,
        totalPoints: assessment.totalPoints,
        questions: assessmentQuestions.map(q => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options,
          points: q.points
        }))
      },
      startTime: new Date(),
      settings: {
        showResults: settingsData.showResults,
        allowReview: settingsData.allowReview,
        attemptsAllowed: settingsData.attemptsAllowed
      }
    }
  });
});

// @desc    Submit assessment
// @route   POST /api/assessments/:id/submit
// @access  Private/Student
const submitAssessment = asyncHandler(async (req, res) => {
  const { answers, timeSpent } = req.body;

  const assessment = await Assessment.findByPk(req.params.id);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Check if assessment is active and available
  if (!assessment.isActive || assessment.status !== 'published') {
    throw new AppError('Assessment not available', 400);
  }

  // Check if deadline has passed
  if (new Date() > new Date(assessment.deadline)) {
    throw new AppError('Assessment deadline has passed', 400);
  }

  // Find existing submission
  const submission = await AssessmentSubmission.findOne({
    where: {
      assessmentId: assessment.id,
      studentId: req.user.id,
      status: 'in_progress'
    }
  });

  if (!submission) {
    throw new AppError('No active assessment session found', 404);
  }

  // Get questions and settings
  const submittedQuestions = parseJSONField(assessment.questions);
  const assessmentSettings = parseJSONField(assessment.settings);

  // Calculate total points and score
  let totalPoints = 0;
  let earnedPoints = 0;

  answers.forEach(answer => {
    const question = submittedQuestions.find(q => q.id === answer.questionId);
    if (question) {
      totalPoints += question.points || 0;
      earnedPoints += answer.pointsEarned || 0;
    }
  });

  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  let grade = 'F';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';

  // Update submission
  await submission.update({
    submittedAt: new Date(),
    status: 'submitted',
    timeSpent: timeSpent || 0,
    answers: JSON.stringify(answers || []),
    totalPoints,
    earnedPoints,
    percentage,
    grade,
    passed: percentage >= (assessmentSettings.passingScore || 60)
  });

  logger.info(`Assessment submitted: ${assessment.title} by ${req.user.email}`);

  // Return results based on settings
  let showResults = false;
  if (assessmentSettings.showResults === 'immediate') {
    showResults = true;
  } else if (assessmentSettings.showResults === 'after_deadline') {
    showResults = new Date() > new Date(assessment.deadline);
  }

  res.json({
    success: true,
    message: 'Assessment submitted successfully',
    data: {
      submission: {
        id: submission.id,
        status: submission.status,
        timeSpent: submission.timeSpent,
        submittedAt: submission.submittedAt
      },
      showResults,
      results: showResults ? {
        totalPoints: submission.totalPoints,
        earnedPoints: submission.earnedPoints,
        percentage: submission.percentage,
        grade: submission.grade,
        passed: submission.passed
      } : null
    }
  });
});

// @desc    Get student submissions
// @route   GET /api/assessments/my-submissions
// @access  Private/Student
const getMySubmissions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get all assessments with their submissions
  const whereClause = {
    studentId: req.user.id
  };

  const include = [{
    model: Assessment,
    required: true,
    where: {
      isActive: true,
      status: { [Op.in]: ['published', 'active', 'completed'] }
    },
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Course,
        attributes: ['id', 'title', 'category']
      }
    ]
  }];

  // Get paginated submissions
  const { rows: submissions, count: total } = await AssessmentSubmission.findAndCountAll({
    where: whereClause,
    include,
    order: [['submittedAt', 'DESC']],
    offset,
    limit,
    distinct: true
  });

  // Format submissions data
  const formattedSubmissions = submissions.map(submission => ({
    assessment: {
      id: submission.Assessment.id,
      title: submission.Assessment.title,
      type: submission.Assessment.type,
      deadline: submission.Assessment.deadline,
      totalPoints: submission.Assessment.totalPoints
    },
    submission: {
      status: submission.status,
      timeSpent: submission.timeSpent,
      submittedAt: submission.submittedAt,
      attemptNumber: submission.attemptNumber,
      totalPoints: submission.totalPoints,
      earnedPoints: submission.earnedPoints,
      percentage: submission.percentage,
      grade: submission.grade,
      passed: submission.passed
    }
  }));

  res.json({
    success: true,
    data: {
      submissions: formattedSubmissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get teacher assessments
// @route   GET /api/assessments/teacher/my-assessments
// @access  Private/Teacher
const getMyAssessments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.type) filters.type = req.query.type;
  if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
  if (req.query.dateTo) filters.dateTo = req.query.dateTo;

  const assessments = await Assessment.getAssessmentsByTeacher(req.user.id, filters);

  // Apply pagination
  const paginatedAssessments = assessments.slice(offset, offset + limit);

  // Get submission counts and analytics for each assessment
  const assessmentsWithAnalytics = await Promise.all(paginatedAssessments.map(async assessment => {
    const submissions = await AssessmentSubmission.findAll({
      where: { assessmentId: assessment.id }
    });

    const gradedSubmissions = submissions.filter(s => s.status === 'graded');
    const pendingGradings = submissions.filter(s => s.status === 'submitted').length;
    
    const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.percentage, 0);
    const averageScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
    const passCount = gradedSubmissions.filter(s => s.passed).length;
    const passRate = gradedSubmissions.length > 0 ? (passCount / gradedSubmissions.length) * 100 : 0;

    return {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      status: assessment.status,
      scheduledFor: assessment.scheduledFor,
      deadline: assessment.deadline,
      totalPoints: assessment.totalPoints,
      submissions: {
        total: submissions.length,
        graded: gradedSubmissions.length,
        pending: pendingGradings,
        averageScore: Math.round(averageScore),
        passRate: Math.round(passRate)
      }
    };
  }));

  const total = assessments.length;

  res.json({
    success: true,
    data: {
      assessments: assessmentsWithAnalytics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Grade assessment submission
// @route   PUT /api/assessments/:id/grade/:studentId
// @access  Private/Teacher
const gradeSubmission = asyncHandler(async (req, res) => {
  const { scores, feedback, comments } = req.body;

  const assessment = await Assessment.findByPk(req.params.id);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Check ownership
  if (assessment.teacherId !== req.user.id) {
    throw new AppError('Not authorized to grade this assessment', 403);
  }

  // Find the submission to grade
  const submission = await AssessmentSubmission.findOne({
    where: {
      assessmentId: assessment.id,
      studentId: req.params.studentId,
      status: 'submitted'
    }
  });

  if (!submission) {
    throw new AppError('Submission not found or already graded', 404);
  }

  // Update submission with grading data
  const updatedSubmission = await submission.update({
    totalPoints: scores.totalPoints,
    earnedPoints: scores.earnedPoints,
    percentage: scores.percentage,
    grade: scores.grade,
    passed: scores.percentage >= (parseJSONField(assessment.settings).passingScore || 60),
    status: 'graded',
    gradedBy: req.user.id,
    gradedAt: new Date(),
    feedback: feedback || '',
    comments: JSON.stringify(comments || [])
  });

  logger.info(`Assessment graded: ${assessment.title} student ${req.params.studentId} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Assessment graded successfully',
    data: {
      submission: {
        student: req.params.studentId,
        totalPoints: updatedSubmission.totalPoints,
        earnedPoints: updatedSubmission.earnedPoints,
        percentage: updatedSubmission.percentage,
        grade: updatedSubmission.grade,
        passed: updatedSubmission.passed,
        feedback: updatedSubmission.feedback,
        comments: parseJSONField(updatedSubmission.comments)
      }
    }
  });
});

// Helper function to get question-wise analytics
async function getQuestionAnalytics(assessment, submissions) {
  const questions = parseJSONField(assessment.questions);

  return questions.map(question => {
    let correctCount = 0;
    let totalAttempts = 0;
    let totalTime = 0;

    submissions.forEach(submission => {
      const answers = parseJSONField(submission.answers);
      const answer = answers.find(a => a.questionId === question.id);
      if (answer) {
        totalAttempts++;
        totalTime += answer.timeSpent || 0;
        if (answer.pointsEarned === question.points) correctCount++;
      }
    });

    return {
      questionId: question.id,
      questionText: question.question,
      correctRate: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0,
      averageTime: totalAttempts > 0 ? totalTime / totalAttempts : 0,
      totalAttempts
    };
  });
}

// Helper function to get performance by attempt number
async function getPerformanceByAttempt(assessment) {
  const attempts = await AssessmentSubmission.findAll({
    where: { assessmentId: assessment.id },
    attributes: [
      'attemptNumber',
      [sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.fn('AVG', sequelize.col('percentage')), 'averageScore'],
      [
        sequelize.fn('SUM', 
          sequelize.literal('CASE WHEN passed = true THEN 1 ELSE 0 END')
        ),
        'passCount'
      ]
    ],
    group: ['attemptNumber'],
    order: [['attemptNumber', 'ASC']]
  });

  return attempts.map(attempt => ({
    attemptNumber: attempt.attemptNumber,
    count: parseInt(attempt.get('count')),
    averageScore: Math.round(parseFloat(attempt.get('averageScore')) || 0),
    passRate: Math.round(
      (parseInt(attempt.get('passCount')) / parseInt(attempt.get('count'))) * 100
    )
  }));
}

// Helper function to get time distribution
async function getTimeDistribution(assessment) {
  const timeRanges = [
    { range: '<15min', condition: 'timeSpent < 900' },
    { range: '15-30min', condition: 'timeSpent >= 900 AND timeSpent < 1800' },
    { range: '30-60min', condition: 'timeSpent >= 1800 AND timeSpent < 3600' },
    { range: '1-2hrs', condition: 'timeSpent >= 3600 AND timeSpent < 7200' },
    { range: '>2hrs', condition: 'timeSpent >= 7200' }
  ];

  const distribution = await Promise.all(
    timeRanges.map(async ({ range, condition }) => {
      const count = await AssessmentSubmission.count({
        where: {
          assessmentId: assessment.id,
          [Op.and]: [sequelize.literal(condition)]
        }
      });
      return { range, count };
    })
  );

  const total = await AssessmentSubmission.count({
    where: { assessmentId: assessment.id }
  });

  return distribution.reduce((acc, { range, count }) => {
    acc[range] = {
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    };
    return acc;
  }, {});
}

// @desc    Get assessment analytics
// @route   GET /api/assessments/:id/analytics
// @access  Private/Teacher
const getAssessmentAnalytics = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Check ownership
  if (assessment.teacherId !== req.user.id) {
    throw new AppError('Not authorized to view this assessment analytics', 403);
  }

  const submissions = await AssessmentSubmission.findAll({
    where: { assessmentId: assessment.id },
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.percentage, 0);
  const averageScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
  const passCount = gradedSubmissions.filter(s => s.passed).length;
  const passRate = gradedSubmissions.length > 0 ? (passCount / gradedSubmissions.length) * 100 : 0;

  // Get detailed analytics
  const detailedAnalytics = {
    totalSubmissions: submissions.length,
    gradedSubmissions: gradedSubmissions.length,
    averageScore: Math.round(averageScore),
    passRate: Math.round(passRate),
    submissions: submissions.map(submission => ({
      student: submission.student,
      status: submission.status,
      timeSpent: submission.timeSpent,
      totalPoints: submission.totalPoints,
      earnedPoints: submission.earnedPoints,
      percentage: submission.percentage,
      grade: submission.grade,
      submittedAt: submission.submittedAt,
      passed: submission.passed
    })),
    questionAnalytics: await getQuestionAnalytics(assessment, submissions),
    performanceByAttempt: await getPerformanceByAttempt(assessment),
    timeDistribution: await getTimeDistribution(assessment)
  };

  res.json({
    success: true,
    data: { analytics: detailedAnalytics }
  });
});

// @desc    Get upcoming assignments
// @route   GET /api/assessments/upcoming
// @access  Private
const getUpcomingAssignments = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const upcomingAssessments = await Assessment.getUpcomingAssessments(limit);

  // Filter based on user role
  let filteredAssessments = upcomingAssessments;

  if (req.user.role === 'student') {
    // For students, only show assessments they have access to
    // This would need additional logic to check batch enrollments
    // For now, return all upcoming assessments
  } else if (req.user.role === 'teacher') {
    // For teachers, only show their own assessments
    filteredAssessments = upcomingAssessments.filter(assessment => assessment.teacherId === req.user.id);
  }

  const assessments = filteredAssessments.map(assessment => ({
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    type: assessment.type,
    scheduledFor: assessment.scheduledFor,
    deadline: assessment.deadline,
    timeLimit: assessment.timeLimit,
    totalPoints: assessment.totalPoints,
    teacher: {
      id: assessment.teacherId,
      name: assessment.teacher?.name || 'Unknown Teacher'
    },
    course: assessment.course ? {
      id: assessment.course.id,
      title: assessment.course.title,
      category: assessment.course.category
    } : null,
    batch: assessment.batch ? {
      id: assessment.batch.id,
      name: assessment.batch.name
    } : null
  }));

  res.json({
    success: true,
    data: assessments
  });
});

module.exports = {
  getAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  startAssessment,
  submitAssessment,
  getMySubmissions,
  getMyAssessments,
  gradeSubmission,
  getAssessmentAnalytics,
  getUpcomingAssignments
};
