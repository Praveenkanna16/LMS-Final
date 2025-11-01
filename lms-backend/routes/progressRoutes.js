const express = require('express');
const auth = require('../middleware/authMiddleware');
const {
  updateProgress,
  getProgressByModule,
  getProgressByCourse,
  getProgressByBatch,
  getProgressStats,
  getBatchProgressOverview,
  getStudentProgressInBatch,
  getStreakStats,
  getStreakLeaderboard
} = require('../controllers/progressController');

const router = express.Router();

// Protect all routes
router.use(auth.authMiddleware);

// Module-level progress routes
router.route('/module/:moduleId')
  .get(getProgressByModule);

// Course-level progress routes
router.route('/course/:courseId')
  .get(getProgressByCourse);

// Batch-level progress routes
router.route('/batch/:batchId')
  .get(auth.requireRole('teacher', 'admin'), getProgressByBatch);

router.route('/batch/:batchId/overview')
  .get(auth.requireRole('teacher', 'admin'), getBatchProgressOverview);

router.route('/batch/:batchId/student/:studentId')
  .get(getStudentProgressInBatch);

// Progress update route
router.route('/update')
  .post(updateProgress);

// Progress stats route
router.route('/stats')
  .get(getProgressStats);

// Learning streak routes
router.route('/streak')
  .get(getStreakStats);

router.route('/streak/leaderboard')
  .get(getStreakLeaderboard);

module.exports = router;
