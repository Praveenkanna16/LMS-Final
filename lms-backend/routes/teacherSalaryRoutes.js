const express = require('express');
const router = express.Router();
const teacherSalaryController = require('../controllers/teacherSalaryController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Webhook endpoints (no auth required - Cashfree callbacks)
router.post('/payment-webhook', teacherSalaryController.handlePaymentWebhook);
router.post('/payout-webhook', teacherSalaryController.handlePayoutWebhook);

// All other routes are protected and require admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// Get all teachers with salary info
router.get('/', teacherSalaryController.getAllTeachersWithSalaryInfo);

// Get salary statistics
router.get('/stats', teacherSalaryController.getSalaryStats);

// Get teacher payment history
router.get('/:teacherId/history', teacherSalaryController.getTeacherPaymentHistory);

// Initiate salary payment
router.post('/initiate', teacherSalaryController.initiateSalaryPayment);

// Mark payment as completed
router.put('/:paymentId/complete', teacherSalaryController.markPaymentCompleted);

// Cancel payment
router.put('/:paymentId/cancel', teacherSalaryController.cancelPayment);

// Update teacher bank account
router.post('/:teacherId/bank-account', teacherSalaryController.updateTeacherBankAccount);

module.exports = router;
