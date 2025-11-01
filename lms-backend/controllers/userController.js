const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const { Op } = require('sequelize');

const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      const q = `%${req.query.search}%`;
      where[Op.or] = [{ name: { [Op.like]: q } }, { email: { [Op.like]: q } }];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Return plain array for frontend expectations
    return res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  });

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
});

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const [updatedRowsCount] = await User.update(
    {
      isActive: status === 'active'
    },
    {
      where: { id: req.params.id },
      returning: true
    }
  );

  if (updatedRowsCount === 0) {
    throw new AppError('User not found', 404);
  }

  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  });

  // Create notification
  await Notification.create({
    title: 'Account Status Updated',
    message: `Your account has been ${status}. ${status === 'active' ? 'You can now access all features.' : 'Please contact support if you have questions.'}`,
    recipientId: user.id,
    type: 'profile_update',
    category: 'system',
    priority: status === 'suspended' ? 'high' : 'medium',
    channels: JSON.stringify({
      email: true,
      push: true,
      sms: false,
      inApp: true
    })
  });

  logger.info(`User ${user.email} status updated to ${status} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'User status updated successfully',
    data: { user }
  });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['student', 'teacher', 'admin'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const [updatedRowsCount] = await User.update(
    { role },
    {
      where: { id: req.params.id },
      returning: true
    }
  );

  if (updatedRowsCount === 0) {
    throw new AppError('User not found', 404);
  }

  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  });

  // Create notification
  await Notification.create({
    title: 'Role Updated',
    message: `Your role has been updated to ${role}. You now have access to ${role}-specific features.`,
    recipientId: user.id,
    type: 'profile_update',
    category: 'system',
    priority: 'medium',
    channels: JSON.stringify({
      email: true,
      push: true,
      sms: false,
      inApp: true
    })
  });

  logger.info(`User ${user.email} role updated to ${role} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: { user }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Soft delete - mark as inactive instead of removing
  user.isActive = false;
  await user.save();

  // Create notification
  await Notification.create({
    title: 'Account Deactivated',
    message: 'Your account has been deactivated. Contact support if this was not expected.',
    recipientId: user.id,
    type: 'profile_update',
    category: 'system',
    priority: 'high',
    channels: JSON.stringify({
      email: true,
      push: true,
      sms: false,
      inApp: true
    })
  });

  logger.info(`User ${user.email} deactivated by ${req.user.email}`);

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Get user analytics
// @route   GET /api/users/:id/analytics
// @access  Private/Admin
const getUserAnalytics = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Simplified analytics for now
  const analytics = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      joinDate: user.created_at,
      lastActive: user.lastLogin,
      isActive: user.isActive
    },
    learning: {
      coursesEnrolled: 0,
      coursesCompleted: 0,
      totalStudyTime: 0,
      averageScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      currentLevel: 1
    },
    assessments: {
      totalTaken: 0,
      averageScore: 0,
      passed: 0
    },
    payments: {
      totalPaid: 0,
      paymentCount: 0,
      lastPayment: null
    },
    engagement: {
      learningPathsActive: 0,
      totalLearningPaths: 0,
      averageSessionTime: 0
    }
  };

  res.json({
    success: true,
    data: { analytics }
  });
});

// @desc    Update user permissions (Admin only)
// @route   PUT /api/users/:id/permissions
// @access  Private/Admin
const updateUserPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    throw new AppError('Permissions must be an array', 400);
  }

  const [updatedRowsCount] = await User.update(
    { permissions: JSON.stringify(permissions) },
    {
      where: { id: req.params.id },
      returning: true
    }
  );

  if (updatedRowsCount === 0) {
    throw new AppError('User not found', 404);
  }

  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  });

  logger.info(`Permissions updated for user ${user.email} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'User permissions updated successfully',
    data: { user }
  });
});

// @desc    Get user's enrolled batches
// @route   GET /api/users/:id/batches
// @access  Private
const getUserBatches = asyncHandler(async (req, res) => {
  const Batch = require('../models/Batch');
  const BatchEnrollment = require('../models/BatchEnrollment');

  const batches = await Batch.findAll({
    include: [
      {
        model: BatchEnrollment,
        where: { userId: req.params.id },
        required: true
      },
      {
        model: require('../models').Course,
        attributes: ['id', 'title', 'category']
      },
      {
        model: require('../models').User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      }
    ],
    where: { isActive: true }
  });

  res.json({
    success: true,
    data: { batches }
  });
});

// @desc    Get user's payment history
// @route   GET /api/users/:id/payments
// @access  Private
const getUserPayments = asyncHandler(async (req, res) => {
  const Payment = require('../models/Payment');

  const payments = await Payment.findAll({
    where: { studentId: req.params.id },
    include: [
      {
        model: require('../models').Batch,
        attributes: ['id', 'name']
      },
      {
        model: require('../models').Course,
        attributes: ['id', 'title']
      },
      {
        model: require('../models').User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

  res.json({
    success: true,
    data: {
      payments,
      summary: {
        totalPaid,
        paymentCount: payments.length,
        lastPayment: payments.length > 0 ? payments[0].createdAt : null
      }
    }
  });
});

module.exports = {
  getUsers,
  getUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserAnalytics,
  updateUserPermissions,
  getUserBatches,
  getUserPayments
};
