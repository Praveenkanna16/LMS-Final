const express = require('express');
const { param, body } = require('express-validator');
const {
  getAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  startAssessment,
  submitAssessment,
  getMySubmissions,
  getMyAssessments,
  gradeSubmission,
  getAssessmentAnalytics,
  getUpcomingAssignments
} = require('../controllers/assessmentController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const assessmentIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid assessment ID')
];

const createAssessmentValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Assessment title must be between 3 and 200 characters'),

  body('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),

  body('type')
    .isIn(['quiz', 'assignment', 'exam', 'lab_report', 'project', 'presentation'])
    .withMessage('Invalid assessment type'),

  body('scheduledFor')
    .isISO8601()
    .withMessage('Invalid scheduled date'),

  body('deadline')
    .isISO8601()
    .withMessage('Invalid deadline'),

  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Time limit must be between 1 and 480 minutes')
];

// Public routes
router.get('/', getAssessments);
router.get('/:id', assessmentIdValidation, getAssessment);

// Protected routes - require authentication
router.use(auth.authMiddleware);

// Student assessment routes
router.get('/my-submissions', auth.requireRole('student'), getMySubmissions);
router.get('/upcoming', auth.authMiddleware, getUpcomingAssignments); // Add this line
router.post('/:id/start', auth.requireRole('student'), assessmentIdValidation, startAssessment);
router.post('/:id/submit', auth.requireRole('student'), assessmentIdValidation, submitAssessment);

// Teacher assessment routes
router.get('/teacher/my-assessments', auth.requireRole('teacher'), getMyAssessments);
router.post('/', auth.requireRole('teacher'), createAssessmentValidation, createAssessment);
router.put('/:id', assessmentIdValidation, updateAssessment);
router.delete('/:id', assessmentIdValidation, deleteAssessment);
router.get('/:id/analytics', assessmentIdValidation, getAssessmentAnalytics);
router.put('/:id/grade/:studentId', auth.requireRole('teacher'), assessmentIdValidation, gradeSubmission);

module.exports = router;
