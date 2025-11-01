const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

router.post('/messages', requireAuth, chatController.saveMessage);
router.get('/messages/:batchId', requireAuth, chatController.getMessages);
router.delete('/messages/:messageId', requireAuth, chatController.deleteMessage);

module.exports = router;
