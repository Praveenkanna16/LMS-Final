const express = require('express');
const router = express.Router();
const {
  createInstallmentPlan,
  getInstallmentPlan,
  payInstallment,
  handleInstallmentWebhook,
  retryFailedPayment,
  requestRefund,
  approveRefund,
  rejectRefund,
  getAllRefundRequests
} = require('../controllers/paymentEnhancedController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ==================== INSTALLMENT PLANS ====================

// Create installment plan (Student)
router.post('/installment/create', authMiddleware, createInstallmentPlan);

// Get installment plan details (Student)
router.get('/installment/:id', authMiddleware, getInstallmentPlan);

// Pay specific installment (Student)
router.post('/installment/pay', authMiddleware, payInstallment);

// Webhook for installment payments
router.post('/webhook/installment', handleInstallmentWebhook);

// ==================== PAYMENT RETRY ====================

// Retry failed payment (Student)
router.post('/retry/:paymentId', authMiddleware, retryFailedPayment);

// ==================== REFUND MANAGEMENT ====================

// Request refund (Student)
router.post('/refund/request', authMiddleware, requestRefund);

// Approve refund (Admin)
router.post('/refund/:paymentId/approve', authMiddleware, approveRefund);

// Reject refund (Admin)
router.post('/refund/:paymentId/reject', authMiddleware, rejectRefund);

// Get all refund requests (Admin)
router.get('/refund/requests', authMiddleware, getAllRefundRequests);

module.exports = router;
