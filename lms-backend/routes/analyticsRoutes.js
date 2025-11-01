const express = require('express');
const {
  getAdminAnalytics
} = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All analytics routes require authentication
router.use(authMiddleware);

// Admin analytics endpoint - simplified for now
router.get('/admin', getAdminAnalytics);

module.exports = router;
