const { Progress, Course, Batch, User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op, Sequelize } = require('sequelize');
const logger = require('../config/logger');
const NotificationService = require('../services/notificationService');
const LearningStreakService = require('../services/learningStreakService');

// Helper function to calculate progress stats
const calculateProgressStats = (progressRecords) => {
  const totalModules = progressRecords.length;
  const completedModules = progressRecords.filter(p => p.completionStatus === 'completed').length;
  const inProgressModules = progressRecords.filter(p => p.completionStatus === 'in_progress').length;
  const notStartedModules = progressRecords.filter(p => p.completionStatus === 'not_started').length;
  
  const totalTimeSpent = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
  const scoresAvailable = progressRecords.filter(p => p.score !== null && p.score !== undefined);
  const averageScore = scoresAvailable.length > 0 
    ? scoresAvailable.reduce((sum, p) => sum + p.score, 0) / scoresAvailable.length 
    : null;

  // Calculate progress percentage
  const progressPercentage = (completedModules / totalModules) * 100;

  // Calculate estimated completion date if there's enough data
  let estimatedCompletionDate = null;
  if (completedModules > 0) {
    const completedRecords = progressRecords.filter(p => p.completionStatus === 'completed');
    const firstCompleted = new Date(Math.min(...completedRecords.map(p => p.completedAt)));
    const lastCompleted = new Date(Math.max(...completedRecords.map(p => p.completedAt)));
    
    const daysElapsed = (lastCompleted - firstCompleted) / (1000 * 60 * 60 * 24);
    const progressRate = completedModules / daysElapsed; // modules per day
    const remainingModules = totalModules - completedModules;
    
    if (progressRate > 0) {
      const daysToCompletion = remainingModules / progressRate;
      estimatedCompletionDate = new Date(Date.now() + (daysToCompletion * 24 * 60 * 60 * 1000));
    }
  }

  return {
    totalModules,
    completedModules,
    inProgressModules,
    notStartedModules,
    totalTimeSpent,
    averageScore,
    progressPercentage,
    estimatedCompletionDate,
    startedAt: progressRecords.length > 0 ? Math.min(...progressRecords.map(p => p.startedAt)) : null,
    lastAccessedAt: progressRecords.length > 0 ? Math.max(...progressRecords.map(p => p.lastAccessedAt)) : null
  };
};

// @desc    Get progress for a specific module
// @route   GET /api/progress/module/:moduleId
// @access  Private
const getProgressByModule = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user.id;

  const progress = await Progress.findOne({
    where: { moduleId, userId },
    include: [
      {
        model: Course,
        attributes: ['id', 'title']
      }
    ]
  });

  if (!progress) {
    return res.json({
      success: true,
      data: {
        completionStatus: 'not_started',
        timeSpent: 0,
        startedAt: null,
        lastAccessedAt: null
      }
    });
  }

  res.json({
    success: true,
    data: progress
  });
});

// @desc    Update or create progress for a module
// @route   POST /api/progress/update
// @access  Private
const updateProgress = asyncHandler(async (req, res) => {
  const { moduleId, completionStatus, timeSpent, score, notes } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!moduleId || !completionStatus) {
    throw new AppError('Module ID and completion status are required', 400);
  }

  // Validate completion status
  const validStatuses = ['not_started', 'in_progress', 'completed'];
  if (!validStatuses.includes(completionStatus)) {
    throw new AppError('Invalid completion status', 400);
  }

  // Find or create progress record
  const [progress, created] = await Progress.findOrCreate({
    where: { moduleId, userId },
    defaults: {
      completionStatus: 'not_started',
      timeSpent: 0,
      startedAt: new Date(),
      lastAccessedAt: new Date()
    }
  });

  // Prepare update data
  const updateData = {
    completionStatus,
    lastAccessedAt: new Date()
  };

  if (timeSpent !== undefined) {
    updateData.timeSpent = created ? timeSpent : progress.timeSpent + timeSpent;
  }
  if (score !== undefined) updateData.score = score;
  if (notes !== undefined) updateData.notes = notes;
  if (completionStatus === 'completed' && progress.completionStatus !== 'completed') {
    updateData.completedAt = new Date();
  }

  // Update progress
  await progress.update(updateData);

  logger.info(`Progress updated for user ${userId} in module ${moduleId}`);

  // Calculate course progress and send notifications
  const courseProgress = await Progress.findAll({
    where: { userId, courseId: progress.courseId }
  });
  
  const stats = calculateProgressStats(courseProgress);
  
  // Send progress milestone notification
  await NotificationService.sendProgressMilestoneNotification(
    userId,
    progress.courseId,
    stats.progressPercentage
  );

  // Send inactivity reminder if needed
  await NotificationService.sendInactivityReminder(
    userId,
    progress.courseId,
    progress.lastAccessedAt
  );

  // Send completion prediction if available
  if (stats.estimatedCompletionDate) {
    await NotificationService.sendCompletionPredictionUpdate(
      userId,
      progress.courseId,
      stats.estimatedCompletionDate
    );
  }

  // Calculate and send peer progress comparison
  const allCourseProgress = await Progress.findAll({
    where: { courseId: progress.courseId }
  });
  
  const averageProgress = allCourseProgress.reduce((sum, p) => {
    return sum + (p.completionStatus === 'completed' ? 100 : 
      p.completionStatus === 'in_progress' ? 50 : 0);
  }, 0) / allCourseProgress.length;

  await NotificationService.sendPeerProgressComparison(
    userId,
    progress.courseId,
    stats.progressPercentage,
    averageProgress
  );

  res.json({
    success: true,
    data: progress
  });
});

// @desc    Get progress stats for a course
// @route   GET /api/progress/course/:courseId
// @access  Private
const getProgressByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const progress = await Progress.findAll({
    where: { courseId, userId },
    include: [
      {
        model: Course,
        attributes: ['id', 'title']
      }
    ]
  });

  const stats = calculateProgressStats(progress);

  res.json({
    success: true,
    data: stats
  });
});

// @desc    Get progress overview for a batch
// @route   GET /api/progress/batch/:batchId/overview
// @access  Private/Teacher
const getBatchProgressOverview = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const isTeacher = req.user.role === 'teacher';
  const isAdmin = req.user.role === 'admin';

  // Check authorization
  if (!isAdmin) {
    const batch = await Batch.findByPk(batchId);
    if (!batch || (!isTeacher || batch.teacherId !== req.user.id)) {
      throw new AppError('Not authorized to access batch progress', 403);
    }
  }

  const batch = await Batch.findByPk(batchId, {
    include: [
      {
        model: Course,
        attributes: ['id', 'title']
      },
      {
        model: User,
        as: 'students',
        attributes: ['id'],
        include: [
          {
            model: Progress,
            where: { courseId: batch.courseId }
          }
        ]
      }
    ]
  });

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  // Calculate module-wise stats
  const moduleStats = await Progress.findAll({
    where: { courseId: batch.courseId },
    attributes: [
      'moduleId',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      [
        Sequelize.fn('SUM', 
          Sequelize.literal("CASE WHEN completionStatus = 'completed' THEN 1 ELSE 0 END")
        ),
        'completed'
      ],
      [
        Sequelize.fn('SUM', 
          Sequelize.literal("CASE WHEN completionStatus = 'in_progress' THEN 1 ELSE 0 END")
        ),
        'inProgress'
      ],
      [Sequelize.fn('AVG', Sequelize.col('score')), 'averageScore']
    ],
    group: ['moduleId']
  });

  // Calculate overall stats
  const totalStudents = batch.students.length;
  const allProgress = batch.students.flatMap(s => s.Progress);
  const overallStats = calculateProgressStats(allProgress);

  // Enhanced stats with predictions
  if (overallStats.completedModules > 0) {
    const completedModules = allProgress.filter(p => p.completionStatus === 'completed');
    const avgCompletionTime = completedModules.reduce((sum, p) => {
      const completionTime = new Date(p.completedAt) - new Date(p.startedAt);
      return sum + completionTime;
    }, 0) / completedModules.length;

    const remainingModules = overallStats.totalModules - overallStats.completedModules;
    const estimatedTimeToCompletion = avgCompletionTime * remainingModules;
    overallStats.estimatedCompletionDate = new Date(Date.now() + estimatedTimeToCompletion);
  }

  res.json({
    success: true,
    data: {
      batchId,
      totalStudents,
      moduleStats: moduleStats.map(stat => ({
        moduleId: stat.moduleId,
        completed: parseInt(stat.completed) || 0,
        inProgress: parseInt(stat.inProgress) || 0,
        notStarted: totalStudents - (parseInt(stat.completed) + parseInt(stat.inProgress)),
        averageScore: parseFloat(stat.averageScore) || 0
      })),
      overallStats
    }
  });
});

// @desc    Get progress for all students in a batch
// @route   GET /api/progress/batch/:batchId
// @access  Private/Teacher
const getProgressByBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const isTeacher = req.user.role === 'teacher';
  const isAdmin = req.user.role === 'admin';

  // Check authorization
  if (!isAdmin) {
    const batch = await Batch.findByPk(batchId);
    if (!batch || (!isTeacher || batch.teacherId !== req.user.id)) {
      throw new AppError('Not authorized to access batch progress', 403);
    }
  }

  const batch = await Batch.findByPk(batchId, {
    include: [
      {
        model: User,
        as: 'students',
        attributes: ['id', 'name', 'email'],
        include: [
          {
            model: Progress,
            include: [
              {
                model: Course,
                attributes: ['id', 'title']
              }
            ]
          }
        ]
      }
    ]
  });

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  const progressData = batch.students.map(student => {
    const stats = calculateProgressStats(student.Progress);
    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email
      },
      progress: stats
    };
  });

  res.json({
    success: true,
    data: progressData
  });
});

// @desc    Get progress stats with filters
// @route   GET /api/progress/stats
// @access  Private
const getProgressStats = asyncHandler(async (req, res) => {
  const { courseId, batchId, startDate, endDate } = req.query;
  const userId = req.user.id;

  const where = { userId };
  if (courseId) where.courseId = courseId;
  if (batchId) where.batchId = batchId;
  if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
  if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };

  const progressRecords = await Progress.findAll({
    where,
    include: [
      {
        model: Course,
        attributes: ['id', 'title']
      }
    ]
  });

  const stats = calculateProgressStats(progressRecords);

  res.json({
    success: true,
    data: stats
  });
});

// @desc    Get progress for a specific student in a batch
// @route   GET /api/progress/batch/:batchId/student/:studentId
// @access  Private
const getStudentProgressInBatch = asyncHandler(async (req, res) => {
  const { batchId, studentId } = req.params;
  const isTeacher = req.user.role === 'teacher';
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === studentId;

  // Check authorization
  if (!isAdmin && !isSelf) {
    const batch = await Batch.findByPk(batchId);
    if (!batch || (!isTeacher || batch.teacherId !== req.user.id)) {
      throw new AppError('Not authorized to access student progress', 403);
    }
  }

  const progress = await Progress.findAll({
    where: {
      userId: studentId,
      batchId
    },
    include: [
      {
        model: Course,
        attributes: ['id', 'title']
      }
    ]
  });

  const stats = calculateProgressStats(progress);

  res.json({
    success: true,
    data: {
      progress,
      stats
    }
  });
});

module.exports = {
  updateProgress,
  getProgressByModule,
  getProgressByCourse,
  getProgressByBatch,
  getProgressStats,
  getBatchProgressOverview,
  getStudentProgressInBatch,
  getStreakStats: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const streak = await LearningStreakService.getStreakStats(userId);
    
    res.json({
      success: true,
      data: streak
    });
  }),
  
  getStreakLeaderboard: asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const leaderboard = await LearningStreakService.getLeaderboard(parseInt(limit));
    
    res.json({
      success: true,
      data: leaderboard
    });
  })
};
