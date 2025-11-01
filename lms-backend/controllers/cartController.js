const Cart = require('../models/Cart');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.getCartByUser(req.user.id);

  if (!cart) {
    // Create new cart if doesn't exist
    cart = await Cart.create({
      user: req.user.id,
      items: [],
      summary: {
        subtotal: 0,
        discount: 0,
        taxes: 0,
        total: 0,
        itemCount: 0,
        savings: 0
      }
    });
  }

  res.json({
    success: true,
    data: { cart }
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { courseId, batchId, quantity = 1 } = req.body;

  if (!courseId && !batchId) {
    throw new AppError('Course ID or Batch ID is required', 400);
  }

  // Get user's cart
  let cart = await Cart.getCartByUser(req.user.id);

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: [],
      summary: {
        subtotal: 0,
        discount: 0,
        taxes: 0,
        total: 0,
        itemCount: 0,
        savings: 0
      }
    });
  }

  // Get course/batch details
  let itemData = {};

  if (courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    itemData = {
      course: courseId,
      type: 'course',
      title: course.title,
      price: course.price || 0,
      originalPrice: course.price || 0,
      discount: 0,
      thumbnail: course.media?.thumbnail || 'https://picsum.photos/300/200?random=1',
      teacher: course.teacher,
      teacherName: course.teacher?.name || 'Teacher'
    };
  } else if (batchId) {
    const batch = await Batch.findById(batchId).populate('course', 'title category price');
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    if (!batch.settings.isActive) {
      throw new AppError('Batch is not active', 400);
    }

    itemData = {
      batch: batchId,
      type: 'batch',
      title: batch.name,
      price: batch.enrollmentFee || batch.course.price,
      originalPrice: batch.course.price,
      discount: batch.course.price > 0 ?
        Math.round(((batch.course.price - (batch.enrollmentFee || batch.course.price)) / batch.course.price) * 100) : 0,
      thumbnail: batch.course.media?.thumbnail || 'https://picsum.photos/300/200?random=1',
      teacher: batch.teacher,
      teacherName: batch.teacher?.name || 'Teacher',
      batchDetails: {
        name: batch.name,
        startDate: batch.progress?.startDate,
        endDate: batch.progress?.endDate,
        studentLimit: batch.studentLimit,
        enrolledCount: batch.students?.length || 0
      }
    };
  }

  itemData.quantity = quantity;

  // Add item to cart
  cart = await cart.addItem(itemData);

  logger.info(`Item added to cart by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: { cart }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getCartByUser(req.user.id);

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await cart.removeItem(req.params.itemId);

  logger.info(`Item removed from cart by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Item removed from cart successfully',
    data: { cart }
  });
});

// @desc    Update item quantity in cart
// @route   PUT /api/cart/update-quantity/:itemId
// @access  Private
const updateQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const cart = await Cart.getCartByUser(req.user.id);

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await cart.updateQuantity(req.params.itemId, quantity);

  logger.info(`Cart item quantity updated by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Quantity updated successfully',
    data: { cart }
  });
});

// @desc    Apply promo code
// @route   POST /api/cart/apply-promo
// @access  Private
const applyPromoCode = asyncHandler(async (req, res) => {
  const { promoCode } = req.body;

  if (!promoCode) {
    throw new AppError('Promo code is required', 400);
  }

  const cart = await Cart.getCartByUser(req.user.id);

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Simple promo code validation (in production, this would be more sophisticated)
  const validCodes = {
    'WELCOME10': { type: 'percentage', value: 10, description: '10% off for new users' },
    'SAVE50': { type: 'fixed', value: 50, description: '₹50 off on any course' },
    'STUDENT20': { type: 'percentage', value: 20, description: '20% off for students' }
  };

  if (!validCodes[promoCode.toUpperCase()]) {
    throw new AppError('Invalid promo code', 400);
  }

  await cart.applyPromoCode({ code: promoCode.toUpperCase() });

  logger.info(`Promo code ${promoCode} applied by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Promo code applied successfully',
    data: { cart }
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getCartByUser(req.user.id);

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await cart.clearCart();

  logger.info(`Cart cleared by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Cart cleared successfully',
    data: { cart }
  });
});

// @desc    Get cart summary
// @route   GET /api/cart/summary
// @access  Private
const getCartSummary = asyncHandler(async (req, res) => {
  const cart = await Cart.getCartByUser(req.user.id);

  if (!cart) {
    return res.json({
      success: true,
      data: {
        summary: {
          subtotal: 0,
          discount: 0,
          taxes: 0,
          total: 0,
          itemCount: 0,
          savings: 0
        }
      }
    });
  }

  res.json({
    success: true,
    data: {
      summary: cart.summary,
      totalSavings: cart.totalSavings,
      formattedTotal: cart.formattedTotal
    }
  });
});

// @desc    Check cart availability
// @route   GET /api/cart/check-availability
// @access  Private
const checkAvailability = asyncHandler(async (req, res) => {
  const cart = await Cart.getCartByUser(req.user.id);

  if (!cart || cart.items.length === 0) {
    return res.json({
      success: true,
      data: {
        allAvailable: true,
        unavailableItems: []
      }
    });
  }

  const unavailableItems = [];

  for (const item of cart.items) {
    if (item.type === 'batch') {
      const batch = await Batch.findById(item.batch);
      if (!batch || !batch.settings.isActive) {
        unavailableItems.push({
          id: item._id,
          title: item.title,
          reason: 'Batch is no longer available'
        });
      } else if (batch.students.length >= batch.studentLimit) {
        unavailableItems.push({
          id: item._id,
          title: item.title,
          reason: 'Batch is full'
        });
      }
    } else if (item.type === 'course') {
      const course = await Course.findById(item.course);
      if (!course || !course.settings.isActive) {
        unavailableItems.push({
          id: item._id,
          title: item.title,
          reason: 'Course is no longer available'
        });
      }
    }
  }

  res.json({
    success: true,
    data: {
      allAvailable: unavailableItems.length === 0,
      unavailableItems
    }
  });
});

// @desc    Get cart recommendations
// @route   GET /api/cart/recommendations
// @access  Private
const getRecommendations = asyncHandler(async (req, res) => {
  const cart = await Cart.getCartByUser(req.user.id);

  if (!cart || cart.items.length === 0) {
    // Get general recommendations
    const courses = await Course.getFeaturedCourses(6);
    return res.json({
      success: true,
      data: {
        recommendations: courses.map(course => ({
          id: course._id,
          title: course.title,
          reason: 'Popular course in your field',
          type: 'course'
        }))
      }
    });
  }

  // Get recommendations based on cart items
  const categories = [...new Set(cart.items.map(item => item.category))];
  const recommendations = [];

  for (const category of categories.slice(0, 2)) { // Limit to 2 categories
    const courses = await Course.find({
      category,
      'settings.isActive': true,
      'settings.isPublished': true
    })
    .populate('teacher', 'name')
    .limit(3);

    recommendations.push(...courses.map(course => ({
      id: course._id,
      title: course.title,
      reason: `Related to ${category} courses in your cart`,
      type: 'course',
      price: course.price,
      rating: course.rating?.average || course.rating
    })));
  }

  res.json({
    success: true,
    data: {
      recommendations: recommendations.slice(0, 6)
    }
  });
});

// @desc    Merge guest cart with user cart
// @route   POST /api/cart/merge
// @access  Private
const mergeCart = asyncHandler(async (req, res) => {
  const { guestCartItems } = req.body;

  if (!guestCartItems || !Array.isArray(guestCartItems)) {
    throw new AppError('Guest cart items are required', 400);
  }

  let cart = await Cart.getCartByUser(req.user.id);

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: [],
      summary: {
        subtotal: 0,
        discount: 0,
        taxes: 0,
        total: 0,
        itemCount: 0,
        savings: 0
      }
    });
  }

  // Add guest items to user cart
  for (const guestItem of guestCartItems) {
    const existingItemIndex = cart.items.findIndex(item =>
      (guestItem.courseId && item.course && item.course.toString() === guestItem.courseId) ||
      (guestItem.batchId && item.batch && item.batch.toString() === guestItem.batchId)
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      cart.items[existingItemIndex].quantity += guestItem.quantity || 1;
    } else {
      // Add new item
      if (guestItem.courseId) {
        const course = await Course.findById(guestItem.courseId);
        if (course) {
          await cart.addItem({
            course: guestItem.courseId,
            type: 'course',
            title: course.title,
            price: course.price || 0,
            originalPrice: course.price || 0,
            thumbnail: course.media?.thumbnail || 'https://picsum.photos/300/200?random=1',
            teacher: course.teacher,
            teacherName: course.teacher?.name || 'Teacher'
          });
        }
      } else if (guestItem.batchId) {
        const batch = await Batch.findById(guestItem.batchId).populate('course');
        if (batch) {
          await cart.addItem({
            batch: guestItem.batchId,
            type: 'batch',
            title: batch.name,
            price: batch.enrollmentFee || batch.course.price,
            originalPrice: batch.course.price,
            thumbnail: batch.course.media?.thumbnail || 'https://picsum.photos/300/200?random=1',
            teacher: batch.teacher,
            teacherName: batch.teacher?.name || 'Teacher',
            batchDetails: {
              name: batch.name,
              startDate: batch.progress?.startDate,
              endDate: batch.progress?.endDate,
              studentLimit: batch.studentLimit,
              enrolledCount: batch.students?.length || 0
            }
          });
        }
      }
    }
  }

  logger.info(`Guest cart merged with user cart for ${req.user.email}`);

  res.json({
    success: true,
    message: 'Cart merged successfully',
    data: { cart }
  });
});

module.exports = {
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
};
