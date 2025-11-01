const { Batch, User, Assessment, AssessmentSubmission, Notification, ActivityLog, Achievement, UserAchievement, Progress, SessionAttendance, LiveSession } = require('../models');
const { Op } = require('sequelize');

/**
 * Student Portal Controller
 * Handles all student-specific dashboard and portal APIs
 */

/**
 * Get comprehensive dashboard data with real stats
 * GET /api/student/dashboard/overview
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const studentId = req.user.id;

    console.log('🎓 getDashboardOverview called for student:', studentId);

    // Fetch all data in parallel for performance
    const [
      batches,
      attendanceRecords,
      assessmentSubmissions,
      notifications,
      recentActivities,
      achievements
    ] = await Promise.all([
      // Get enrolled batches with details
      Batch.findAll({
        where: {
          students: {
            [Op.like]: `%"student":${studentId}%`
          }
        }
      }),

      // Get attendance records
      SessionAttendance ? SessionAttendance.findAll({
        where: { studentId },
        order: [['createdAt', 'DESC']],
        limit: 100
      }) : Promise.resolve([]),

      // Get assessment submissions
      AssessmentSubmission ? AssessmentSubmission.findAll({
        where: { userId: studentId },
        include: [
          {
            model: Assessment,
            attributes: ['id', 'title', 'totalPoints'],
            required: false
          }
        ],
        order: [['submittedAt', 'DESC']],
        limit: 50
      }) : Promise.resolve([]),

      // Get notifications (use raw: true to avoid model mapping issues)
      Notification ? Notification.findAll({
        where: { 
          recipientId: studentId
        },
        order: [['id', 'DESC']],
        limit: 20,
        raw: true
      }) : Promise.resolve([]),

      // Get recent activities
      ActivityLog ? ActivityLog.findAll({
        where: { userId: studentId },
        order: [['id', 'DESC']],
        limit: 10,
        raw: true
      }) : Promise.resolve([]),

      // Get achievements
      UserAchievement ? UserAchievement.findAll({
        where: { userId: studentId },
        order: [['earnedAt', 'DESC']]
      }) : Promise.resolve([])
    ]);

    console.log('📚 Batches found for student:', {
      count: batches.length,
      batchIds: batches.map(b => ({ id: b.id, name: b.name }))
    });
    const totalClasses = attendanceRecords.length;
    const attendedClasses = attendanceRecords.filter(a => a.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

    // Calculate recent test score (average of last 5 tests)
    const recentSubmissions = assessmentSubmissions.slice(0, 5).filter(sub => sub.Assessment && sub.totalPoints > 0);
    const recentTestScore = recentSubmissions.length > 0
      ? Math.round(
          recentSubmissions.reduce((sum, sub) => sum + (sub.score / sub.totalPoints) * 100, 0) /
          recentSubmissions.length
        )
      : 0;

    // Get unread notification count
    const notificationsCount = notifications.length;

    // Calculate study streak
    const last7Days = attendanceRecords.slice(0, 7);
    const consecutiveDays = last7Days.filter(a => a.status === 'present').length;
    const studyStreak = consecutiveDays;

    // Get upcoming classes from LiveSession data instead of batch schedules
    const now = new Date();
    const studentBatchIds = batches.map(b => b.id);
    
    console.log('📊 Fetching upcoming sessions for student:', {
      studentId,
      batchCount: batches.length,
      batchIds: studentBatchIds
    });

    const upcomingSessions = await LiveSession.findAll({
      where: {
        batchId: { [Op.in]: studentBatchIds },
        startTime: { [Op.gt]: now },
        status: { [Op.in]: ['scheduled', 'live'] }
      },
      include: [
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'name'],
          include: [
            {
              model: require('../models/Course'),
              as: 'course',
              attributes: ['title']
            },
            {
              model: User,
              as: 'teacher',
              attributes: ['name']
            }
          ]
        }
      ],
      order: [['startTime', 'ASC']],
      limit: 10
    });

    console.log('✅ Upcoming sessions found:', {
      count: upcomingSessions.length
    });

    const upcomingClasses = upcomingSessions.map(session => ({
      id: session.id,
      batchId: session.batchId,
      batchName: session.batch?.name || 'Unknown Batch',
      courseTitle: session.batch?.course?.title || 'Course',
      topic: session.title,
      description: session.description,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      teacher: session.batch?.teacher?.name || 'Teacher',
      meetingId: session.meetingId,
      zoomLink: session.zoomLink,
      status: session.status
    }));

    // Format recent activities
    const formattedActivities = recentActivities.slice(0, 3).map(activity => {
      const timeAgo = getTimeAgo(activity.createdAt);
      return {
        id: activity.id,
        type: activity.action,
        title: activity.description || activity.action,
        batchName: activity.details?.batchName || 'N/A',
        time: timeAgo,
        icon: getActivityIcon(activity.action)
      };
    });

    // Format achievements as badges
    const formattedAchievements = achievements.map(ach => ({
      id: ach.id,
      icon: ach.Achievement?.icon || ach.icon || '🏆',
      label: ach.Achievement?.title || ach.title || 'Achievement',
      earned: true,
      earnedAt: ach.earnedAt
    }));

    // Add locked badges if less than 6
    const allBadges = [
      { icon: '🏆', label: 'Top Scorer', condition: recentTestScore >= 90 },
      { icon: '⭐', label: 'Perfect Attendance', condition: attendancePercentage >= 95 },
      { icon: '🎯', label: 'Quick Learner', condition: assessmentSubmissions.length >= 10 },
      { icon: '🔥', label: 'Streak Master', condition: studyStreak >= 7 },
      { icon: '💪', label: 'Hard Worker', condition: attendancePercentage >= 80 },
      { icon: '🚀', label: 'Rising Star', condition: batches.length >= 3 }
    ];

    const badgesWithStatus = allBadges.map(badge => ({
      ...badge,
      earned: badge.condition
    }));

    // Calculate weekly progress
    const now_date = new Date();
    const last7DaysDate = new Date(now_date.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyAttendance = attendanceRecords.filter(a => 
      new Date(a.date) >= last7DaysDate && a.status === 'present'
    );
    
    const weeklyTests = assessmentSubmissions.filter(s => 
      new Date(s.submittedAt) >= last7DaysDate
    );

    const weeklyProgress = {
      classesAttended: {
        value: weeklyAttendance.length,
        max: 10 // Assuming max 10 classes per week
      },
      testsCompleted: {
        value: weeklyTests.length,
        max: 4 // Assuming max 4 tests per week
      },
      assignmentsDone: {
        value: weeklyTests.filter(s => s.assessment?.type === 'assignment').length,
        max: 5 // Assuming max 5 assignments per week
      }
    };

    // Response with all real data
    res.json({
      success: true,
      data: {
        stats: {
          attendancePercentage,
          recentTestScore,
          notificationsCount,
          studyStreak,
          totalBatches: batches.length,
          totalTests: assessmentSubmissions.length
        },
        batches: batches.map(b => ({
          _id: b.id,
          name: b.name,
          course: {
            title: b.course?.title || 'Course'
          },
          teacher: {
            name: b.teacher?.name || 'Teacher'
          },
          students: b.students || []
        })),
        upcomingClasses: upcomingClasses.slice(0, 10),
        recentActivities: formattedActivities,
        achievements: badgesWithStatus,
        weeklyProgress
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

/**
 * Get student performance analytics
 * GET /api/student/performance
 */
exports.getPerformanceAnalytics = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { range = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysBack = parseInt(range) || 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const [attendanceRecords, assessmentSubmissions] = await Promise.all([
      Attendance.findAll({
        where: {
          studentId,
          date: { [Op.gte]: startDate }
        },
        order: [['date', 'ASC']]
      }),
      AssessmentSubmission.findAll({
        where: {
          studentId,
          submittedAt: { [Op.gte]: startDate }
        },
        include: [
          {
            model: Assessment
          }
        ],
        order: [['submittedAt', 'ASC']]
      })
    ]);

    // Group attendance by month
    const attendanceByMonth = {};
    attendanceRecords.forEach(record => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short' });
      if (!attendanceByMonth[month]) {
        attendanceByMonth[month] = { present: 0, total: 0 };
      }
      attendanceByMonth[month].total++;
      if (record.status === 'present') {
        attendanceByMonth[month].present++;
      }
    });

    const attendanceTrends = Object.entries(attendanceByMonth).map(([month, data]) => ({
      month,
      percentage: Math.round((data.present / data.total) * 100)
    }));

    // Group test scores by date
    const testPerformance = assessmentSubmissions
      .filter(sub => sub.Assessment && sub.totalPoints > 0)
      .map(sub => ({
        date: new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round((sub.score / sub.totalPoints) * 100),
        subject: sub.Assessment.title
      }));

    res.json({
      success: true,
      data: {
        attendanceTrends,
        testPerformance,
        overallStats: {
          avgAttendance: Math.round(
            attendanceRecords.filter(a => a.status === 'present').length /
            attendanceRecords.length * 100
          ) || 0,
          avgScore: Math.round(
            assessmentSubmissions
              .filter(s => s.Assessment && s.totalPoints > 0)
              .reduce((sum, s) => 
                sum + (s.score / s.totalPoints) * 100, 0
              ) / (assessmentSubmissions.filter(s => s.Assessment && s.totalPoints > 0).length || 1)
          ) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics',
      error: error.message
    });
  }
};

/**
 * Get student attendance records
 * GET /api/student/attendance
 */
exports.getAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { batchId, startDate, endDate } = req.query;

    const whereClause = { studentId };
    if (batchId) whereClause.batchId = batchId;
    if (startDate) whereClause.date = { [Op.gte]: new Date(startDate) };
    if (endDate) whereClause.date = { ...whereClause.date, [Op.lte]: new Date(endDate) };

    const attendance = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'name']
        }
      ],
      order: [['date', 'DESC']]
    });

    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      percentage: attendance.length > 0 
        ? Math.round(attendance.filter(a => a.status === 'present').length / attendance.length * 100)
        : 0
    };

    res.json({
      success: true,
      data: {
        attendance,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

/**
 * Get notifications with tabs
 * GET /api/student/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, limit = 20 } = req.query;

    const whereClause = { recipientId: studentId };
    if (type) whereClause.type = type;

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    const unreadCount = await Notification.count({
      where: {
        recipientId: studentId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/student/notification/:id/read
 */
exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, recipientId: studentId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({ isRead: true });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Helper functions
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function getActivityIcon(action) {
  const icons = {
    'class_completed': 'CheckCircle',
    'test_submitted': 'FileText',
    'achievement_earned': 'Award',
    'batch_joined': 'Users',
    'assignment_submitted': 'FileText'
  };
  return icons[action] || 'Activity';
}

/**
 * Get student profile
 * GET /api/student/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;

    const user = await User.findByPk(studentId, {
      attributes: { exclude: ['password', 'loginAttempts', 'deviceInfo'] },
      include: [
        {
          model: require('../models/UserProfile'),
          as: 'profile',
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.created_at,
        profile: user.profile || {}
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

/**
 * Update student profile
 * POST /api/student/update-profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { name, bio, location, timezone, learningStyle, company, website, linkedin, github } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (name.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Name is too long (max 255 characters)'
      });
    }

    // Update user table
    const user = await User.findByPk(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ name: name.trim() });

    // Update or create profile
    const UserProfile = require('../models/UserProfile');
    let profile = await UserProfile.findOne({ where: { userId: studentId } });

    const profileData = {
      bio: bio || null,
      location: location || null,
      timezone: timezone || 'Asia/Kolkata',
      learningStyle: learningStyle || null,
      company: company || null,
      website: website || null,
      linkedin: linkedin || null,
      github: github || null
    };

    if (profile) {
      await profile.update(profileData);
    } else {
      await UserProfile.create({
        userId: studentId,
        ...profileData
      });
    }

    // Fetch updated profile
    const updatedUser = await User.findByPk(studentId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: UserProfile,
          as: 'profile',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Change password
 * POST /api/student/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Get user
    const user = await User.findByPk(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (will be hashed by beforeUpdate hook)
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * Get student payments
 * GET /api/student/payments
 */
exports.getPayments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    const Payment = require('../models/Payment');
    const Course = require('../models/Course');
    
    const whereClause = { studentId };
    if (status) {
      whereClause.status = status;
    }

    const payments = await Payment.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Batch,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Course,
          attributes: ['id', 'title', 'price'],
          required: false
        }
      ]
    });

    const totalPayments = await Payment.count({ where: whereClause });
    
    const successPayments = await Payment.count({
      where: { studentId, status: 'paid' }
    });
    
    const pendingPayments = await Payment.count({
      where: { studentId, status: 'created' }
    });
    
    const failedPayments = await Payment.count({
      where: { studentId, status: 'failed' }
    });

    const totalAmount = await Payment.sum('amount', {
      where: { studentId, status: 'paid' }
    }) || 0;

    res.json({
      success: true,
      data: {
        payments,
        summary: {
          total: totalPayments,
          success: successPayments,
          pending: pendingPayments,
          failed: failedPayments,
          totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

/**
 * Retry failed payment
 * POST /api/student/retry-payment/:id
 */
exports.retryPayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const Payment = require('../models/Payment');
    
    const payment = await Payment.findOne({
      where: { id, studentId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Update payment status to pending for retry
    await payment.update({
      status: 'created',
      retryCount: (payment.retryCount || 0) + 1
    });

    // Generate new payment link (Cashfree integration would go here)
    const paymentLink = `${process.env.FRONTEND_URL}/payment/${payment.id}`;

    res.json({
      success: true,
      message: 'Payment retry initiated',
      data: {
        paymentId: payment.id,
        paymentLink,
        amount: payment.amount
      }
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment',
      error: error.message
    });
  }
};

/**
 * Get payment invoice
 * GET /api/student/invoices/:id
 */
exports.getInvoice = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const Payment = require('../models/Payment');
    const Course = require('../models/Course');
    
    const payment = await Payment.findOne({
      where: { id, studentId, status: 'paid' },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Batch,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Course,
          attributes: ['id', 'title', 'price'],
          required: false
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

/**
 * Get student attendance by batch
 * GET /api/student/attendance/:batchId
 */
exports.getAttendanceByBatch = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { batchId } = req.params;

    if (!SessionAttendance) {
      return res.status(200).json({
        success: true,
        data: {
          attendance: [],
          summary: {
            totalClasses: 0,
            attended: 0,
            absent: 0,
            percentage: 0
          }
        }
      });
    }

    const LiveClass = require('../models/LiveClass');

    const attendance = await SessionAttendance.findAll({
      where: { studentId, batchId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: LiveClass,
          as: 'session',
          attributes: ['id', 'title', 'startTime', 'duration'],
          required: false
        }
      ]
    });

    const totalClasses = await LiveClass.count({
      where: { batchId }
    });

    const attended = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const percentage = totalClasses > 0 ? ((attended / totalClasses) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        attendance,
        summary: {
          totalClasses,
          attended,
          absent,
          percentage: parseFloat(percentage)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

/**
 * Report attendance issue
 * POST /api/student/report-issue
 */
exports.reportAttendanceIssue = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { sessionId, batchId, issueType, description } = req.body;

    if (!sessionId || !batchId || !description) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, Batch ID, and description are required'
      });
    }

    // Create a support ticket for attendance issue
    const SupportTicket = require('../models/SupportTicket');
    
    const ticket = await SupportTicket.create({
      studentId,
      type: 'attendance_issue',
      subject: `Attendance Issue - ${issueType || 'Not Marked'}`,
      description,
      status: 'open',
      priority: 'medium',
      metadata: JSON.stringify({
        sessionId,
        batchId,
        issueType: issueType || 'not_marked'
      })
    });

    res.json({
      success: true,
      message: 'Attendance issue reported successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error reporting attendance issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report attendance issue',
      error: error.message
    });
  }
};

/**
 * Ask a doubt
 * POST /api/student/ask-doubt
 */
exports.askDoubt = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject, batchId, description, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    const SupportTicket = require('../models/SupportTicket');
    
    const doubt = await SupportTicket.create({
      studentId,
      type: 'doubt',
      subject,
      description,
      status: 'open',
      priority: priority || 'low',
      metadata: JSON.stringify({
        batchId: batchId || null
      })
    });

    // Send notification to teachers (if batch specified)
    if (batchId) {
      const batch = await Batch.findByPk(batchId);
      if (batch && batch.teacherId) {
        await Notification.create({
          recipientId: batch.teacherId,
          senderId: studentId,
          title: 'New Doubt Posted',
          message: `A student has asked a doubt in ${batch.name}: ${subject}`,
          type: 'doubt_posted',
          priority: 'medium'
        });
      }
    }

    res.json({
      success: true,
      message: 'Doubt posted successfully',
      data: doubt
    });
  } catch (error) {
    console.error('Error posting doubt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post doubt',
      error: error.message
    });
  }
};

/**
 * Get student doubts
 * GET /api/student/doubts
 */
exports.getDoubts = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, limit = 50 } = req.query;

    const SupportTicket = require('../models/SupportTicket');
    const TicketReply = require('../models/TicketReply');
    
    const whereClause = { studentId, type: 'doubt' };
    if (status) {
      whereClause.status = status;
    }

    const doubts = await SupportTicket.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      include: [
        {
          model: TicketReply,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'role']
            }
          ],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    const summary = {
      total: doubts.length,
      open: doubts.filter(d => d.status === 'open').length,
      resolved: doubts.filter(d => d.status === 'resolved').length,
      closed: doubts.filter(d => d.status === 'closed').length
    };

    res.json({
      success: true,
      data: {
        doubts,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching doubts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doubts',
      error: error.message
    });
  }
};

/**
 * Reply to doubt
 * POST /api/student/reply/:doubtId
 */
exports.replyToDoubt = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { doubtId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const SupportTicket = require('../models/SupportTicket');
    const TicketReply = require('../models/TicketReply');
    
    const doubt = await SupportTicket.findOne({
      where: { id: doubtId, studentId }
    });

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    const reply = await TicketReply.create({
      ticketId: doubtId,
      userId: studentId,
      message: message.trim()
    });

    // Update ticket last updated time
    await doubt.update({ updated_at: new Date() });

    res.json({
      success: true,
      message: 'Reply posted successfully',
      data: reply
    });
  } catch (error) {
    console.error('Error posting reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post reply',
      error: error.message
    });
  }
};

module.exports = exports;
