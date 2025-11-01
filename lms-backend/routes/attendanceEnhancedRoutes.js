const express = require('express');
const router = express.Router();
const {
  createAttendanceSession,
  markAttendanceQR,
  markAttendanceManual,
  getSessionAttendance,
  getStudentAttendanceReport,
  getBatchAttendanceAnalytics,
  sendLowAttendanceAlerts
} = require('../controllers/attendanceEnhancedController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ==================== ATTENDANCE SESSION MANAGEMENT ====================

// Create attendance session with QR code (Teacher)
router.post('/session/create', authMiddleware, createAttendanceSession);

// Mark attendance via QR code scan (Student)
router.post('/mark/qr', authMiddleware, markAttendanceQR);

// Mark attendance manually (Teacher)
router.post('/mark/manual', authMiddleware, markAttendanceManual);

// ==================== ATTENDANCE REPORTS ====================

// Get attendance for a specific session (Teacher)
router.get('/session/:liveSessionId', authMiddleware, getSessionAttendance);

// Get student attendance report (Teacher/Student)
router.get('/student/:studentId/report', authMiddleware, getStudentAttendanceReport);

// Get batch attendance analytics (Teacher/Admin)
router.get('/batch/:batchId/analytics', authMiddleware, getBatchAttendanceAnalytics);

// ==================== ALERTS & NOTIFICATIONS ====================

// Send low attendance alerts (Teacher/Admin)
router.post('/alerts/low-attendance', authMiddleware, sendLowAttendanceAlerts);

module.exports = router;
