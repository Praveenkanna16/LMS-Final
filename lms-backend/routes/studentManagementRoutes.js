const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  bulkEnrollStudents,
  importStudentsFromCSV,
  exportStudentsToCSV,
  bulkSendMessages,
  bulkUpdateStudentStatus,
  getStudentProfile,
  getStudentEngagement
} = require('../controllers/studentManagementController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/csv/' });

// ==================== BULK OPERATIONS ====================

// Bulk enroll students (Admin/Teacher)
router.post('/bulk/enroll', authMiddleware, bulkEnrollStudents);

// Import students from CSV (Admin)
router.post('/bulk/import', authMiddleware, upload.single('csvFile'), importStudentsFromCSV);

// Export students to CSV (Admin/Teacher)
router.get('/bulk/export', authMiddleware, exportStudentsToCSV);

// Bulk send messages (Admin/Teacher)
router.post('/bulk/message', authMiddleware, bulkSendMessages);

// Bulk update student status (Admin)
router.post('/bulk/update-status', authMiddleware, bulkUpdateStudentStatus);

// ==================== PERFORMANCE TRACKING ====================

// Get comprehensive student profile (All)
router.get('/:studentId/profile', authMiddleware, getStudentProfile);

// Get student engagement metrics (All)
router.get('/:studentId/engagement', authMiddleware, getStudentEngagement);

module.exports = router;
