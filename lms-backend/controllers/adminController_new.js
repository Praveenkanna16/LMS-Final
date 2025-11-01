const { ActivityLog, SystemSettings, User, Course, Batch, Payment, Assessment, Notification, FCMToken, UserAchievement, UserGamification, UserPreferences, UserProfile, UserProgress, Question, AssessmentSubmission, BatchEnrollment, TopicSubscription, Cart, Wishlist, Achievement, LearningPath, Certificate, Content, Doubt, ForumPost, LiveSession, NotificationPreference, Payout, Progress, Revenue, SessionAttendance, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

// Activity logging middleware
const logActivity = async (userId, action, entityType, entityId = null, details = null, ipAddress = null, userAgent = null) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress,
      userAgent,
      status: 'success'
    });
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
};

// @desc    Get admin dashboard stats with real data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get real-time statistics
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    activeUsers,
    totalCourses,
    activeCourses,
    totalBatches,
    activeBatches,
    totalRevenue,
    totalPayments,
    pendingPayouts,
    newUsersThisMonth,
    newUsersThisWeek,
    recentPayments,
    upcomingClasses,
    systemHealth
  ] = await Promise.all([
    User.count(),
    User.count({ where: { role: 'student' } }),
    User.count({ where: { role: 'teacher', verified: true } }),
    User.count({ where: { lastActiveAt: { [Op.gte]: lastWeek } } }),
    Course.count(),
    Course.count({ where: { isActive: true, isPublished: true } }),
    Batch.count(),
    Batch.count({ where: { isActive: true } }),
    Payment.sum('amount', { where: { status: 'completed' } }) || 0,
    Payment.count({ where: { status: 'completed' } }),
    Payout.count({ where: { status: 'pending' } }),
    User.count({ where: { createdAt: { [Op.gte]: lastMonth } } }),
    User.count({ where: { createdAt: { [Op.gte]: lastWeek } } }),
    Payment.findAll({
      where: { status: 'completed' },
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, attributes: ['title'] },
        { model: Batch, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    }),
    LiveSession.findAll({
      where: {
        startTime: { [Op.gte]: today },
        status: 'scheduled'
      },
      include: [
        { model: Batch, as: 'batch', attributes: ['name'] },
        { model: User, as: 'teacher', attributes: ['name'] }
      ],
      order: [['startTime', 'ASC']],
      limit: 5
    }),
    sequelize.authenticate().then(() => ({ database: 'connected', uptime: process.uptime() })).catch(() => ({ database: 'disconnected', uptime: 0 }))
  ]);

  // Calculate growth rates
  const userGrowthRate = newUsersThisMonth > 0 ? ((newUsersThisWeek / newUsersThisMonth) * 100).toFixed(1) : 0;

  const dashboardData = {
    overview: {
      totalUsers,
      totalStudents,
      totalTeachers,
      activeUsers,
      totalCourses,
      activeCourses,
      totalBatches,
      activeBatches,
      totalRevenue,
      totalPayments,
      pendingPayouts,
      userGrowthRate: `${userGrowthRate}%`,
      newUsersThisMonth,
      newUsersThisWeek
    },
    recentActivity: {
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        student: payment.student?.name || 'Unknown',
        course: payment.Course?.title || payment.Batch?.name || 'Unknown',
        createdAt: payment.createdAt,
        status: payment.status
      })),
      upcomingClasses: upcomingClasses.map(session => ({
        id: session.id,
        title: session.title,
        batch: session.batch?.name || 'Unknown',
        teacher: session.teacher?.name || 'Unknown',
        startTime: session.startTime,
        duration: session.duration
      }))
    },
    systemHealth: {
      databaseStatus: systemHealth.database,
      apiStatus: 'operational',
      uptime: Math.floor(systemHealth.uptime),
      lastBackup: await getLastBackupTime(),
      storageUsed: await getStorageUsage()
    }
  };

  // Log admin dashboard access
  await logActivity(req.user.id, 'VIEW_DASHBOARD', 'ADMIN', null, null, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get comprehensive analytics with real data
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getSystemAnalytics = asyncHandler(async (req, res) => {
  const { period = 'monthly', startDate, endDate } = req.query;

  // Set date range based on period
  let dateRange = {};
  const now = new Date();
  
  if (startDate || endDate) {
    dateRange.createdAt = {};
    if (startDate) dateRange.createdAt[Op.gte] = new Date(startDate);
    if (endDate) dateRange.createdAt[Op.lte] = new Date(endDate);
  } else {
    switch (period) {
      case 'weekly':
        dateRange.createdAt = { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'monthly':
        dateRange.createdAt = { [Op.gte]: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) };
        break;
      case 'yearly':
        dateRange.createdAt = { [Op.gte]: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) };
        break;
    }
  }

  // Get user registration analytics
  const userRegistrations = await User.findAll({
    where: dateRange,
    attributes: [
      'role',
      [fn('DATE', col('createdAt')), 'date'],
      [fn('COUNT', col('id')), 'count']
    ],
    group: ['role', fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']]
  });

  // Get revenue analytics
  const revenueAnalytics = await Payment.findAll({
    where: { 
      status: 'completed',
      ...dateRange
    },
    attributes: [
      [fn('DATE', col('createdAt')), 'date'],
      [fn('SUM', col('amount')), 'revenue'],
      [fn('COUNT', col('id')), 'transactions']
    ],
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']]
  });

  // Get course enrollment analytics
  const enrollmentAnalytics = await BatchEnrollment.findAll({
    where: dateRange,
    attributes: [
      [fn('DATE', col('createdAt')), 'date'],
      [fn('COUNT', col('id')), 'enrollments']
    ],
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']]
  });

  // Get top performing courses
  const topCourses = await Course.findAll({
    attributes: [
      'id', 'title', 'subject',
      [fn('COUNT', col('Batches.id')), 'batchCount'],
      [fn('AVG', col('Payments.amount')), 'avgRevenue']
    ],
    include: [
      { model: Batch, attributes: [] },
      { model: Payment, attributes: [], where: { status: 'completed' }, required: false }
    ],
    group: ['Course.id'],
    order: [[fn('COUNT', col('Batches.id')), 'DESC']],
    limit: 10
  });

  // Get teacher performance
  const teacherPerformance = await User.findAll({
    where: { role: 'teacher', verified: true },
    attributes: [
      'id', 'name', 'email',
      [fn('COUNT', col('batches.id')), 'totalBatches'],
      [fn('AVG', col('batches.studentCount')), 'avgStudents'],
      [fn('SUM', col('teacherPayments.amount')), 'totalEarnings']
    ],
    include: [
      { model: Batch, as: 'batches', attributes: [], required: false },
      { model: Payment, as: 'teacherPayments', attributes: [], where: { status: 'completed' }, required: false }
    ],
    group: ['User.id'],
    order: [[fn('SUM', col('teacherPayments.amount')), 'DESC']],
    limit: 10
  });

  // Log analytics access
  await logActivity(req.user.id, 'VIEW_ANALYTICS', 'ADMIN', null, { period, startDate, endDate }, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    data: {
      userRegistrations: userRegistrations.map(u => ({
        role: u.role,
        date: u.getDataValue('date'),
        count: parseInt(u.getDataValue('count'))
      })),
      revenueAnalytics: revenueAnalytics.map(r => ({
        date: r.getDataValue('date'),
        revenue: parseFloat(r.getDataValue('revenue')) || 0,
        transactions: parseInt(r.getDataValue('transactions'))
      })),
      enrollmentAnalytics: enrollmentAnalytics.map(e => ({
        date: e.getDataValue('date'),
        enrollments: parseInt(e.getDataValue('enrollments'))
      })),
      topCourses: topCourses.map(c => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
        batchCount: parseInt(c.getDataValue('batchCount')) || 0,
        avgRevenue: parseFloat(c.getDataValue('avgRevenue')) || 0
      })),
      teacherPerformance: teacherPerformance.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        totalBatches: parseInt(t.getDataValue('totalBatches')) || 0,
        avgStudents: parseFloat(t.getDataValue('avgStudents')) || 0,
        totalEarnings: parseFloat(t.getDataValue('totalEarnings')) || 0
      })),
      period
    }
  });
});

// @desc    Get all users with real data and filters
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Build where conditions
  const whereConditions = {};
  if (role) whereConditions.role = role;
  if (status) whereConditions.status = status;
  if (search) {
    whereConditions[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count: total, rows: users } = await User.findAndCountAll({
    where: whereConditions,
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Payment,
        as: 'studentPayments',
        attributes: [[fn('SUM', col('amount')), 'totalSpent'], [fn('COUNT', col('id')), 'paymentCount']],
        where: { status: 'completed' },
        required: false
      },
      {
        model: Batch,
        as: 'batches',
        attributes: [[fn('COUNT', col('id')), 'batchCount']],
        required: false
      }
    ],
    group: ['User.id'],
    order: [[sortBy, sortOrder.toUpperCase()]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Get user counts by status
  const userCounts = await User.findAll({
    attributes: [
      'status',
      'role',
      [fn('COUNT', col('id')), 'count']
    ],
    group: ['status', 'role']
  });

  // Log user management access
  await logActivity(req.user.id, 'VIEW_USERS', 'USER_MANAGEMENT', null, { filters: { role, status, search } }, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    data: {
      users: users.map(user => ({
        ...user.toJSON(),
        totalSpent: parseFloat(user.studentPayments?.[0]?.getDataValue('totalSpent')) || 0,
        paymentCount: parseInt(user.studentPayments?.[0]?.getDataValue('paymentCount')) || 0,
        batchCount: parseInt(user.batches?.[0]?.getDataValue('batchCount')) || 0
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      summary: userCounts.reduce((acc, curr) => {
        const key = `${curr.role}_${curr.status}`;
        acc[key] = parseInt(curr.getDataValue('count'));
        return acc;
      }, {})
    }
  });
});

// @desc    Get live classes with real data
// @route   GET /api/admin/live-classes
// @access  Private/Admin
const getLiveClasses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, teacherId, dateFrom, dateTo } = req.query;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = {};
  if (status) whereConditions.status = status;
  if (teacherId) whereConditions.teacherId = teacherId;
  if (dateFrom || dateTo) {
    whereConditions.startTime = {};
    if (dateFrom) whereConditions.startTime[Op.gte] = new Date(dateFrom);
    if (dateTo) whereConditions.startTime[Op.lte] = new Date(dateTo);
  }

  const { count: total, rows: sessions } = await LiveSession.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: Batch,
        as: 'batch',
        attributes: ['id', 'name', 'studentCount'],
        include: [
          { model: Course, attributes: ['title', 'subject'] }
        ]
      },
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      },
      {
        model: SessionAttendance,
        attributes: [[fn('COUNT', col('id')), 'attendanceCount']],
        required: false
      }
    ],
    group: ['LiveSession.id'],
    order: [['startTime', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: {
      sessions: sessions.map(session => ({
        ...session.toJSON(),
        attendanceCount: parseInt(session.SessionAttendances?.[0]?.getDataValue('attendanceCount')) || 0
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSessions: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// Helper functions
const getLastBackupTime = async () => {
  try {
    const stats = await fs.stat(path.join(__dirname, '../database/genzed_lms_dev.db'));
    return stats.mtime;
  } catch (error) {
    return new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago as fallback
  }
};

const getStorageUsage = async () => {
  try {
    const dbPath = path.join(__dirname, '../database/genzed_lms_dev.db');
    const uploadsPath = path.join(__dirname, '../uploads');
    
    let totalSize = 0;
    
    // Get database size
    try {
      const dbStats = await fs.stat(dbPath);
      totalSize += dbStats.size;
    } catch (error) {
      // Database file might not exist
    }
    
    // Get uploads directory size
    try {
      const uploadsStats = await fs.readdir(uploadsPath);
      for (const file of uploadsStats) {
        const filePath = path.join(uploadsPath, file);
        const fileStats = await fs.stat(filePath);
        if (fileStats.isFile()) {
          totalSize += fileStats.size;
        }
      }
    } catch (error) {
      // Uploads directory might not exist
    }
    
    return totalSize;
  } catch (error) {
    return 0;
  }
};

module.exports = {
  getAdminDashboard,
  getSystemAnalytics,
  getAllUsers,
  getLiveClasses,
  logActivity
};
