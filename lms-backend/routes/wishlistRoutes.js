const express = require('express');
const { param, body } = require('express-validator');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updatePriority,
  addNote,
  togglePriceAlert,
  getByCategory,
  getByPriority,
  getOnSale,
  generateShareToken,
  makePrivate,
  getPublicWishlist,
  updatePreferences,
  getStats
} = require('../controllers/wishlistController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const addToWishlistValidation = [
  body('courseId')
    .optional()
    .isUUID()
    .withMessage('Invalid course ID'),

  body('batchId')
    .optional()
    .isUUID()
    .withMessage('Invalid batch ID'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .isString()
    .isLength({ max: 20 })
    .withMessage('Each tag must be less than 20 characters'),

  body('notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters')
];

const updatePreferencesValidation = [
  body('sortBy')
    .optional()
    .isIn(['date_added', 'price_low', 'price_high', 'rating', 'priority', 'category'])
    .withMessage('Invalid sort option'),

  body('viewMode')
    .optional()
    .isIn(['grid', 'list', 'compact'])
    .withMessage('Invalid view mode'),

  body('itemsPerPage')
    .optional()
    .isInt({ min: 6, max: 50 })
    .withMessage('Items per page must be between 6 and 50')
];

// Wishlist management
router.get('/', authMiddleware, getWishlist);
router.get('/stats', authMiddleware, getStats);

// Wishlist modifications
router.post('/add', authMiddleware, addToWishlistValidation, addToWishlist);
router.delete('/remove/:itemId', authMiddleware, param('itemId').isMongoId(), removeFromWishlist);
router.put('/update-priority/:itemId', authMiddleware, param('itemId').isMongoId(), addToWishlistValidation, updatePriority);
router.put('/add-note/:itemId', authMiddleware, param('itemId').isMongoId(), addToWishlistValidation, addNote);
router.put('/toggle-price-alert/:itemId', authMiddleware, param('itemId').isMongoId(), togglePriceAlert);

// Wishlist filtering
router.get('/category/:category', authMiddleware, getByCategory);
router.get('/priority/:priority', authMiddleware, getByPriority);
router.get('/on-sale', authMiddleware, getOnSale);

// Wishlist sharing
router.post('/share', authMiddleware, generateShareToken);
router.delete('/share', authMiddleware, makePrivate);
router.get('/shared/:token', optionalAuth, getPublicWishlist);

// Wishlist preferences
router.put('/preferences', authMiddleware, updatePreferencesValidation, updatePreferences);

module.exports = router;
