const express = require('express');
const { createCashfreeOrder, handleCashfreeWebhook, getPaymentStatus } = require('../controllers/cashfreeController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/payments/cashfree/create
// @desc    Create Cashfree payment order
// @access  Private
router.post('/create', authMiddleware, createCashfreeOrder);

// @route   POST /api/payments/cashfree/webhook
// @desc    Handle Cashfree webhook
// @access  Public (verified by signature)
router.post('/webhook', handleCashfreeWebhook);

// @route   GET /api/payments/cashfree/status/:orderId
// @desc    Get payment status
// @access  Private
router.get('/status/:orderId', authMiddleware, getPaymentStatus);

module.exports = router;
