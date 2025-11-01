const express = require('express');
const router = express.Router();
const studentPortalController = require('../controllers/studentPortalController');
const studentAssessmentController = require('../controllers/studentAssessmentController');
const studentPaymentController = require('../controllers/studentPaymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Webhook endpoint - NO AUTH (Cashfree calls this)
router.post('/payments/webhook', studentPaymentController.handleWebhook);

// All other routes require authentication
router.use(authMiddleware);

/**
 * Dashboard Routes
 */
// Get comprehensive dashboard overview with real stats
router.get('/dashboard/overview', studentPortalController.getDashboardOverview);

/**
 * Performance Routes
 */
// Get performance analytics with charts data
router.get('/performance', studentPortalController.getPerformanceAnalytics);

/**
 * Attendance Routes
 */
// Get attendance records with filters
router.get('/attendance', studentPortalController.getAttendance);

/**
 * Notification Routes
 */
// Get notifications with type filter
router.get('/notifications', studentPortalController.getNotifications);

// Mark notification as read
router.put('/notification/:id/read', studentPortalController.markNotificationRead);

/**
 * Assessment Routes
 */
// Get all student assessments with submission status
router.get('/assessments', studentAssessmentController.getStudentAssessments);

// Get student performance summary
router.get('/assessments/performance', studentAssessmentController.getStudentPerformance);

// Get upcoming quizzes/tests
router.get('/assessments/upcoming', studentAssessmentController.getUpcomingQuizzes);

// Start an assessment
router.post('/assessments/:id/start', studentAssessmentController.startAssessment);

// Submit an assessment
router.post('/assessments/:id/submit', studentAssessmentController.submitAssessment);

// Get assessment results
router.get('/assessments/:id/results', studentAssessmentController.getAssessmentResults);

/**
 * Profile Routes
 */
// Get student profile
router.get('/profile', studentPortalController.getProfile);

// Update student profile
router.post('/update-profile', studentPortalController.updateProfile);

// Change password
router.post('/change-password', studentPortalController.changePassword);

/**
 * Payment Routes - Cashfree Integration
 */
// Create new payment (Student → Platform)
router.post('/payments/create', studentPaymentController.createPayment);

// Verify payment after Cashfree success
router.post('/payments/verify', studentPaymentController.verifyPayment);

// Get payment status by order ID
router.get('/payments/status/:orderId', studentPaymentController.getPaymentStatus);

// Get all my payments
router.get('/payments/my', studentPaymentController.getMyPayments);

// Retry failed payment
router.post('/payments/retry/:id', studentPaymentController.retryPayment);

// Legacy routes (kept for backward compatibility)
router.get('/payments', studentPortalController.getPayments);
router.post('/retry-payment/:id', studentPortalController.retryPayment);
router.get('/invoices/:id', studentPortalController.getInvoice);

/**
 * Attendance Routes
 */
// Get attendance by batch
router.get('/attendance/:batchId', studentPortalController.getAttendanceByBatch);

// Report attendance issue
router.post('/report-issue', studentPortalController.reportAttendanceIssue);

/**
 * Support/Doubts Routes
 */
// Ask a doubt
router.post('/ask-doubt', studentPortalController.askDoubt);

// Get all doubts
router.get('/doubts', studentPortalController.getDoubts);

// Reply to doubt
router.post('/reply/:doubtId', studentPortalController.replyToDoubt);

module.exports = router;
