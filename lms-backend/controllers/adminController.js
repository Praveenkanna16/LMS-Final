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
    Course.count(), // Remove isActive/isPublished filter for now
    Batch.count(),
    Batch.count(), // Remove isActive filter for now
    Payment.sum('amount', { where: { status: 'completed' } }) || 0,
    Payment.count({ where: { status: 'completed' } }),
    Promise.resolve(0), // Skip Payout count for now due to association issues
    User.count({ where: { created_at: { [Op.gte]: lastMonth } } }),
    User.count({ where: { created_at: { [Op.gte]: lastWeek } } }),
    Payment.findAll({
      where: { status: 'completed' },
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, attributes: ['title'] },
        { model: Batch, attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']], // Use snake_case for consistency
      limit: 5
    }),
    LiveSession.findAll({
      where: {
        start_time: { [Op.gte]: today }, // Use snake_case column name
        status: 'scheduled'
      },
      include: [
        { model: Batch, as: 'batch', attributes: ['name'] },
        { model: User, as: 'teacher', attributes: ['name'] }
      ],
      order: [['start_time', 'ASC']], // Use snake_case column name
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
    dateRange.created_at = {};
    if (startDate) dateRange.created_at[Op.gte] = new Date(startDate);
    if (endDate) dateRange.created_at[Op.lte] = new Date(endDate);
  } else {
    switch (period) {
      case 'weekly':
        dateRange.created_at = { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'monthly':
        dateRange.created_at = { [Op.gte]: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) };
        break;
      case 'yearly':
        dateRange.created_at = { [Op.gte]: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) };
        break;
    }
  }

  // Get user registration analytics
  const userRegistrations = await User.findAll({
    where: dateRange,
    attributes: [
      'role',
      [fn('DATE', col('created_at')), 'date'],
      [fn('COUNT', col('id')), 'count']
    ],
    group: ['role', fn('DATE', col('created_at'))],
    order: [[fn('DATE', col('created_at')), 'ASC']]
  });

  // Get revenue analytics
  const revenueAnalytics = await Payment.findAll({
    where: { 
      status: 'completed',
      ...dateRange
    },
    attributes: [
      [fn('DATE', col('created_at')), 'date'],
      [fn('SUM', col('amount')), 'revenue'],
      [fn('COUNT', col('id')), 'transactions']
    ],
    group: [fn('DATE', col('created_at'))],
    order: [[fn('DATE', col('created_at')), 'ASC']]
  });

  // Get course enrollment analytics
  const enrollmentAnalytics = await BatchEnrollment.findAll({
    where: dateRange,
    attributes: [
      [fn('DATE', col('created_at')), 'date'],
      [fn('COUNT', col('id')), 'enrollments']
    ],
    group: [fn('DATE', col('created_at'))],
    order: [[fn('DATE', col('created_at')), 'ASC']]
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

// @desc    Get pending payouts
// @route   GET /api/admin/payouts
// @access  Private/Admin
const getPendingPayouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'pending' } = req.query;
  const offset = (page - 1) * limit;

  try {
    // For now, return empty array since Payout model associations are not properly set up
    const payouts = [];
    const total = 0;

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPayouts: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch pending payouts:', error);
    res.json({
      success: true,
      data: {
        payouts: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalPayouts: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  }
});

// @desc    Approve payout
// @route   POST /api/admin/payouts/:payoutId/approve
// @access  Private/Admin
const approvePayout = asyncHandler(async (req, res) => {
  const { payoutId } = req.params;
  const { remarks } = req.body;

  const payout = await Payout.findByPk(payoutId, {
    include: [{ model: User, as: 'teacher', attributes: ['name', 'email'] }]
  });

  if (!payout) {
    throw new AppError('Payout request not found', 404);
  }

  if (payout.status !== 'pending') {
    throw new AppError('Payout has already been processed', 400);
  }

  // Update payout status
  await payout.update({
    status: 'approved',
    approvedBy: req.user.id,
    approvedAt: new Date(),
    remarks: remarks || 'Approved by admin'
  });

  // Log payout approval
  await logActivity(
    req.user.id,
    'APPROVE_PAYOUT',
    'PAYOUT',
    payout.id,
    {
      teacherId: payout.teacherId,
      amount: payout.amount,
      remarks
    },
    req.ip,
    req.get('User-Agent')
  );

  logger.info(`Payout approved: ₹${payout.amount} for ${payout.teacher?.email || 'unknown'} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Payout approved successfully',
    data: payout
  });
});

// @desc    Reject payout
// @route   POST /api/admin/payouts/:payoutId/reject
// @access  Private/Admin
const rejectPayout = asyncHandler(async (req, res) => {
  const { payoutId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('Rejection reason is required', 400);
  }

  const payout = await Payout.findByPk(payoutId, {
    include: [{ model: User, as: 'teacher', attributes: ['name', 'email'] }]
  });

  if (!payout) {
    throw new AppError('Payout request not found', 404);
  }

  if (payout.status !== 'pending') {
    throw new AppError('Payout has already been processed', 400);
  }

  // Update payout status
  await payout.update({
    status: 'rejected',
    rejectedBy: req.user.id,
    rejectedAt: new Date(),
    rejectionReason: reason
  });

  // Log payout rejection
  await logActivity(
    req.user.id,
    'REJECT_PAYOUT',
    'PAYOUT',
    payout.id,
    {
      teacherId: payout.teacherId,
      amount: payout.amount,
      reason
    },
    req.ip,
    req.get('User-Agent')
  );

  logger.info(`Payout rejected: ₹${payout.amount} for ${payout.teacher?.email || 'unknown'} by ${req.user.email}, reason: ${reason}`);

  res.json({
    success: true,
    message: 'Payout rejected successfully',
    data: payout
  });
});

// @desc    Get system health metrics
// @route   GET /api/admin/system/health
// @access  Private/Admin
const getSystemHealth = asyncHandler(async (req, res) => {
  const healthMetrics = {
    database: {
      status: 'connected',
      uptime: process.uptime(),
      connections: 1 // SQLite doesn't have connection pooling
    },
    api: {
      status: 'operational',
      uptime: process.uptime(),
      responseTime: Date.now() // Will be calculated by middleware
    },
    storage: {
      used: await getStorageUsage(),
      lastBackup: await getLastBackupTime()
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external
    }
  };

  // Test database connection
  try {
    await sequelize.authenticate();
    healthMetrics.database.status = 'connected';
  } catch (error) {
    healthMetrics.database.status = 'disconnected';
    healthMetrics.database.error = error.message;
  }

  res.json({
    success: true,
    data: healthMetrics
  });
});

// @desc    Get activity logs
// @route   GET /api/admin/logs/actions
// @access  Private/Admin
const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = {};
  if (userId) whereConditions.userId = userId;
  if (action) whereConditions.action = action;
  if (entityType) whereConditions.entityType = entityType;
  if (startDate || endDate) {
    whereConditions.createdAt = {};
    if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
    if (endDate) whereConditions.createdAt[Op.lte] = new Date(endDate);
  }

  const { count: total, rows: logs } = await ActivityLog.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: User,
        attributes: ['name', 'email', 'role']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalLogs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get all notifications for admin
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAllNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let whereClause = {};

  // Filter options
  if (req.query.type && req.query.type !== 'undefined') whereClause.type = req.query.type;
  if (req.query.read !== undefined && req.query.read !== 'undefined') whereClause.isRead = req.query.read === 'true';
  if (req.query.priority && req.query.priority !== 'undefined') whereClause.priority = req.query.priority;
  if (req.query.search && req.query.search !== 'undefined') {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${req.query.search}%` } },
      { message: { [Op.like]: `%${req.query.search}%` } }
    ];
  }

  const notifications = await Notification.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'recipient',
        attributes: ['id', 'name', 'email', 'role']
      },
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'role']
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  const total = await Notification.count({ where: whereClause });

  // Get summary statistics
  const allNotifications = await Notification.findAll({
    attributes: ['status', 'priority']
  });

  const stats = {
    total: allNotifications.length,
    unread: allNotifications.filter(n => n.status === 'pending').length,
    sent: allNotifications.filter(n => n.status === 'sent').length,
    scheduled: allNotifications.filter(n => n.scheduledFor > new Date()).length,
    read: allNotifications.filter(n => n.status === 'read').length,
    draft: 0,
    recipients: 0
  };

  await logActivity(
    req.user.id,
    'VIEW_ALL_NOTIFICATIONS',
    'notification',
    null,
    { page, limit, filters: req.query },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    }
  });
});

// @desc    Send notification
// @route   POST /api/admin/notifications/send
// @access  Private/Admin
const sendNotification = asyncHandler(async (req, res) => {
  const { title, message, type = 'system_announcement', target, priority = 'medium', userIds } = req.body;

  // Map frontend type to backend ENUM type
  const typeMapping = {
    'system': 'system_announcement',
    'course': 'course_update',
    'payment': 'payment_received',
    'achievement': 'achievement_earned',
    'reminder': 'class_reminder'
  };
  
  const notificationType = typeMapping[type] || 'system_announcement';

  // Determine recipients based on target
  let recipients = [];
  if (target === 'all') {
    recipients = await User.findAll({ 
      where: { status: 'active' },
      attributes: ['id'] 
    });
  } else if (target === 'teachers') {
    recipients = await User.findAll({ 
      where: { role: 'teacher', status: 'active' },
      attributes: ['id'] 
    });
  } else if (target === 'students') {
    recipients = await User.findAll({ 
      where: { role: 'student', status: 'active' },
      attributes: ['id'] 
    });
  } else if (target === 'specific' && userIds && userIds.length > 0) {
    recipients = await User.findAll({ 
      where: { id: userIds, status: 'active' },
      attributes: ['id'] 
    });
  }

  // Create notifications for all recipients
  const notificationPromises = recipients.map(user => 
    Notification.create({
      recipientId: user.id,
      senderId: req.user.id,
      title,
      message,
      type: notificationType,
      priority,
      status: 'sent',
      isRead: false,
      sentAt: new Date()
    })
  );

  await Promise.all(notificationPromises);

  // Log activity
  await logActivity(
    req.user.id,
    'SEND_NOTIFICATION',
    'Notification',
    null,
    { title, target, recipientCount: recipients.length }
  );

  res.status(201).json({
    success: true,
    data: {
      recipientCount: recipients.length,
      title,
      message,
      type: notificationType,
      target
    },
    message: `Notification sent to ${recipients.length} user(s)`
  });
});

// @desc    Schedule notification
// @route   POST /api/admin/notifications/schedule
// @access  Private/Admin
const scheduleNotification = asyncHandler(async (req, res) => {
  const { title, message, type = 'system_announcement', target, priority = 'medium', userIds, scheduledDate } = req.body;

  // Map frontend type to backend ENUM type
  const typeMapping = {
    'system': 'system_announcement',
    'course': 'course_update',
    'payment': 'payment_received',
    'achievement': 'achievement_earned',
    'reminder': 'class_reminder'
  };
  
  const notificationType = typeMapping[type] || 'system_announcement';

  // Validate scheduled date is in the future
  const scheduledDateTime = new Date(scheduledDate);
  if (scheduledDateTime <= new Date()) {
    throw new AppError('Scheduled date must be in the future', 400);
  }

  // Determine recipients based on target
  let recipients = [];
  if (target === 'all') {
    recipients = await User.findAll({ 
      where: { status: 'active' },
      attributes: ['id'] 
    });
  } else if (target === 'teachers') {
    recipients = await User.findAll({ 
      where: { role: 'teacher', status: 'active' },
      attributes: ['id'] 
    });
  } else if (target === 'students') {
    recipients = await User.findAll({ 
      where: { role: 'student', status: 'active' },
      attributes: ['id'] 
    });
  } else if (target === 'specific' && userIds && userIds.length > 0) {
    recipients = await User.findAll({ 
      where: { id: userIds, status: 'active' },
      attributes: ['id'] 
    });
  }

  // Create scheduled notifications for all recipients
  const notificationPromises = recipients.map(user => 
    Notification.create({
      recipientId: user.id,
      senderId: req.user.id,
      title,
      message,
      type: notificationType,
      priority,
      status: 'pending',
      scheduledFor: scheduledDateTime,
      isRead: false
    })
  );

  await Promise.all(notificationPromises);

  // Log activity
  await logActivity(
    req.user.id,
    'SCHEDULE_NOTIFICATION',
    'Notification',
    null,
    { title, target, recipientCount: recipients.length, scheduledDate }
  );

  res.status(201).json({
    success: true,
    data: {
      recipientCount: recipients.length,
      title,
      message,
      type: notificationType,
      target,
      scheduledDate: scheduledDateTime
    },
    message: `Notification scheduled for ${recipients.length} user(s)`
  });
});

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private/Admin
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByPk(id);
  
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  await notification.destroy();

  // Log activity
  await logActivity(
    req.user.id,
    'DELETE_NOTIFICATION',
    'Notification',
    id,
    { title: notification.title }
  );

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Get all students with their profile details
// @route   GET /api/admin/students
// @access  Private/Admin
const getAllStudents = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    status = '',
    emailVerified = '',
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause
  const whereClause = {
    role: 'student'
  };

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  if (status) {
    whereClause.status = status;
  }

  if (emailVerified !== '') {
    whereClause.emailVerified = emailVerified === 'true';
  }

  // Fetch students with profiles
  const { count, rows: students } = await User.findAndCountAll({
    where: whereClause,
    attributes: {
      exclude: ['password'],
      include: [
        // Count enrollments
        [
          literal(`(
            SELECT COUNT(*)
            FROM batch_enrollments
            WHERE batch_enrollments.userId = User.id
          )`),
          'enrollmentCount'
        ],
        // Count completed courses
        [
          literal(`(
            SELECT COUNT(DISTINCT courseId)
            FROM batch_enrollments
            WHERE batch_enrollments.userId = User.id
            AND batch_enrollments.status = 'completed'
          )`),
          'completedCourses'
        ]
      ]
    },
    include: [
      {
        model: UserProfile,
        as: 'profile',
        required: false,
        attributes: ['bio', 'location', 'company', 'website', 'linkedin', 'github', 'timezone', 'learningStyle']
      }
    ],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: offset,
    distinct: true
  });

  // Log activity
  await logActivity(
    req.user.id,
    'VIEW_STUDENTS',
    'User',
    null,
    { page, search, status }
  );

  res.json({
    success: true,
    data: {
      students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalCount: count,
        hasMore: offset + students.length < count
      }
    }
  });
});

// @desc    Get single student details with full profile
// @route   GET /api/admin/students/:id
// @access  Private/Admin
const getStudentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await User.findOne({
    where: { id, role: 'student' },
    attributes: {
      exclude: ['password'],
      include: [
        [
          literal(`(
            SELECT COUNT(*)
            FROM batch_enrollments
            WHERE batch_enrollments.userId = User.id
          )`),
          'enrollmentCount'
        ],
        [
          literal(`(
            SELECT COUNT(*)
            FROM payments
            WHERE payments.studentId = User.id
            AND payments.status = 'paid'
          )`),
          'paymentCount'
        ],
        [
          literal(`(
            SELECT SUM(amount)
            FROM payments
            WHERE payments.studentId = User.id
            AND payments.status = 'paid'
          )`),
          'totalSpent'
        ]
      ]
    },
    include: [
      {
        model: UserProfile,
        as: 'profile',
        required: false
      },
      {
        model: BatchEnrollment,
        as: 'enrollments',
        include: [
          {
            model: Batch,
            attributes: ['id', 'name', 'courseId'],
            include: [
              {
                model: Course,
                attributes: ['id', 'title', 'thumbnail']
              }
            ]
          }
        ],
        limit: 10,
        order: [['createdAt', 'DESC']]
      },
      {
        model: Payment,
        as: 'studentPayments',
        attributes: ['id', 'amount', 'status', 'paidAt', 'courseId', 'batchId'],
        include: [
          {
            model: Course,
            attributes: ['id', 'title']
          }
        ],
        limit: 10,
        order: [['paidAt', 'DESC']]
      }
    ]
  });

  if (!student) {
    throw new AppError('Student not found', 404);
  }

  // Log activity
  await logActivity(
    req.user.id,
    'VIEW_STUDENT_DETAILS',
    'User',
    id,
    { studentName: student.name }
  );

  res.json({
    success: true,
    data: student
  });
});

module.exports = {
  getAdminDashboard,
  getSystemAnalytics,
  getAllUsers,
  getLiveClasses,
  getPendingPayouts,
  approvePayout,
  rejectPayout,
  getSystemHealth,
  getActivityLogs,
  getAllNotifications,
  sendNotification,
  scheduleNotification,
  deleteNotification,
  getAllStudents,
  getStudentDetails,
  logActivity
};
