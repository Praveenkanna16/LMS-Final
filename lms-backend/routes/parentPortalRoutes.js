const express = require('express');
const router = express.Router();
const {
  createParentAccess,
  parentLogin,
  getStudentProgressForParent,
  getAttendanceReportForParent,
  getPaymentHistoryForParent,
  updateNotificationPreferences,
  revokeParentAccess
} = require('../controllers/parentPortalController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ==================== PARENT ACCESS MANAGEMENT ====================

// Create parent access (Admin/Teacher)
router.post('/create', authMiddleware, createParentAccess);

// Parent login with access code
router.post('/login', parentLogin);

// Revoke parent access (Admin)
router.delete('/:id/revoke', authMiddleware, revokeParentAccess);

// ==================== PARENT PORTAL FEATURES ====================

// Get student progress (requires access code in header)
router.get('/student/progress', getStudentProgressForParent);

// Get attendance report (requires access code in header)
router.get('/student/attendance', getAttendanceReportForParent);

// Get payment history (requires access code in header)
router.get('/student/payments', getPaymentHistoryForParent);

// Update notification preferences (requires access code in header)
router.put('/preferences', updateNotificationPreferences);

module.exports = router;
