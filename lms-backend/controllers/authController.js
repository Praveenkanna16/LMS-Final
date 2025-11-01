const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('Registration validation failed:', {
      email: req.body.email,
      errors: errors.array(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email, password, role } = req.body;

  logger.info('Processing registration request:', {
    email,
    name: name?.substring(0, 3) + '***',
    role,
    ip: req.ip
  });

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    logger.warn('Registration attempt with existing email:', {
      email,
      existingUserId: existingUser.id,
      ip: req.ip
    });

    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  try {
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    logger.info('User created successfully:', {
      userId: user.id,
      email,
      role,
      ip: req.ip
    });

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    logger.info(`New user registered successfully: ${email} (${role})`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('User creation failed:', {
      email,
      name: name?.substring(0, 3) + '***',
      role,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      logger.error('Sequelize validation errors:', validationErrors);

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.map(err => ({
          field: err.field,
          msg: err.message,
          value: err.value
        }))
      });
    }

    // Handle unique constraint errors (duplicate email)
    if (error.name === 'SequelizeUniqueConstraintError') {
      logger.error('Unique constraint violation:', {
        email,
        error: error.message
      });

      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    throw error; // Re-throw for global error handler
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  try {
    // Find user and check password
    const user = await User.findByCredentials(email, password);

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    logger.info(`User logged in: ${email} (${user.role})`);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  } catch (err) {
    // Normalize invalid credentials to 401 instead of 500
    if (err && /Invalid email or password/i.test(err.message)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    throw err; // let global error handler process other errors
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Remove password from response
  const userResponse = user.toJSON();
  delete userResponse.password;

  res.json({
    success: true,
    data: userResponse
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name'];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await user.update(updates);

  logger.info(`Profile updated for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  // Get user
  const user = await User.findByPk(req.user.id);

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, we don't need to do anything server-side
  // The client should remove the token from storage

  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public (with refresh token)
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Get user
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    logger.info(`Token refreshed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  }

  // Generate password reset token (simplified for now)
  const resetToken = user.generateAuthToken();

  logger.info(`Password reset requested for user: ${email}`);

  res.json({
    success: true,
    message: 'If an account with this email exists, a password reset link has been sent.'
  });
});

// @desc    Get user statistics
// @route   GET /api/auth/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  const stats = {
    totalPoints: 0,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    levelProgress: 0,
    streak: { current: 0, longest: 0 },
    achievements: [],
    badges: [],
    progress: {
      coursesEnrolled: 0,
      coursesCompleted: 0,
      totalStudyTime: 0,
      averageScore: 0,
      certificates: [],
      lastActive: new Date()
    }
  };

  res.json({
    success: true,
    data: { stats }
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  // For now, just return success
  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
  forgotPassword,
  getStats,
  verifyEmail
};
