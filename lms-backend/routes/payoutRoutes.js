const express = require('express');
const { body } = require('express-validator');
const {
  getAllPayouts,
  getMyPayouts,
  requestPayout,
  approvePayout,
  completePayout,
  rejectPayout,
  getPayoutById,
  getEarningsSummary,
  processPayoutViaCashfree,
  checkPayoutStatus,
  validateBankAccount,
  getCashfreeBalance
} = require('../controllers/payoutController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const requestPayoutValidation = [
  body('amount')
    .isFloat({ min: 1000 })
    .withMessage('Minimum payout amount is ₹1000'),
  
  body('paymentMethod')
    .trim()
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['bank_transfer', 'upi', 'paytm', 'phonepe'])
    .withMessage('Invalid payment method'),
  
  body('paymentDetails')
    .isObject()
    .withMessage('Payment details must be an object'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
];

const completePayoutValidation = [
  body('transactionId')
    .trim()
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Transaction ID must be 5-255 characters'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
];

const rejectPayoutValidation = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be 10-500 characters')
];

// All payout routes require authentication
router.use(authMiddleware);

// Admin routes
router.get('/', requireRole('admin'), getAllPayouts);
router.post('/:id/approve', requireRole('admin'), approvePayout);
router.post('/:id/complete', requireRole('admin'), completePayoutValidation, completePayout);
router.post('/:id/reject', requireRole('admin'), rejectPayoutValidation, rejectPayout);
router.post('/:id/process-cashfree', requireRole('admin'), processPayoutViaCashfree);
router.get('/:id/status', requireRole('admin'), checkPayoutStatus);
router.get('/cashfree/balance', requireRole('admin'), getCashfreeBalance);

// Teacher routes
router.get('/my-payouts', requireRole('teacher'), getMyPayouts);
router.get('/earnings/summary', requireRole('teacher'), getEarningsSummary);
router.post('/request', requireRole('teacher'), requestPayoutValidation, requestPayout);
router.post('/validate-bank', requireRole('teacher'), validateBankAccount);

// Shared routes (teacher can view their own, admin can view all)
router.get('/:id', getPayoutById);

module.exports = router;
