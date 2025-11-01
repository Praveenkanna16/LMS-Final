const Wishlist = require('../models/Wishlist');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    // Create new wishlist if doesn't exist
    wishlist = await Wishlist.create({
      user: req.user.id,
      items: [],
      stats: {
        totalItems: 0,
        totalValue: 0,
        potentialSavings: 0,
        courses: 0,
        batches: 0
      },
      preferences: {
        sortBy: 'date_added',
        viewMode: 'grid',
        itemsPerPage: 12
      }
    });
  }

  res.json({
    success: true,
    data: { wishlist }
  });
});

// @desc    Add item to wishlist
// @route   POST /api/wishlist/add
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { courseId, batchId, priority = 'medium', tags = [], notes } = req.body;

  if (!courseId && !batchId) {
    throw new AppError('Course ID or Batch ID is required', 400);
  }

  // Get user's wishlist
  let wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user.id,
      items: [],
      stats: {
        totalItems: 0,
        totalValue: 0,
        potentialSavings: 0,
        courses: 0,
        batches: 0
      },
      preferences: {
        sortBy: 'date_added',
        viewMode: 'grid',
        itemsPerPage: 12
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
      description: course.description,
      price: course.price || 0,
      originalPrice: course.price || 0,
      discount: 0,
      thumbnail: course.media?.thumbnail || 'https://picsum.photos/300/200?random=1',
      category: course.category,
      level: course.level,
      rating: course.rating,
      teacher: course.teacher,
      teacherName: course.teacher?.name || 'Teacher',
      teacherAvatar: course.teacher?.profile?.avatar,
      priority,
      tags,
      notes,
      priceAlerts: {
        enabled: false,
        targetPrice: course.price || 0,
        alertSent: false
      },
      notifyOnSale: true,
      notifyOnNewBatch: true,
      notifyOnDiscount: true
    };
  } else if (batchId) {
    const batch = await Batch.findById(batchId).populate('course', 'title category price');
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    itemData = {
      batch: batchId,
      type: 'batch',
      title: batch.name,
      description: `Batch for ${batch.course.title}`,
      price: batch.enrollmentFee || batch.course.price,
      originalPrice: batch.course.price,
      discount: batch.course.price > 0 ?
        Math.round(((batch.course.price - (batch.enrollmentFee || batch.course.price)) / batch.course.price) * 100) : 0,
      thumbnail: batch.course.media?.thumbnail || 'https://picsum.photos/300/200?random=1',
      category: batch.course.category,
      level: batch.course.level,
      rating: batch.course.rating,
      teacher: batch.teacher,
      teacherName: batch.teacher?.name || 'Teacher',
      teacherAvatar: batch.teacher?.profile?.avatar,
      priority,
      tags,
      notes,
      batchDetails: {
        name: batch.name,
        startDate: batch.progress?.startDate,
        endDate: batch.progress?.endDate,
        studentLimit: batch.studentLimit,
        enrolledCount: batch.students?.length || 0
      },
      priceAlerts: {
        enabled: false,
        targetPrice: batch.enrollmentFee || batch.course.price,
        alertSent: false
      },
      notifyOnSale: true,
      notifyOnNewBatch: true,
      notifyOnDiscount: true
    };
  }

  // Add item to wishlist
  wishlist = await wishlist.addItem(itemData);

  logger.info(`Item added to wishlist by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Item added to wishlist successfully',
    data: { wishlist }
  });
});

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/remove/:itemId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  await wishlist.removeItem(req.params.itemId);

  logger.info(`Item removed from wishlist by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Item removed from wishlist successfully',
    data: { wishlist }
  });
});

// @desc    Update item priority
// @route   PUT /api/wishlist/update-priority/:itemId
// @access  Private
const updatePriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;

  if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
    throw new AppError('Invalid priority level', 400);
  }

  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  await wishlist.updateItemPriority(req.params.itemId, priority);

  logger.info(`Wishlist item priority updated by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Priority updated successfully',
    data: { wishlist }
  });
});

// @desc    Add note to wishlist item
// @route   PUT /api/wishlist/add-note/:itemId
// @access  Private
const addNote = asyncHandler(async (req, res) => {
  const { note } = req.body;

  if (!note || note.length > 200) {
    throw new AppError('Note must be between 1 and 200 characters', 400);
  }

  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  await wishlist.addNote(req.params.itemId, note);

  res.json({
    success: true,
    message: 'Note added successfully',
    data: { wishlist }
  });
});

// @desc    Toggle price alert
// @route   PUT /api/wishlist/toggle-price-alert/:itemId
// @access  Private
const togglePriceAlert = asyncHandler(async (req, res) => {
  const { targetPrice } = req.body;

  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  await wishlist.togglePriceAlert(req.params.itemId, targetPrice);

  res.json({
    success: true,
    message: 'Price alert updated successfully',
    data: { wishlist }
  });
});

// @desc    Get wishlist by category
// @route   GET /api/wishlist/category/:category
// @access  Private
const getByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    return res.json({
      success: true,
      data: {
        items: [],
        category,
        count: 0
      }
    });
  }

  const items = wishlist.getItemsByCategory(category);

  res.json({
    success: true,
    data: {
      items,
      category,
      count: items.length
    }
  });
});

// @desc    Get wishlist by priority
// @route   GET /api/wishlist/priority/:priority
// @access  Private
const getByPriority = asyncHandler(async (req, res) => {
  const { priority } = req.params;
  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    return res.json({
      success: true,
      data: {
        items: [],
        priority,
        count: 0
      }
    });
  }

  const items = wishlist.getItemsByPriority(priority);

  res.json({
    success: true,
    data: {
      items,
      priority,
      count: items.length
    }
  });
});

// @desc    Get items on sale
// @route   GET /api/wishlist/on-sale
// @access  Private
const getOnSale = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    return res.json({
      success: true,
      data: {
        items: [],
        count: 0
      }
    });
  }

  const items = wishlist.getItemsOnSale();

  res.json({
    success: true,
    data: {
      items,
      count: items.length
    }
  });
});

// @desc    Generate share token
// @route   POST /api/wishlist/share
// @access  Private
const generateShareToken = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  const token = await wishlist.generateShareToken();

  res.json({
    success: true,
    message: 'Wishlist shared successfully',
    data: {
      shareToken: token,
      publicUrl: wishlist.publicUrl
    }
  });
});

// @desc    Make wishlist private
// @route   DELETE /api/wishlist/share
// @access  Private
const makePrivate = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  await wishlist.makePrivate();

  res.json({
    success: true,
    message: 'Wishlist made private successfully',
    data: { wishlist }
  });
});

// @desc    Get public wishlist
// @route   GET /api/wishlist/shared/:token
// @access  Public
const getPublicWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.getPublicWishlist(req.params.token);

  if (!wishlist) {
    throw new AppError('Wishlist not found or is private', 404);
  }

  res.json({
    success: true,
    data: {
      wishlist: {
        user: wishlist.user,
        items: wishlist.items,
        stats: wishlist.stats,
        categories: wishlist.categories
      }
    }
  });
});

// @desc    Update wishlist preferences
// @route   PUT /api/wishlist/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const { sortBy, viewMode, itemsPerPage } = req.body;

  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  const validSortOptions = ['date_added', 'price_low', 'price_high', 'rating', 'priority', 'category'];
  const validViewModes = ['grid', 'list', 'compact'];

  if (sortBy && !validSortOptions.includes(sortBy)) {
    throw new AppError('Invalid sort option', 400);
  }

  if (viewMode && !validViewModes.includes(viewMode)) {
    throw new AppError('Invalid view mode', 400);
  }

  if (itemsPerPage && (itemsPerPage < 6 || itemsPerPage > 50)) {
    throw new AppError('Items per page must be between 6 and 50', 400);
  }

  wishlist.preferences = {
    ...wishlist.preferences,
    ...(sortBy && { sortBy }),
    ...(viewMode && { viewMode }),
    ...(itemsPerPage && { itemsPerPage })
  };

  await wishlist.save();

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: { wishlist }
  });
});

// @desc    Get wishlist statistics
// @route   GET /api/wishlist/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.getWishlistByUser(req.user.id);

  if (!wishlist) {
    return res.json({
      success: true,
      data: {
        totalItems: 0,
        totalValue: 0,
        potentialSavings: 0,
        courses: 0,
        batches: 0,
        categories: []
      }
    });
  }

  res.json({
    success: true,
    data: {
      totalItems: wishlist.stats.totalItems,
      totalValue: wishlist.stats.totalValue,
      potentialSavings: wishlist.stats.potentialSavings,
      courses: wishlist.stats.courses,
      batches: wishlist.stats.batches,
      categories: wishlist.categories
    }
  });
});

module.exports = {
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
};
