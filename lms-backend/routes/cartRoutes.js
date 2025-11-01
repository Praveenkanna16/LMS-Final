const express = require('express');
const { param, body } = require('express-validator');
const {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  applyPromoCode,
  clearCart,
  getCartSummary,
  checkAvailability,
  getRecommendations,
  mergeCart
} = require('../controllers/cartController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const addToCartValidation = [
  body('courseId')
    .optional()
    .isUUID()
    .withMessage('Invalid course ID'),

  body('batchId')
    .optional()
    .isUUID()
    .withMessage('Invalid batch ID'),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10')
];

const promoCodeValidation = [
  body('promoCode')
    .isLength({ min: 3, max: 20 })
    .withMessage('Promo code must be between 3 and 20 characters')
];

const mergeCartValidation = [
  body('guestCartItems')
    .isArray({ min: 1 })
    .withMessage('Guest cart items must be a non-empty array'),

  body('guestCartItems.*.courseId')
    .optional()
    .isUUID()
    .withMessage('Invalid course ID'),

  body('guestCartItems.*.batchId')
    .optional()
    .isUUID()
    .withMessage('Invalid batch ID'),

  body('guestCartItems.*.quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10')
];

// All cart routes require authentication
router.use(auth.authMiddleware);

// Cart management
router.get('/', getCart);
router.get('/summary', getCartSummary);
router.get('/check-availability', checkAvailability);
router.get('/recommendations', getRecommendations);

// Cart modifications
router.post('/add', addToCartValidation, addToCart);
router.delete('/remove/:itemId', param('itemId').isUUID(), removeFromCart);
router.put('/update-quantity/:itemId', param('itemId').isUUID(), addToCartValidation, updateQuantity);
router.post('/apply-promo', promoCodeValidation, applyPromoCode);
router.delete('/clear', clearCart);

// Guest cart operations
router.post('/merge', mergeCartValidation, mergeCart);

module.exports = router;
