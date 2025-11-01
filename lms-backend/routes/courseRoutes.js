const express = require('express');
const { param, body } = require('express-validator');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getFeaturedCourses,
  getCoursesByCategory,
  getPopularCourses,
  searchCourses,
  getCourseAnalytics,
  togglePublishCourse,
  getMyCourses
} = require('../controllers/courseController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const courseIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid course ID')
];

const createCourseValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Course title must be between 3 and 200 characters'),

  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Course description must be between 10 and 2000 characters'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Course price must be a positive number'),

  body('category')
    .isIn([
      'Mathematics', 'Physics', 'Chemistry', 'Biology',
      'English', 'Computer Science', 'Economics', 'History',
      'Geography', 'Art', 'Music', 'Programming', 'Other'
    ])
    .withMessage('Invalid course category'),

  body('level')
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels'])
    .withMessage('Invalid course level')
];

// Public routes
router.get('/featured', getFeaturedCourses);
router.get('/popular', getPopularCourses);
router.get('/search', searchCourses);
router.get('/category/:category', getCoursesByCategory);
router.get('/', auth.optionalAuth, getCourses);
router.get('/:id', courseIdValidation, getCourse);

// Protected routes - require authentication
router.use(auth.authMiddleware);

// Teacher routes - require teacher role or ownership
router.post('/', auth.requireRole('teacher', 'admin'), createCourseValidation, createCourse);
router.get('/teacher/my-courses', auth.requireRole('teacher'), getMyCourses);
router.put('/:id', courseIdValidation, updateCourse);
router.delete('/:id', courseIdValidation, deleteCourse);
router.get('/:id/analytics', courseIdValidation, getCourseAnalytics);
router.put('/:id/publish', courseIdValidation, togglePublishCourse);

module.exports = router;
