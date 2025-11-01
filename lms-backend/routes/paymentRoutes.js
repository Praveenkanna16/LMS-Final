const express = require('express');
const { body } = require('express-validator');

const paymentController = require('../controllers/paymentController');
const payoutController = require('../controllers/payoutController');
const {
  getAllPayments,
  createOrder,
  verifyPayment,
  getMyPayments,
  getTeacherPayments,
  getTeacherEarnings,
  getPaymentStats,
  processRefund,
  getPayment,
  updatePaymentStatus,
  retryPayment,
  getEMIPlans,
  enrollEMI
} = paymentController;

const {
  requestPayout,
  handleCashfreeWebhook
} = payoutController;

const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('batchId')
    .isInt({ min: 1 })
    .withMessage('Invalid batch ID'),

  body('source')
    .optional()
    .isIn(['platform', 'teacher'])
    .withMessage('Source must be platform or teacher')
];

const payoutValidation = [
  body('amount')
    .isFloat({ min: 1000 })
    .withMessage('Minimum payout amount is ₹1000')
];

const refundValidation = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Refund amount must be positive'),

  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Refund reason must be between 10 and 500 characters')
];

// Payment verification (webhook) - no auth required for webhooks
router.post('/verify', verifyPayment);
router.post('/webhook/cashfree', handleCashfreeWebhook);

// All payment routes require authentication
router.use(authMiddleware);

// Admin: list all payments
router.get('/', requireRole('admin'), getAllPayments);

// Admin payment routes
router.get('/stats', requireRole('admin'), getPaymentStats);
router.get('/:id', getPayment);
router.put('/:id/status', requireRole('admin'), updatePaymentStatus);
router.post('/:id/refund', requireRole('admin'), refundValidation, processRefund);
router.post('/:id/retry', requireRole('admin'), retryPayment);

module.exports = router;
