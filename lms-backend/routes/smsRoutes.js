const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Only teachers and admins can send SMS
router.post('/send', authMiddleware, requireRole(['admin', 'teacher']), smsController.sendSMS);
router.post('/send-bulk', authMiddleware, requireRole(['admin', 'teacher']), smsController.sendBulkSMS);
router.post('/send-templated', authMiddleware, requireRole(['admin', 'teacher']), smsController.sendTemplatedSMS);

module.exports = router;
