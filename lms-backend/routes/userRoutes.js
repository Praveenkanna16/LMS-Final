const express = require('express');
const { param, body } = require('express-validator');
const {
  getUsers,
  getUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserAnalytics,
  updateUserPermissions,
  getUserBatches,
  getUserPayments
} = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const userIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID')
];

const updateStatusValidation = [
  ...userIdValidation,
  body('status')
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended')
];

const updateRoleValidation = [
  ...userIdValidation,
  body('role')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be student, teacher, or admin')
];

const updatePermissionsValidation = [
  ...userIdValidation,
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array')
];

// All user routes require authentication
router.use(authMiddleware);

// Get current user profile (already handled in auth routes)
// router.get('/me', getMe);

// Get all users (Admin only)
router.get('/', requireRole('admin'), getUsers);

// Get single user
router.get('/:id', userIdValidation, getUser);

// Update user status (Admin only)
router.put('/:id/status', requireRole('admin'), updateStatusValidation, updateUserStatus);

// Update user role (Admin only)
router.put('/:id/role', requireRole('admin'), updateRoleValidation, updateUserRole);

// Update user permissions (Admin only)
router.put('/:id/permissions', requireRole('admin'), updatePermissionsValidation, updateUserPermissions);

// Delete user (Admin only) - Soft delete
router.delete('/:id', requireRole('admin'), userIdValidation, deleteUser);

// Get user analytics (Admin only)
router.get('/:id/analytics', requireRole('admin'), userIdValidation, getUserAnalytics);

// Get user's enrolled batches
router.get('/:id/batches', userIdValidation, getUserBatches);

// Get user's payment history
router.get('/:id/payments', userIdValidation, getUserPayments);

module.exports = router;
