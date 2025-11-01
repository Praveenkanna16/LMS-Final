// Live class controller with real database integration
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const LiveSession = require('../models/LiveSession');
const Batch = require('../models/Batch');
const User = require('../models/User');
const { Op } = require('sequelize');

// @desc    Get all live classes
// @route   GET /api/live-classes
// @access  Private
const getAllLiveClasses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, teacherId, batchId } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  
  if (status) whereClause.status = status;
  if (teacherId) whereClause.teacherId = teacherId;
  if (batchId) whereClause.batchId = batchId;

  const { count, rows: liveClasses } = await LiveSession.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Batch,
        as: 'batch',
        attributes: ['id', 'name', 'courseId']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['startTime', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      liveClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Create live session for a batch
// @route   POST /api/live-classes
// @access  Private/Teacher
const createLiveSession = asyncHandler(async (req, res) => {
  const { 
    batchId, 
    title, 
    description, 
    startTime, 
    duration = 60,
    isRecorded = false,
    zoomLink // Accept custom Google Meet link from frontend
  } = req.body;

  console.log('🎯 Creating Live Session with:', {
    batchId,
    title,
    description,
    startTime,
    duration,
    teacherId: req.user.id,
    timestamp: new Date()
  });

  // Validate batch exists and user has permission
  const batch = await Batch.findByPk(batchId);
  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  // For admin users, allow any batch. For teachers, only their batches
  if (req.user.role !== 'admin' && batch.teacherId !== req.user.id) {
    throw new AppError('You can only create sessions for your own batches', 403);
  }

  // Use provided Google Meet link or generate a placeholder meeting ID
  const meetingId = zoomLink ? 
    `gmeet_${Date.now()}` : 
    `lms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const meetLink = zoomLink || `https://meet.google.com/generated-${meetingId}`;

  const liveSession = await LiveSession.create({
    batchId,
    teacherId: req.user.id,
    title,
    description,
    meetingId,
    zoomLink: meetLink, // Store Google Meet link
    startTime,
    duration,
    isRecorded,
    status: 'scheduled'
  });

  console.log('✅ Live Session Created:', {
    id: liveSession.id,
    batchId: liveSession.batchId,
    startTime: liveSession.startTime,
    status: liveSession.status,
    createdAt: new Date()
  });

  // Get the created session with associations
  const sessionWithDetails = await LiveSession.findByPk(liveSession.id, {
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Batch,
        as: 'batch',
        attributes: ['id', 'name', 'courseId']
      }
    ]
  });

  // Emit socket event for real-time updates to students in the batch
  const socketManager = require('../services/socketManager');
  socketManager.sendNotificationToBatch(batchId, {
    type: 'schedule-created',
    session: sessionWithDetails,
    message: `New class scheduled: ${title}`,
    timestamp: new Date()
  });

  res.status(201).json({
    success: true,
    data: sessionWithDetails
  });
});

// @desc    Get live class sessions for a batch
// @route   GET /api/live-classes/batch/:batchId
// @access  Private
const getBatchLiveClasses = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { status } = req.query;

  const whereClause = { batchId };
  if (status) whereClause.status = status;

  const liveClasses = await LiveSession.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['startTime', 'ASC']]
  });

  res.json({
    success: true,
    data: liveClasses
  });
});

// @desc    Join live class
// @route   GET /api/live-classes/:id/join
// @access  Private
const joinLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const liveSession = await LiveSession.findByPk(id, {
    include: [
      {
        model: Batch,
        as: 'batch'
      }
    ]
  });

  if (!liveSession) {
    throw new AppError('Live session not found', 404);
  }

  // Check if session is live or scheduled for now
  const now = new Date();
  const startTime = new Date(liveSession.startTime);
  const timeDiff = startTime.getTime() - now.getTime();

  // Allow joining 10 minutes before scheduled time
  if (timeDiff > 10 * 60 * 1000) {
    throw new AppError('Session has not started yet', 400);
  }

  // Update session status to live if starting now
  if (liveSession.status === 'scheduled' && timeDiff <= 0) {
    await liveSession.update({ status: 'live' });
  }

  res.json({
    success: true,
    data: {
      sessionId: liveSession.id,
      meetingId: liveSession.meetingId,
      joinUrl: liveSession.zoomLink,
      title: liveSession.title,
      passcode: liveSession.passcode
    }
  });
});

// @desc    End live class
// @route   PUT /api/live-classes/:id/end
// @access  Private/Teacher
const endLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { recordingUrl } = req.body;

  const liveSession = await LiveSession.findByPk(id);
  
  if (!liveSession) {
    throw new AppError('Live session not found', 404);
  }

  // Check permissions
  if (req.user.role !== 'admin' && liveSession.teacherId !== req.user.id) {
    throw new AppError('You can only end your own sessions', 403);
  }

  const updateData = {
    status: 'ended',
    endTime: new Date()
  };

  if (recordingUrl) {
    updateData.recordingUrl = recordingUrl;
  }

  await liveSession.update(updateData);

  res.json({
    success: true,
    data: liveSession
  });
});

// @desc    Update live class
// @route   PUT /api/live-classes/:id
// @access  Private/Teacher
const updateLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, startTime, duration, meetLink, isRecorded } = req.body;

  const liveSession = await LiveSession.findByPk(id);
  
  if (!liveSession) {
    throw new AppError('Live session not found', 404);
  }

  // Check permissions
  if (req.user.role !== 'admin' && liveSession.teacherId !== req.user.id) {
    throw new AppError('You can only update your own sessions', 403);
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (startTime) updateData.startTime = startTime;
  if (duration) updateData.duration = duration;
  if (meetLink) updateData.zoomLink = meetLink;
  if (isRecorded !== undefined) updateData.isRecorded = isRecorded;

  await liveSession.update(updateData);

  logger.info(`Live class updated: ${liveSession.title} by ${req.user.email}`);

  res.json({
    success: true,
    data: liveSession
  });
});

// @desc    Delete live class
// @route   DELETE /api/live-classes/:id
// @access  Private/Teacher
const deleteLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const liveSession = await LiveSession.findByPk(id);
  
  if (!liveSession) {
    throw new AppError('Live session not found', 404);
  }

  // Check permissions
  if (req.user.role !== 'admin' && liveSession.teacherId !== req.user.id) {
    throw new AppError('You can only delete your own sessions', 403);
  }

  // Only allow deletion of scheduled sessions
  if (liveSession.status === 'live') {
    throw new AppError('Cannot delete a live session. Please end it first.', 400);
  }

  await liveSession.destroy();

  logger.info(`Live class deleted: ${liveSession.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Live class deleted successfully'
  });
});

module.exports = {
  getAllLiveClasses,
  createLiveSession,
  getBatchLiveClasses,
  joinLiveClass,
  endLiveClass,
  updateLiveClass,
  deleteLiveClass,
  // Legacy export names for backward compatibility
  createZoomMeeting: createLiveSession,
};
