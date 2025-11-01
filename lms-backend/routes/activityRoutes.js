const express = require('express');
const auth = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get recent activities
// @route   GET /api/activities/recent
// @access  Private
const getRecentActivities = asyncHandler(async (req, res) => {
  // For now, return empty array since we don't have the full implementation
  // In production, this would query notifications, submissions, etc.
  res.json({
    success: true,
    data: []
  });
});

router.get('/recent', auth.authMiddleware, getRecentActivities);

module.exports = router;
