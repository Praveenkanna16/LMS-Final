const express = require('express');
const router = express.Router();
const { authMiddleware: protect, requireRole: authorize } = require('../middleware/authMiddleware');
const {
    generatePaymentLink,
    processPayment,
    getEarningsDashboard,
    requestPayout,
    approvePayout,
    exportEarningsReport
} = require('../controllers/enhancedPaymentController');

// Protected routes (require authentication)
router.use(protect);

// Payment routes
router.post('/generate-link', generatePaymentLink);
router.post('/success', processPayment);

// Teacher routes
router.get('/earnings', authorize('teacher'), getEarningsDashboard);
router.post('/request-payout', authorize('teacher'), requestPayout);
router.get('/export-earnings', authorize('teacher'), exportEarningsReport);

// Admin routes
router.post('/approve-payout/:id', authorize('admin'), approvePayout);

module.exports = router;