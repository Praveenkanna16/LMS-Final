const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllContent,
  uploadContent,
  updateContent,
  approveContent,
  rejectContent,
  deleteContent,
  getContentById,
  trackView,
  trackDownload,
  getAnalytics
} = require('../controllers/contentLibraryController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Validation rules
const updateContentValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('quality').optional().isIn(['360p', '480p', '720p', '1080p']).withMessage('Invalid quality setting')
];

const rejectContentValidation = [
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Rejection reason must be between 10 and 500 characters')
];

// Protected routes - All users
router.use(authMiddleware);

// Teacher & Admin routes - PUT THESE FIRST BEFORE DYNAMIC ROUTES
router.post('/upload', requireRole(['teacher', 'admin']), uploadContent);
router.get('/analytics/stats', requireRole(['admin']), getAnalytics);

// Get all content (with filters)
router.get('/', getAllContent);

// Get content by ID
router.get('/:id', getContentById);

// Track view
router.post('/:id/view', trackView);

// Track download
router.post('/:id/download', trackDownload);

// Update and delete
router.put('/:id', requireRole(['teacher', 'admin']), updateContentValidation, updateContent);
router.delete('/:id', requireRole(['teacher', 'admin']), deleteContent);

// Admin only routes
router.post('/:id/approve', requireRole(['admin']), approveContent);
router.post('/:id/reject', requireRole(['admin']), rejectContentValidation, rejectContent);

module.exports = router;
