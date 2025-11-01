const express = require('express');
const router = express.Router();
const teacherPortalController = require('../controllers/teacherPortalController');

// Note: auth middleware is applied in server.js before mounting these routes

// ============================================================================
// SCHEDULE Routes
// ============================================================================
router.get('/schedules', teacherPortalController.getTeacherSchedules);
router.get('/stats', teacherPortalController.getTeacherStats);
router.get('/batches', teacherPortalController.getTeacherBatches);

// ============================================================================
// RECORDED CONTENT Routes
// ============================================================================
router.get('/recorded-content', teacherPortalController.getRecordedContent);
router.get('/content-stats', teacherPortalController.getContentStats);

// ============================================================================
// EARNINGS Routes
// ============================================================================
router.get('/earnings', teacherPortalController.getEarnings);
router.get('/withdrawals', teacherPortalController.getWithdrawals);
router.post('/request-withdrawal', teacherPortalController.requestWithdrawal);

// ============================================================================
// PAYOUTS Routes
// ============================================================================
router.get('/payouts', teacherPortalController.getPayouts);
router.get('/bank-accounts', teacherPortalController.getBankAccounts);
router.post('/bank-accounts', teacherPortalController.addBankAccount);
router.delete('/bank-accounts/:id', teacherPortalController.deleteBankAccount);
router.patch('/bank-accounts/:id/set-default', teacherPortalController.setDefaultBankAccount);

// ============================================================================
// REPORTS Routes
// ============================================================================
router.get('/reports', teacherPortalController.getReports);
router.get('/analytics', teacherPortalController.getTeacherAnalytics);

// ============================================================================
// PROFILE Routes
// ============================================================================
router.get('/profile', teacherPortalController.getProfile);
router.put('/profile', teacherPortalController.updateProfile);
router.post('/profile/change-password', teacherPortalController.changePassword);

module.exports = router;
