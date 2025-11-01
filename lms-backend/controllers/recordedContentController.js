const { 
  RecordedContent, 
  User, 
  Course, 
  Batch, 
  LiveSession,
  BatchEnrollment,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

// Get all recorded content with filters
const getRecordedContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      courseId,
      batchId,
      uploadedBy,
      status,
      type,
      isPublic
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (courseId) whereClause.courseId = courseId;
    if (batchId) whereClause.batchId = batchId;
    if (uploadedBy) whereClause.uploadedBy = uploadedBy;
    if (status) whereClause.processingStatus = status;
    if (type) whereClause.contentType = type;
    if (isPublic !== undefined) whereClause.isPublic = isPublic === 'true';

    const { count, rows: content } = await RecordedContent.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title'],
          required: false
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: LiveSession,
          as: 'liveSession',
          attributes: ['id', 'title', 'scheduledAt'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: Array.isArray(content) ? content : [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recorded content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recorded content'
    });
  }
};

// Get single recorded content details
const getRecordedContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await RecordedContent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'price'],
          required: false
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'name', 'startDate', 'endDate'],
          required: false
        },
        {
          model: LiveSession,
          as: 'liveSession',
          attributes: ['id', 'title', 'scheduledAt', 'duration'],
          required: false
        }
      ]
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Recorded content not found'
      });
    }

    // Check access permissions
    const canAccess = await checkContentAccess(content, req.user);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this content'
      });
    }

    // Increment view count if user is not the uploader
    if (req.user.id !== content.uploadedBy) {
      await content.increment('viewCount');
      
      // Log the view (you might want to create a separate views table)
      // This is a simplified approach
      const viewLog = {
        userId: req.user.id,
        contentId: content.id,
        viewedAt: new Date(),
        ipAddress: req.ip
      };
      
      // Store view log in metadata for now
      const currentMetadata = content.metadata ? JSON.parse(content.metadata) : {};
      if (!currentMetadata.viewLogs) currentMetadata.viewLogs = [];
      currentMetadata.viewLogs.push(viewLog);
      
      await content.update({
        metadata: JSON.stringify(currentMetadata)
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching recorded content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recorded content'
    });
  }
};

// Helper function to check content access
const checkContentAccess = async (content, user) => {
  // Public content is accessible to all authenticated users
  if (content.isPublic) return true;
  
  // Content uploader always has access
  if (content.uploadedBy === user.id) return true;
  
  // Admin has access to all content
  if (user.role === 'admin') return true;
  
  // For private content, check enrollment
  if (content.courseId) {
    const enrollment = await BatchEnrollment.findOne({
      include: [{
        model: Batch,
        as: 'batch',
        where: { courseId: content.courseId }
      }],
      where: { userId: user.id }
    });
    return !!enrollment;
  }
  
  if (content.batchId) {
    const enrollment = await BatchEnrollment.findOne({
      where: { 
        userId: user.id, 
        batchId: content.batchId 
      }
    });
    return !!enrollment;
  }
  
  return false;
};

// Upload recorded content
const uploadRecordedContent = async (req, res) => {
  try {
    const {
      title,
      description,
      contentType,
      courseId,
      batchId,
      liveSessionId,
      duration,
      isPublic = false,
      quality,
      tags
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only video files are allowed.'
      });
    }

    // Check file size (limit: 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 500MB.'
      });
    }

    const content = await RecordedContent.create({
      title,
      description,
      contentType: contentType || 'recorded_session',
      filePath: req.file.path,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      duration: duration || null,
      courseId: courseId || null,
      batchId: batchId || null,
      liveSessionId: liveSessionId || null,
      isPublic,
      processingStatus: 'processing',
      quality: quality || 'HD',
      uploadedBy: req.user.id,
      metadata: JSON.stringify({
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        uploadInfo: {
          uploadedAt: new Date(),
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      })
    });

    // Simulate video processing (in real app, this would be done by a background job)
    setTimeout(async () => {
      try {
        await content.update({
          processingStatus: 'completed',
          processedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating processing status:', error);
        await content.update({
          processingStatus: 'failed',
          processedAt: new Date()
        });
      }
    }, 5000); // Simulate 5 second processing time

    const contentWithRelations = await RecordedContent.findByPk(content.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title'],
          required: false
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: contentWithRelations,
      message: 'Content uploaded successfully and is being processed'
    });
  } catch (error) {
    console.error('Error uploading recorded content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload recorded content'
    });
  }
};

// Update recorded content
const updateRecordedContent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      courseId,
      batchId,
      liveSessionId,
      isPublic,
      quality,
      tags
    } = req.body;

    const content = await RecordedContent.findByPk(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Recorded content not found'
      });
    }

    // Check if user has permission to update
    if (content.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update metadata if tags are provided
    let updatedMetadata = content.metadata ? JSON.parse(content.metadata) : {};
    if (tags) {
      updatedMetadata.tags = tags.split(',').map(tag => tag.trim());
    }

    await content.update({
      title: title || content.title,
      description: description || content.description,
      courseId: courseId !== undefined ? courseId : content.courseId,
      batchId: batchId !== undefined ? batchId : content.batchId,
      liveSessionId: liveSessionId !== undefined ? liveSessionId : content.liveSessionId,
      isPublic: isPublic !== undefined ? isPublic : content.isPublic,
      quality: quality || content.quality,
      metadata: JSON.stringify(updatedMetadata)
    });

    const updatedContent = await RecordedContent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title'],
          required: false
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: updatedContent,
      message: 'Recorded content updated successfully'
    });
  } catch (error) {
    console.error('Error updating recorded content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recorded content'
    });
  }
};

// Delete recorded content
const deleteRecordedContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await RecordedContent.findByPk(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Recorded content not found'
      });
    }

    // Check if user has permission to delete
    if (content.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete the physical file
    try {
      if (content.filePath) {
        await fs.unlink(content.filePath);
      }
    } catch (fileError) {
      console.warn('Warning: Could not delete physical file:', fileError.message);
    }

    await content.destroy();

    res.json({
      success: true,
      message: 'Recorded content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recorded content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recorded content'
    });
  }
};

// Get content analytics
const getContentAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Get total content stats
    const totalContent = await RecordedContent.count();
    const newContent = await RecordedContent.count({ where: whereClause });
    const processingContent = await RecordedContent.count({ 
      where: { processingStatus: 'processing' } 
    });
    
    // Get content by type
    const contentByType = await RecordedContent.findAll({
      attributes: [
        'contentType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['contentType'],
      raw: true
    });

    // Get top viewed content
    const topContent = await RecordedContent.findAll({
      attributes: ['id', 'title', 'viewCount', 'downloadCount'],
      order: [['viewCount', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['name']
      }]
    });

    // Get storage usage
    const storageUsage = await RecordedContent.sum('fileSize') || 0;

    res.json({
      success: true,
      data: {
        period,
        totalContent,
        newContent,
        processingContent,
        contentByType,
        topContent,
        storageUsage: {
          bytes: storageUsage,
          readable: formatBytes(storageUsage)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching content analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content analytics'
    });
  }
};

// Helper function to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Download recorded content
const downloadRecordedContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await RecordedContent.findByPk(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Recorded content not found'
      });
    }

    // Check access permissions
    const canAccess = await checkContentAccess(content, req.user);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to download this content'
      });
    }

    // Check if file exists
    try {
      await fs.access(content.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    await content.increment('downloadCount');

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${content.originalName}"`);
    res.setHeader('Content-Type', content.mimeType);
    
    // Stream the file
    const fileStream = require('fs').createReadStream(content.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading recorded content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download recorded content'
    });
  }
};

module.exports = {
  getRecordedContent,
  getRecordedContentById,
  uploadRecordedContent,
  updateRecordedContent,
  deleteRecordedContent,
  getContentAnalytics,
  downloadRecordedContent
};
