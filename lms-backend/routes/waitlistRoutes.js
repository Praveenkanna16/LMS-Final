const express = require('router');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');
const { requireAuth } = require('../middleware/auth');

router.post('/batches/:batchId/waitlist', requireAuth, waitlistController.addToWaitlist);
router.get('/batches/:batchId/waitlist', requireAuth, waitlistController.getWaitlist);
router.delete('/batches/:batchId/waitlist/:studentId', requireAuth, waitlistController.removeFromWaitlist);
router.post('/batches/:batchId/waitlist/promote', requireAuth, waitlistController.promoteFromWaitlist);

module.exports = router;
