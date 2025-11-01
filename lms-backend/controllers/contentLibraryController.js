const { RecordedContent, User, Course, Batch, LiveSession, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/appError');
const logger = require('../config/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fcmService = require('../services/fcmService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/content');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow videos and PDFs
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, OGG videos and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

// @desc    Get all content with stats and filters
// @route   GET /api/content-library
// @access  Private/Admin
const getAllContent = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const { search, status, courseId, teacherId, contentType } = req.query;

  const where = {};

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  if (status && status !== 'all') {
    where.status = status;
  }

  if (courseId && courseId !== 'all') {
    where.courseId = courseId;
  }

  if (teacherId && teacherId !== 'all') {
    where.teacherId = teacherId;
  }

  // Student access filtering
  if (req.user && req.user.role === 'student') {
    // Get student's batch and course IDs
    const studentId = req.user.id;
    const enrolledBatches = await sequelize.models.BatchEnrollment.findAll({
      where: { studentId, status: 'active' },
      attributes: ['batchId']
    });
    const batchIds = enrolledBatches.map(b => b.batchId);

    const purchasedCourses = await sequelize.models.Payment.findAll({
      where: { studentId, status: 'completed' },
      attributes: ['courseId']
    });
    const courseIds = purchasedCourses.map(c => c.courseId);

    where[Op.or] = [
      { isPublic: true },
      { batchId: { [Op.in]: batchIds } },
      { courseId: { [Op.in]: courseIds } }
    ];
  }

  const { rows: content, count } = await RecordedContent.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'category']
      },
      {
        model: Batch,
        as: 'batch',
        attributes: ['id', 'name']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  // Calculate stats
  const stats = {
    total: await RecordedContent.count(),
    available: await RecordedContent.count({ where: { status: 'ready' } }),
    processing: await RecordedContent.count({ where: { status: 'processing' } }),
    failed: await RecordedContent.count({ where: { status: 'failed' } }),
    totalViews: (await RecordedContent.sum('views')) || 0,
    totalDownloads: (await RecordedContent.sum('downloads')) || 0,
    publicContent: await RecordedContent.count({ where: { isPublic: true } }),
    totalStorage: 0
  };

  // Calculate total storage (in bytes)
  const storageResult = await RecordedContent.sum('fileSize');
  stats.totalStorage = storageResult || 0;

  // Calculate average file size
  const avgResult = await RecordedContent.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('fileSize')), 'avgSize']],
    raw: true
  });
  stats.avgFileSize = avgResult?.avgSize || 0;

  // Format content for frontend
  const formattedContent = content.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    courseId: c.courseId,
    course: c.course ? {
      id: c.course.id,
      title: c.course.title,
      category: c.course.category || 'Uncategorized'
    } : null,
    batchId: c.batchId,
    batch: c.batch ? {
      id: c.batch.id,
      name: c.batch.name
    } : null,
    teacherId: c.teacherId,
    teacher: c.teacher ? {
      id: c.teacher.id,
      name: c.teacher.name,
      email: c.teacher.email
    } : null,
    videoUrl: c.videoUrl,
    thumbnailUrl: c.thumbnailUrl,
    duration: c.duration,
    fileSize: c.fileSize,
    format: c.format,
    quality: c.quality,
    status: c.status,
    views: c.views,
    downloads: c.downloads,
    isPublic: c.isPublic,
    tags: c.tags,
    metadata: c.metadata,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }));

  res.json({
    success: true,
    data: {
      content: formattedContent,
      stats,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Upload new content
// @route   POST /api/content-library/upload
// @access  Private/Teacher/Admin
const uploadContent = (req, res, next) => {
  const uploadMiddleware = upload.single('file');

  uploadMiddleware(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const {
        title,
        description,
        courseId,
        batchId,
        isPublic,
        tags,
        notes,
        quality
      } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }

      if (!batchId) {
        return res.status(400).json({ success: false, message: 'Batch ID is required' });
      }

      // Determine content type
      const contentType = req.file.mimetype.startsWith('video/') ? 'video' : 'pdf';

      // Create content record
      const content = await RecordedContent.create({
        title,
        description,
        notes,
        courseId: courseId || null,
        batchId: batchId || null,
        teacherId: req.user.id,
        videoUrl: `/uploads/content/${req.file.filename}`,
        fileSize: req.file.size,
        format: contentType === 'video' ? path.extname(req.file.filename).slice(1) : 'pdf',
        quality: quality || '720p',
        status: 'processing', // Will be updated after processing
        isPublic: isPublic === 'true' || isPublic === true,
        tags: tags ? JSON.parse(tags) : null,
        metadata: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          uploadedAt: new Date()
        }
      });

      logger.info(`Video uploaded: ${content.id} by teacher ${req.user.id} to batch ${batchId}`);

      // Simulate processing (in production, this would be a background job)
      setTimeout(async () => {
        try {
          await RecordedContent.update(
            { status: 'ready' },
            { where: { id: content.id } }
          );
          logger.info(`Video processing complete: ${content.id}`);
        } catch (error) {
          logger.error(`Failed to update content status: ${error.message}`);
        }
      }, 2000); // Simulate 2 second processing

      res.status(201).json({
        success: true,
        message: 'Content uploaded successfully',
        data: { content }
      });
    } catch (error) {
      logger.error(`Upload error: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

// @desc    Update content details
// @route   PUT /api/content-library/:id
// @access  Private/Teacher/Admin
const updateContent = asyncHandler(async (req, res) => {
  const content = await RecordedContent.findByPk(req.params.id);

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  // Check authorization (only teacher who uploaded or admin can edit)
  if (req.user.role !== 'admin' && content.teacherId !== req.user.id) {
    throw new AppError('Not authorized to update this content', 403);
  }

  const {
    title,
    description,
    courseId,
    batchId,
    isPublic,
    tags,
    quality,
    status
  } = req.body;

  const updates = {};
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (courseId !== undefined) updates.courseId = courseId || null;
  if (batchId !== undefined) updates.batchId = batchId || null;
  if (isPublic !== undefined) updates.isPublic = isPublic;
  if (tags) {
    // Accept tags as array or CSV/string
    try {
      updates.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    } catch (e) {
      updates.tags = String(tags).split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  // Persist thumbnailUrl if provided
  if (req.body.thumbnailUrl !== undefined) updates.thumbnailUrl = req.body.thumbnailUrl;
  // Persist notes into metadata (merge)
  if (req.body.notes !== undefined) {
    const meta = content.metadata || {};
    meta.notes = req.body.notes;
    updates.metadata = meta;
  }
  if (quality) updates.quality = quality;
  if (status && req.user.role === 'admin') updates.status = status;

  await content.update(updates);

  // Fetch updated content with associations
  const updatedContent = await RecordedContent.findByPk(req.params.id, {
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
      { model: Course, as: 'course', attributes: ['id', 'title', 'category'] },
      { model: Batch, as: 'batch', attributes: ['id', 'name'] }
    ]
  });

  res.json({
    success: true,
    message: 'Content updated successfully',
    data: { content: updatedContent }
  });
});

// @desc    Approve content
// @route   POST /api/content-library/:id/approve
// @access  Private/Admin
const approveContent = asyncHandler(async (req, res) => {
  const content = await RecordedContent.findByPk(req.params.id, {
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }
    ]
  });

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  if (content.status === 'ready') {
    throw new AppError('Content is already approved', 400);
  }

  await content.update({ status: 'ready' });

  // Send notification to teacher
  await Notification.create({
    title: 'Content Approved',
    message: `Your content "${content.title}" has been approved and is now available.`,
    recipient: content.teacherId,
    type: 'content_approval',
    category: 'content',
    priority: 'medium',
    relatedContent: content.id,
    channels: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  });

  // Send FCM notification
  try {
    await fcmService.sendToUser(content.teacherId, {
      title: 'Content Approved',
      body: `Your content "${content.title}" has been approved and is now available.`,
      data: {
        type: 'content_approval',
        contentId: content.id.toString()
      }
    });
  } catch (error) {
    logger.error('FCM notification failed for content approval:', error);
  }

  res.json({
    success: true,
    message: 'Content approved successfully',
    data: { content }
  });
});

// @desc    Reject content
// @route   POST /api/content-library/:id/reject
// @access  Private/Admin
const rejectContent = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    throw new AppError('Rejection reason must be at least 10 characters', 400);
  }

  const content = await RecordedContent.findByPk(req.params.id, {
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }
    ]
  });

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  await content.update({
    status: 'failed',
    metadata: {
      ...content.metadata,
      rejectionReason: reason,
      rejectedAt: new Date(),
      rejectedBy: req.user.id
    }
  });

  // Send notification to teacher
  await Notification.create({
    title: 'Content Rejected',
    message: `Your content "${content.title}" has been rejected. Reason: ${reason}`,
    recipient: content.teacherId,
    type: 'content_rejection',
    category: 'content',
    priority: 'high',
    relatedContent: content.id,
    channels: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  });

  // Send FCM notification
  try {
    await fcmService.sendToUser(content.teacherId, {
      title: 'Content Rejected',
      body: `Your content "${content.title}" has been rejected. Reason: ${reason}`,
      data: {
        type: 'content_rejection',
        contentId: content.id.toString()
      }
    });
  } catch (error) {
    logger.error('FCM notification failed for content rejection:', error);
  }

  res.json({
    success: true,
    message: 'Content rejected',
    data: { content }
  });
});

// @desc    Delete content
// @route   DELETE /api/content-library/:id
// @access  Private/Admin or content owner
const deleteContent = asyncHandler(async (req, res) => {
  const content = await RecordedContent.findByPk(req.params.id);

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  // Check authorization
  if (req.user.role !== 'admin' && content.teacherId !== req.user.id) {
    throw new AppError('Not authorized to delete this content', 403);
  }

  // Delete file from storage (if local storage)
  if (content.videoUrl && content.videoUrl.startsWith('/uploads/')) {
    try {
      const filePath = path.join(__dirname, '..', content.videoUrl);
      await fs.unlink(filePath);
    } catch (error) {
      logger.error(`Failed to delete file: ${error.message}`);
    }
  }

  await content.destroy();

  res.json({
    success: true,
    message: 'Content deleted successfully'
  });
});

// @desc    Get content by ID
// @route   GET /api/content-library/:id
// @access  Private
const getContentById = asyncHandler(async (req, res) => {
  const content = await RecordedContent.findByPk(req.params.id, {
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
      { model: Course, as: 'course', attributes: ['id', 'title', 'category'] },
      { model: Batch, as: 'batch', attributes: ['id', 'name'] },
      { model: LiveSession, as: 'liveSession', attributes: ['id', 'title', 'scheduledAt'] }
    ]
  });

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  res.json({
    success: true,
    data: { content }
  });
});

// @desc    Track content view
// @route   POST /api/content-library/:id/view
// @access  Private
const trackView = asyncHandler(async (req, res) => {
  const content = await RecordedContent.findByPk(req.params.id);

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  await content.increment('views');

  res.json({
    success: true,
    message: 'View tracked successfully'
  });
});

// @desc    Track content download
// @route   POST /api/content-library/:id/download
// @access  Private
const trackDownload = asyncHandler(async (req, res) => {
  const content = await RecordedContent.findByPk(req.params.id);

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  await content.increment('downloads');

  res.json({
    success: true,
    message: 'Download tracked successfully',
    data: { downloadUrl: content.videoUrl }
  });
});

// @desc    Get content analytics
// @route   GET /api/content-library/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Get content uploaded in period
  const recentContent = await RecordedContent.findAll({
    where: {
      createdAt: { [Op.gte]: daysAgo }
    },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
    order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
  });

  // Top viewed content
  const topViewed = await RecordedContent.findAll({
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name'] },
      { model: Course, as: 'course', attributes: ['id', 'title'] }
    ],
    order: [['views', 'DESC']],
    limit: 10
  });

  // Top downloaded content
  const topDownloaded = await RecordedContent.findAll({
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name'] },
      { model: Course, as: 'course', attributes: ['id', 'title'] }
    ],
    order: [['downloads', 'DESC']],
    limit: 10
  });

  // Content by category
  const byCategory = await RecordedContent.findAll({
    include: [
      { model: Course, as: 'course', attributes: ['category'] }
    ],
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('RecordedContent.id')), 'count']
    ],
    group: ['course.category'],
    raw: true
  });

  // Most active teachers
  const activeTeachers = await RecordedContent.findAll({
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }
    ],
    attributes: [
      'teacherId',
      [sequelize.fn('COUNT', sequelize.col('RecordedContent.id')), 'contentCount'],
      [sequelize.fn('SUM', sequelize.col('views')), 'totalViews']
    ],
    group: ['teacherId', 'teacher.id', 'teacher.name', 'teacher.email'],
    order: [[sequelize.fn('COUNT', sequelize.col('RecordedContent.id')), 'DESC']],
    limit: 10
  });

  res.json({
    success: true,
    data: {
      uploadTrend: recentContent,
      topViewed,
      topDownloaded,
      byCategory,
      activeTeachers
    }
  });
});

module.exports = {
  getAllContent,
  uploadContent,
  updateContent,
  approveContent,
  rejectContent,
  deleteContent,
  getContentById,
  trackView,
  trackDownload,
  getAnalytics,
  upload
};
