const { asyncHandler } = require('../middleware/errorHandler');
const { User, Course, Batch, LiveSession, Payment, BatchEnrollment } = require('../models');
const { Op } = require('sequelize');

// @desc    Get admin analytics
// @route   GET /api/analytics/admin
// @access  Private/Admin
const getAdminAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get current date and one month ago for growth calculations
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Get total counts
    const totalUsers = await User.count();
    const totalCourses = await Course.count();
    const totalBatches = await Batch.count();
    const liveClassesCount = await LiveSession.count();

    // Get active users (users who logged in within last 30 days)
    const activeUsers = await User.count({
      where: {
        lastLogin: {
          [Op.gte]: oneMonthAgo
        }
      }
    });

    // Get total revenue from payments
    const totalRevenueResult = await Payment.sum('amount', {
      where: {
        status: 'completed'
      }
    });
    const totalRevenue = totalRevenueResult || 0;

    // Calculate average course rating
    const courses = await Course.findAll({
      attributes: ['rating', 'totalRatings']
    });
    
    let totalRating = 0;
    let totalRatingCount = 0;
    courses.forEach(course => {
      if (course.rating && course.totalRatings) {
        totalRating += course.rating * course.totalRatings;
        totalRatingCount += course.totalRatings;
      }
    });
    const averageRating = totalRatingCount > 0 ? totalRating / totalRatingCount : 0;

    // Calculate completion rate based on enrollments
    const totalEnrollments = await BatchEnrollment.count();
    const completedEnrollments = await BatchEnrollment.count({
      where: {
        status: 'completed'
      }
    });
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    // Calculate growth rates
    const usersLastMonth = await User.count({
      where: {
        created_at: {
          [Op.between]: [twoMonthsAgo, oneMonthAgo]
        }
      }
    });
    const usersThisMonth = await User.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo
        }
      }
    });
    const usersGrowth = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0;

    const coursesLastMonth = await Course.count({
      where: {
        created_at: {
          [Op.between]: [twoMonthsAgo, oneMonthAgo]
        }
      }
    });
    const coursesThisMonth = await Course.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo
        }
      }
    });
    const coursesGrowth = coursesLastMonth > 0 ? ((coursesThisMonth - coursesLastMonth) / coursesLastMonth) * 100 : 0;

    // Calculate revenue growth
    const revenueLastMonth = await Payment.sum('amount', {
      where: {
        status: 'completed',
        created_at: {
          [Op.between]: [twoMonthsAgo, oneMonthAgo]
        }
      }
    }) || 0;
    
    const revenueThisMonth = await Payment.sum('amount', {
      where: {
        status: 'completed',
        created_at: {
          [Op.gte]: oneMonthAgo
        }
      }
    }) || 0;
    
    const revenueGrowth = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

    // Calculate engagement growth (based on active users)
    const activeUsersLastMonth = await User.count({
      where: {
        lastLogin: {
          [Op.between]: [twoMonthsAgo, oneMonthAgo]
        }
      }
    });
    const engagementGrowth = activeUsersLastMonth > 0 ? ((activeUsers - activeUsersLastMonth) / activeUsersLastMonth) * 100 : 0;

    // Get top performing courses
    const topCourses = await Course.findAll({
      order: [['studentsEnrolled', 'DESC'], ['rating', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'studentsEnrolled', 'rating']
    });

    // Get top performing teachers
    const topTeachers = await User.findAll({
      where: { role: 'teacher' },
      include: [{
        model: Course,
        as: 'courses',
        attributes: ['studentsEnrolled', 'rating']
      }],
      limit: 5,
      attributes: ['id', 'name', 'email']
    });

    // Calculate monthly revenue for the last 6 months
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRevenue = await Payment.sum('amount', {
        where: {
          status: 'completed',
          created_at: {
            [Op.between]: [monthStart, monthEnd]
          }
        }
      }) || 0;

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      });
    }

    // Calculate average order value
    const completedPayments = await Payment.findAll({
      where: {
        status: 'completed'
      },
      attributes: ['amount']
    });
    
    const averageOrderValue = completedPayments.length > 0 
      ? completedPayments.reduce((sum, payment) => sum + payment.amount, 0) / completedPayments.length 
      : 0;

    // Calculate conversion rate (completed payments vs total users)
    const totalPayments = await Payment.count();
    const conversionRate = totalUsers > 0 ? (completedPayments.length / totalUsers) * 100 : 0;

    // Get revenue by category (based on course categories)
    const revenueByCategory = {};
    const categoryRevenues = await Payment.findAll({
      include: [{
        model: Course,
        attributes: ['category']
      }],
      where: {
        status: 'completed'
      },
      attributes: ['amount']
    });

    categoryRevenues.forEach(payment => {
      if (payment.Course && payment.Course.category) {
        const category = payment.Course.category;
        revenueByCategory[category] = (revenueByCategory[category] || 0) + payment.amount;
      }
    });

    // Generate User Growth Chart Data (last 6 months)
    const userGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const totalUsersInMonth = await User.count({
        where: {
          created_at: {
            [Op.lte]: monthEnd
          }
        }
      });

      const activeUsersInMonth = await User.count({
        where: {
          lastLogin: {
            [Op.between]: [monthStart, monthEnd]
          }
        }
      });

      userGrowthData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        users: totalUsersInMonth,
        active: activeUsersInMonth
      });
    }

    // Generate Active Hours Data (hourly distribution of live sessions)
    const activeHoursData = [];
    const hours = ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
    const hourRanges = [
      { start: 6, end: 9 },
      { start: 9, end: 12 },
      { start: 12, end: 15 },
      { start: 15, end: 18 },
      { start: 18, end: 21 },
      { start: 21, end: 24 }
    ];

    for (let i = 0; i < hours.length; i++) {
      const { start, end } = hourRanges[i];
      
      // Get actual live sessions in this hour range
      const sessions = await LiveSession.findAll({
        where: {
          startTime: {
            [Op.gte]: oneMonthAgo
          }
        },
        include: [{
          model: Batch,
          as: 'batch',
          include: [{
            model: BatchEnrollment,
            as: 'enrollments',
            where: { status: 'active' },
            required: false
          }]
        }]
      });

      // Count students in sessions that fall within this hour range
      let studentsCount = 0;
      sessions.forEach(session => {
        const sessionHour = new Date(session.startTime).getHours();
        if (sessionHour >= start && sessionHour < end) {
          studentsCount += session.batch?.enrollments?.length || 0;
        }
      });

      activeHoursData.push({
        hour: hours[i],
        students: studentsCount
      });
    }

    // Generate Attendance Trend Data (last 4 weeks)
    const attendanceTrendData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      // Get actual sessions in this week
      const sessionsInWeek = await LiveSession.findAll({
        where: {
          startTime: {
            [Op.between]: [weekStart, weekEnd]
          }
        },
        include: [{
          model: Batch,
          as: 'batch',
          include: [{
            model: BatchEnrollment,
            as: 'enrollments',
            where: { status: 'active' },
            required: false
          }]
        }]
      });

      // Calculate actual expected attendees
      let expectedAttendees = 0;
      sessionsInWeek.forEach(session => {
        expectedAttendees += session.batch?.enrollments?.length || 0;
      });

      // For now, use 75% as default attendance until we have attendance tracking
      // You can replace this with actual attendance data when available
      const attendancePercentage = expectedAttendees > 0 ? 75 : 0;

      attendanceTrendData.push({
        week: `Week ${4 - i}`,
        attendance: attendancePercentage
      });
    }

    // Generate Batch Performance Data
    const batches = await Batch.findAll({
      include: [{
        model: BatchEnrollment,
        as: 'enrollments',
        attributes: ['status']
      }],
      limit: 4,
      attributes: ['id', 'name']
    });

    const batchPerformanceData = await Promise.all(batches.map(async (batch) => {
      const totalEnrolled = batch.enrollments.length;
      const completed = batch.enrollments.filter(e => e.status === 'completed').length;
      const active = batch.enrollments.filter(e => e.status === 'active').length;
      
      // Calculate real performance based on completed vs total
      const performance = totalEnrolled > 0 
        ? Math.round((completed / totalEnrolled) * 100)
        : 0;

      return {
        batch: batch.name || `Batch ${batch.id}`,
        performance: performance,
        students: totalEnrolled
      };
    }));

    // Generate Teacher Performance Data
    const teachers = await User.findAll({
      where: { role: 'teacher' },
      include: [{
        model: LiveSession,
        as: 'liveSessions',
        attributes: ['id']
      }, {
        model: Course,
        as: 'courses',
        attributes: ['rating', 'totalRatings']
      }],
      limit: 4,
      attributes: ['id', 'name']
    });

    const teacherPerformanceData = teachers.map(teacher => {
      // Calculate average rating from teacher's courses
      let totalRating = 0;
      let totalRatings = 0;
      
      if (teacher.courses && teacher.courses.length > 0) {
        teacher.courses.forEach(course => {
          if (course.rating && course.totalRatings) {
            totalRating += course.rating * course.totalRatings;
            totalRatings += course.totalRatings;
          }
        });
      }
      
      const avgRating = totalRatings > 0 
        ? Math.round((totalRating / totalRatings) * 10) / 10 
        : 0;

      return {
        name: teacher.name,
        rating: avgRating || 0, // Use actual rating or 0 if no ratings
        classes: teacher.liveSessions ? teacher.liveSessions.length : 0
      };
    });

    // Generate Class Participation Data
    const totalActiveEnrollments = await BatchEnrollment.count({
      where: { status: 'active' }
    });
    const totalCompletedEnrollments = await BatchEnrollment.count({
      where: { status: 'completed' }
    });
    const totalInactiveEnrollments = await BatchEnrollment.count({
      where: { status: 'inactive' }
    });

    const totalAll = totalActiveEnrollments + totalCompletedEnrollments + totalInactiveEnrollments;
    
    const participationData = totalAll > 0 ? [
      {
        name: 'Active',
        value: Math.round((totalActiveEnrollments / totalAll) * 100)
      },
      {
        name: 'Moderate',
        value: Math.round((totalCompletedEnrollments / totalAll) * 100)
      },
      {
        name: 'Low',
        value: Math.round((totalInactiveEnrollments / totalAll) * 100)
      }
    ] : [
      { name: 'Active', value: 0 },
      { name: 'Moderate', value: 0 },
      { name: 'Low', value: 0 }
    ];

    const analyticsData = {
      overview: {
        totalUsers,
        totalCourses,
        totalBatches,
        totalRevenue,
        activeUsers,
        completionRate: Math.round(completionRate * 10) / 10,
        liveClassesCount,
        averageRating: Math.round(averageRating * 10) / 10
      },
      growth: {
        usersGrowth: Math.round(usersGrowth * 10) / 10,
        coursesGrowth: Math.round(coursesGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        engagementGrowth: Math.round(engagementGrowth * 10) / 10
      },
      topPerformers: {
        courses: topCourses,
        teachers: topTeachers.map(teacher => ({
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          totalStudents: teacher.courses.reduce((sum, course) => sum + (course.studentsEnrolled || 0), 0),
          averageRating: teacher.courses.length > 0 
            ? teacher.courses.reduce((sum, course) => sum + (course.rating || 0), 0) / teacher.courses.length 
            : 0
        })),
        students: []
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        byCategory: revenueByCategory,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      charts: {
        userGrowth: userGrowthData,
        activeHours: activeHoursData,
        attendanceTrend: attendanceTrendData,
        batchPerformance: batchPerformanceData,
        teacherPerformance: teacherPerformanceData,
        participation: participationData
      }
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
});

module.exports = {
  getAdminAnalytics
};
