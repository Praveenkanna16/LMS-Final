const express = require('express');
const router = express.Router();
const {
  getTeacherApplications,
  getTeacherApplication,
  submitTeacherApplication,
  reviewTeacherApplication,
  getTeachers,
  getTeacherDetails,
  toggleTeacherSuspension,
  updateTeacherCommission,
  getMyStudents,
  getStudentInfo
} = require('../controllers/teacherManagementController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Teacher Applications
router.get('/applications', requireRole(['admin']), getTeacherApplications);
router.get('/applications/:id', requireRole(['admin']), getTeacherApplication);
router.post('/applications', submitTeacherApplication);
router.put('/applications/:id/review', requireRole(['admin']), reviewTeacherApplication);

// Teacher's Students (Teacher Portal) - Must come before /:id routes
router.get('/my/students', requireRole(['teacher']), getMyStudents);
router.get('/my/students/:id', requireRole(['teacher']), getStudentInfo);

// Teacher Management
router.get('/', requireRole(['admin']), getTeachers);
router.get('/:id', requireRole(['admin', 'teacher']), getTeacherDetails);
router.put('/:id/suspension', requireRole(['admin']), toggleTeacherSuspension);
router.put('/:id/commission', requireRole(['admin']), updateTeacherCommission);

module.exports = router;
