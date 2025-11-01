const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// Helper function to parse JSON fields safely
function parseJSONField(field) {
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch (error) {
    return {};
  }
}

// Helper function to check if course settings allow access
function isCourseActive(course) {
  const settings = parseJSONField(course.settings);
  return settings.isActive !== false;
}

// Helper function to check if course is published
function isCoursePublished(course) {
  const settings = parseJSONField(course.settings);
  return settings.isPublished === true;
}

// Helper function to check if course is active using Sequelize JSON operators
function getActiveCoursesWhereClause() {
  // For PostgreSQL with JSON fields, we need to use JSON operators
  // Since the model uses TEXT fields with JSON strings, we'll parse them in the application layer
  return {}; // We'll filter in the application layer for now
}

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  let whereClause = {};

  // Apply filters
  if (req.query.category) whereClause.category = req.query.category;
  if (req.query.level) whereClause.level = req.query.level;
  if (req.query.teacher) whereClause.teacherId = req.query.teacher;

  // Search in title and description
  if (req.query.search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${req.query.search}%` } },
      { description: { [Op.iLike]: `%${req.query.search}%` } }
    ];
  }

  // Price range filters
  if (req.query.minPrice !== undefined) {
    whereClause.price = { [Op.gte]: parseFloat(req.query.minPrice) };
  }
  if (req.query.maxPrice !== undefined) {
    whereClause.price = whereClause.price || {};
    whereClause.price[Op.lte] = parseFloat(req.query.maxPrice);
  }

  // Rating filter
  if (req.query.minRating !== undefined) {
    whereClause.rating = { [Op.gte]: parseFloat(req.query.minRating) };
  }

  const courses = await Course.findAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'teacher',
      attributes: ['id', 'name', 'email']
    }],
    order: [['rating', 'DESC'], ['studentsEnrolled', 'DESC']],
    limit,
    offset
  });

  // Filter active courses in application layer since settings is JSON string
  const activeCourses = courses.filter(course => isCourseActive(course));

  const total = activeCourses.length;

  res.json({
    success: true,
    data: {
      courses: activeCourses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    include: [{
      model: User,
      as: 'teacher',
      attributes: ['id', 'name', 'email']
    }]
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check if course is active
  if (!isCourseActive(course)) {
    throw new AppError('Course not available', 404);
  }

  // Check if current user is enrolled (if authenticated)
  let isEnrolled = false;
  if (req.user) {
    const Batch = require('../models/Batch');
    const enrolledBatch = await Batch.findOne({
      where: {
        courseId: course.id,
        // Note: students field is JSON string in Batch model, need to handle this
      },
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'name']
      }]
    });

    // Check if user is enrolled by parsing students JSON
    if (enrolledBatch) {
      const batchStudents = parseJSONField(enrolledBatch.students) || [];
      isEnrolled = batchStudents.some(student => student.student === req.user.id || student.id === req.user.id);
    }
  }

  res.json({
    success: true,
    data: {
      course,
      isEnrolled
    }
  });
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Teacher
const createCourse = asyncHandler(async (req, res) => {
  const courseData = {
    ...req.body,
    teacherId: req.user.id
  };

  const course = await Course.create(courseData);

  // Update teacher's course count (if we had a progress field in User model)
  // Note: User model doesn't have progress field, so this might not be needed

  logger.info(`Course created: ${course.title} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: { course }
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Teacher (owner only)
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check ownership
  if (course.teacherId !== req.user.id) {
    throw new AppError('Not authorized to update this course', 403);
  }

  const updatedCourse = await course.update(req.body);

  logger.info(`Course updated: ${updatedCourse.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Course updated successfully',
    data: { course: updatedCourse }
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Teacher (owner only)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check ownership
  if (course.teacherId !== req.user.id) {
    throw new AppError('Not authorized to delete this course', 403);
  }

  // Soft delete - update settings to mark as inactive
  const settings = parseJSONField(course.settings);
  settings.isActive = false;

  await course.update({ settings: JSON.stringify(settings) });

  logger.info(`Course deleted: ${course.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Course deleted successfully'
  });
});

// @desc    Get featured courses
// @route   GET /api/courses/featured
// @access  Public
const getFeaturedCourses = asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    where: {
      // We'll filter by published status in application layer
    },
    include: [{
      model: User,
      as: 'teacher',
      attributes: ['id', 'name', 'email']
    }],
    order: [['rating', 'DESC'], ['studentsEnrolled', 'DESC']],
    limit: 8
  });

  // Filter published courses in application layer
  const featuredCourses = courses.filter(course => isCoursePublished(course));

  res.json({
    success: true,
    data: { courses: featuredCourses }
  });
});

// @desc    Get courses by category
// @route   GET /api/courses/category/:category
// @access  Public
const getCoursesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  const courses = await Course.findAll({
    where: {
      category,
      // We'll filter by published status in application layer
    },
    include: [{
      model: User,
      as: 'teacher',
      attributes: ['id', 'name', 'email']
    }],
    order: [['rating', 'DESC'], ['studentsEnrolled', 'DESC']],
    limit,
    offset
  });

  // Filter published courses in application layer
  const publishedCourses = courses.filter(course => isCoursePublished(course));

  const total = publishedCourses.length;

  res.json({
    success: true,
    data: {
      courses: publishedCourses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get popular courses
// @route   GET /api/courses/popular
// @access  Public
const getPopularCourses = asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    where: {
      // We'll filter by published status in application layer
      studentsEnrolled: { [Op.gte]: 10 }
    },
    include: [{
      model: User,
      as: 'teacher',
      attributes: ['id', 'name', 'email']
    }],
    order: [['studentsEnrolled', 'DESC'], ['rating', 'DESC']],
    limit: 10
  });

  // Filter published courses in application layer
  const popularCourses = courses.filter(course => isCoursePublished(course));

  res.json({
    success: true,
    data: { courses: popularCourses }
  });
});

// @desc    Search courses
// @route   GET /api/courses/search
// @access  Public
const searchCourses = asyncHandler(async (req, res) => {
  const { q: searchTerm } = req.query;
  const filters = {
    category: req.query.category,
    level: req.query.level,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    minRating: req.query.minRating
  };

  if (!searchTerm) {
    throw new AppError('Search term is required', 400);
  }

  let whereClause = {
    [Op.or]: [
      { title: { [Op.iLike]: `%${searchTerm}%` } },
      { description: { [Op.iLike]: `%${searchTerm}%` } }
    ]
  };

  // Apply filters
  if (filters.category) whereClause.category = filters.category;
  if (filters.level) whereClause.level = filters.level;
  if (filters.minPrice !== undefined) {
    whereClause.price = { [Op.gte]: parseFloat(filters.minPrice) };
  }
  if (filters.maxPrice !== undefined) {
    whereClause.price = whereClause.price || {};
    whereClause.price[Op.lte] = parseFloat(filters.maxPrice);
  }
  if (filters.minRating !== undefined) {
    whereClause.rating = { [Op.gte]: parseFloat(filters.minRating) };
  }

  const courses = await Course.findAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'teacher',
      attributes: ['id', 'name', 'email']
    }],
    order: [['rating', 'DESC'], ['studentsEnrolled', 'DESC']]
  });

  // Filter published courses in application layer
  const searchResults = courses.filter(course => isCoursePublished(course));

  res.json({
    success: true,
    data: { courses: searchResults }
  });
});

// @desc    Get course analytics
// @route   GET /api/courses/:id/analytics
// @access  Private/Teacher (owner only)
const getCourseAnalytics = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check ownership
  if (course.teacherId !== req.user.id) {
    throw new AppError('Not authorized to view this course analytics', 403);
  }

  // Get batch analytics
  const Batch = require('../models/Batch');
  const batches = await Batch.findAll({
    where: {
      courseId: course.id
    },
    include: [{
      model: User,
      as: 'teacher',
      attributes: ['id', 'name']
    }]
  });

  // Calculate analytics
  const analytics = {
    course: {
      id: course.id,
      title: course.title,
      createdAt: course.createdAt
    },
    enrollment: {
      totalBatches: batches.length,
      totalStudents: batches.reduce((sum, batch) => {
        const students = parseJSONField(batch.students) || [];
        return sum + students.length;
      }, 0),
      averageBatchSize: batches.length > 0 ?
        Math.round(batches.reduce((sum, batch) => {
          const students = parseJSONField(batch.students) || [];
          return sum + students.length;
        }, 0) / batches.length) : 0
    },
    engagement: {
      averageCompletionRate: parseJSONField(course.stats)?.completionRate || 0,
      averageRating: course.rating || 0,
      totalReviews: parseJSONField(course.stats)?.reviewCount || 0
    },
    batches: batches.map(batch => ({
      id: batch.id,
      name: batch.name,
      studentCount: (parseJSONField(batch.students) || []).length,
      averageProgress: 0, // Would need to calculate from actual student progress
      sessionsCompleted: 0, // Would need session data
      totalSessions: 0 // Would need session data
    }))
  };

  res.json({
    success: true,
    data: { analytics }
  });
});

// @desc    Publish/unpublish course
// @route   PUT /api/courses/:id/publish
// @access  Private/Teacher (owner only)
const togglePublishCourse = asyncHandler(async (req, res) => {
  const { publish } = req.body;

  const course = await Course.findByPk(req.params.id);

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check ownership
  if (course.teacherId !== req.user.id) {
    throw new AppError('Not authorized to publish this course', 403);
  }

  // Update settings JSON
  const settings = parseJSONField(course.settings);
  settings.isPublished = publish;

  await course.update({ settings: JSON.stringify(settings) });

  // Create notification for teacher
  await Notification.create({
    title: `Course ${publish ? 'Published' : 'Unpublished'}`,
    message: `Your course "${course.title}" has been ${publish ? 'published' : 'unpublished'} successfully.`,
    recipientId: course.teacherId,
    type: 'course_update',
    category: 'academic',
    priority: 'medium',
    channels: JSON.stringify({
      email: true,
      push: true,
      sms: false,
      inApp: true
    })
  });

  logger.info(`Course ${course.title} ${publish ? 'published' : 'unpublished'} by ${req.user.email}`);

  res.json({
    success: true,
    message: `Course ${publish ? 'published' : 'unpublished'} successfully`,
    data: { course }
  });
});

// @desc    Get teacher's courses
// @route   GET /api/courses/teacher/my-courses
// @access  Private/Teacher
const getMyCourses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = { teacherId: req.user.id };

  // Search in title and description
  if (req.query.search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${req.query.search}%` } },
      { description: { [Op.iLike]: `%${req.query.search}%` } }
    ];
  }

  const courses = await Course.findAll({
    where: whereClause,
    order: [['updatedAt', 'DESC']],
    limit,
    offset
  });

  const total = await Course.count({ where: whereClause });

  res.json({
    success: true,
    data: {
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getFeaturedCourses,
  getCoursesByCategory,
  getPopularCourses,
  searchCourses,
  getCourseAnalytics,
  togglePublishCourse,
  getMyCourses
};
