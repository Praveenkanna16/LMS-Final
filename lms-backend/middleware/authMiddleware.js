const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user not found'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      // Check if user is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Account is temporarily locked. Please try again later.'
        });
      }

      // Attach user to request
      req.user = user.toJSON();
      next();

    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Role-based authorization middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Support calling requireRole('teacher','admin') or requireRole(['teacher','admin'])
    let allowedRoles = roles;
    if (roles.length === 1 && Array.isArray(roles[0])) {
      allowedRoles = roles[0];
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check specific permissions
    const hasPermission = req.user.permissions?.some(perm =>
      perm.module === module && perm.actions.includes(action)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${module}.${action}`
      });
    }

    next();
  };
};

// Optional authentication middleware (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (user && user.isActive) {
          req.user = user.toJSON();
        }
      } catch (jwtError) {
        // Token is invalid but that's okay for optional auth
        logger.debug('Optional auth: Invalid token provided');
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

// Course/Teacher ownership middleware
const requireOwnership = (resourceType = 'course') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceId = req.params.id || req.params.courseId;
    const userId = req.user.id;

    // Check ownership based on resource type
    switch (resourceType) {
      case 'course':
        // For now, just check if user is the owner based on user ID
        // This would need to be implemented based on the actual resource structure
        if (req.params.id && req.user.id !== req.params.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.'
          });
        }
        break;

      case 'batch':
        if (req.params.id && req.user.id !== req.params.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.'
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid resource type for ownership check'
        });
    }

    next();
  };
};

// Batch enrollment middleware
const requireEnrollment = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const batchId = req.params.id || req.params.batchId;
    const userId = req.user.id;

    try {
      // For now, just check if user is authenticated
      // This would need to be implemented with proper batch enrollment logic
      if (req.user.role === 'admin') {
        return next(); // Admins can access any batch
      }

      // Simplified check - just ensure user is authenticated
      next();

    } catch (error) {
      logger.error('Enrollment check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking enrollment'
      });
    }
  };
};

// Teacher portal auth middleware (allows fallback to default user)
const teacherPortalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (token) {
      try {
        // Try to verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (user && user.isActive) {
          req.user = user.toJSON();
          return next();
        }
      } catch (jwtError) {
        // Token invalid, but we'll use fallback
        logger.debug('Teacher Portal Auth: Token invalid, using fallback');
      }
    }

    // Fallback: Use default user (ID 10) for development/testing
    try {
      const defaultUser = await User.findByPk(10);
      if (defaultUser && defaultUser.isActive) {
        req.user = defaultUser.toJSON();
      } else {
        // Create a minimal user object for fallback
        req.user = {
          id: 10,
          role: 'teacher',
          name: 'Teacher User',
          email: 'teacher@example.com'
        };
      }
    } catch (err) {
      req.user = {
        id: 10,
        role: 'teacher',
        name: 'Teacher User',
        email: 'teacher@example.com'
      };
    }

    next();

  } catch (error) {
    logger.error('Teacher Portal Auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Rate limiting middleware for sensitive operations
const sensitiveOperationRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many sensitive operations. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  }
});

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
  optionalAuth,
  requireOwnership,
  requireEnrollment,
  sensitiveOperationRateLimit,
  teacherPortalAuth
};
