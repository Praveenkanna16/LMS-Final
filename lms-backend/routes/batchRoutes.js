const express = require('express');
const { param, body } = require('express-validator');
const {
  getBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch,
  enrollInBatch,
  removeStudentFromBatch,
  getBatchSchedule,
  getMyBatches,
  getMyTeacherBatches,
  getUpcomingSessions,
  updateBatchSettings,
  checkEnrollmentStatus
} = require('../controllers/batchController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const batchIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid batch ID')
];

const createBatchValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Batch name must be between 3 and 100 characters'),

  body('courseId')
    .isUUID()
    .withMessage('Invalid course ID'),

  body('studentLimit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Student limit must be between 1 and 100'),

  body('enrollmentType')
    .optional()
    .isIn(['open', 'invite_only', 'approval_required'])
    .withMessage('Invalid enrollment type'),

  body('enrollmentFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Enrollment fee must be a positive number')
];

// Public routes
router.get('/', getBatches);
router.get('/upcoming-sessions', auth.authMiddleware, getUpcomingSessions);

// Student routes
router.get('/my-batches', auth.authMiddleware, auth.requireRole('student'), getMyBatches);

// Teacher routes
router.get('/teacher/my-batches', auth.authMiddleware, auth.requireRole('teacher'), getMyTeacherBatches);

router.get('/:id', batchIdValidation, getBatch);
router.get('/:id/available-students', auth.authMiddleware, auth.requireRole('teacher', 'admin'), batchIdValidation, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const User = require('../models/User');
    const { Op } = require('sequelize');
    const batch = await Batch.findByPk(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Get search query
    const searchQuery = req.query.search || '';

    // Build where clause for search
    const whereClause = {
      role: 'student'
    };

    if (searchQuery) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { email: { [Op.like]: `%${searchQuery}%` } }
      ];
    }

    // Get all students matching search
    const allStudents = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'phone'],
      limit: 50 // Limit results for performance
    });

    // Get enrolled student IDs
    let enrolledIds = [];
    try {
      const students = JSON.parse(batch.students || '[]');
      enrolledIds = students.map(s => s.student || s.id).filter(Boolean);
    } catch (error) {
      console.error('Error parsing students:', error);
    }

    // Filter out enrolled students
    const availableStudents = allStudents
      .filter(student => !enrolledIds.includes(student.id))
      .map(student => ({
        _id: student.id,
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: 'student'
      }));

    res.json({
      success: true,
      data: availableStudents
    });
  } catch (error) {
    console.error('Error fetching available students:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch available students' });
  }
});
router.post('/', auth.authMiddleware, auth.requireRole('teacher', 'admin'), createBatchValidation, createBatch);
router.put('/:id', auth.authMiddleware, batchIdValidation, updateBatch);
router.delete('/:id', auth.authMiddleware, batchIdValidation, deleteBatch);
router.put('/:id/settings', auth.authMiddleware, batchIdValidation, updateBatchSettings);

// Enrollment routes
router.get('/:id/can-enroll', auth.authMiddleware, auth.requireRole('student'), batchIdValidation, checkEnrollmentStatus);
router.post('/:id/enroll', auth.authMiddleware, auth.requireRole('student', 'admin'), enrollInBatch);
router.delete('/:id/students/:studentId', auth.authMiddleware, auth.requireRole('teacher', 'admin'), batchIdValidation, removeStudentFromBatch);

// Schedule routes
router.get('/:id/schedule', auth.authMiddleware, batchIdValidation, getBatchSchedule);
router.post('/:id/schedule', auth.authMiddleware, auth.requireRole('teacher', 'admin'), batchIdValidation, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const batch = await Batch.findByPk(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Check if user is the teacher of this batch
    if (req.user.role === 'teacher' && batch.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this batch schedule' });
    }

    const { topic, description, startTime, endTime, meetingLink, duration, type } = req.body;

    let schedule = [];
    try {
      schedule = JSON.parse(batch.schedule || '[]');
    } catch (error) {
      console.error('Error parsing schedule:', error);
      schedule = [];
    }

    const newSession = {
      _id: `session-${Date.now()}`,
      topic: topic || 'Untitled Session',
      description: description || '',
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      meetingLink: meetingLink || '',
      duration: duration || 60,
      type: type || 'live',
      status: 'scheduled',
      attendance: [],
      recording: null,
      createdAt: new Date().toISOString()
    };

    schedule.push(newSession);
    batch.schedule = JSON.stringify(schedule);
    await batch.save();

    res.json({
      success: true,
      data: newSession,
      message: 'Schedule added successfully'
    });
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ success: false, error: 'Failed to add schedule' });
  }
});

router.put('/:id/schedule/:sessionId', auth.authMiddleware, auth.requireRole('teacher', 'admin'), batchIdValidation, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const batch = await Batch.findByPk(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Check if user is the teacher of this batch
    if (req.user.role === 'teacher' && batch.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this batch schedule' });
    }

    let schedule = [];
    try {
      schedule = JSON.parse(batch.schedule || '[]');
    } catch (error) {
      console.error('Error parsing schedule:', error);
      return res.status(500).json({ success: false, error: 'Invalid schedule data' });
    }

    const sessionIndex = schedule.findIndex(s => s._id === req.params.sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Update session with new data
    schedule[sessionIndex] = {
      ...schedule[sessionIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    batch.schedule = JSON.stringify(schedule);
    await batch.save();

    res.json({
      success: true,
      data: schedule[sessionIndex],
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ success: false, error: 'Failed to update schedule' });
  }
});

router.delete('/:id/schedule/:sessionId', auth.authMiddleware, auth.requireRole('teacher', 'admin'), batchIdValidation, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const batch = await Batch.findByPk(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Check if user is the teacher of this batch
    if (req.user.role === 'teacher' && batch.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this batch schedule' });
    }

    let schedule = [];
    try {
      schedule = JSON.parse(batch.schedule || '[]');
    } catch (error) {
      console.error('Error parsing schedule:', error);
      return res.status(500).json({ success: false, error: 'Invalid schedule data' });
    }

    const sessionIndex = schedule.findIndex(s => s._id === req.params.sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    schedule.splice(sessionIndex, 1);
    batch.schedule = JSON.stringify(schedule);
    await batch.save();

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, error: 'Failed to delete schedule' });
  }
});

// Content/Materials routes
router.get('/:id/materials', auth.authMiddleware, batchIdValidation, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const batch = await Batch.findByPk(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Check if user has access
    if (req.user.role === 'student') {
      const students = JSON.parse(batch.students || '[]');
      const isEnrolled = students.some(s => s.student === req.user.id);
      if (!isEnrolled) {
        return res.status(403).json({ success: false, error: 'You must be enrolled in this batch to view materials' });
      }
    } else if (req.user.role === 'teacher' && batch.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this batch materials' });
    }

    let materials = [];
    try {
      materials = JSON.parse(batch.materials || '[]');
    } catch (error) {
      console.error('Error parsing materials:', error);
      materials = [];
    }

    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch materials' });
  }
});

router.post('/:id/materials', auth.authMiddleware, auth.requireRole('teacher', 'admin'), batchIdValidation, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const batch = await Batch.findByPk(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Check if user is the teacher of this batch
    if (req.user.role === 'teacher' && batch.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this batch materials' });
    }

    const { title, description, type, url, fileSize, duration } = req.body;

    let materials = [];
    try {
      materials = JSON.parse(batch.materials || '[]');
    } catch (error) {
      console.error('Error parsing materials:', error);
      materials = [];
    }

    const newMaterial = {
      _id: `material-${Date.now()}`,
      title: title || 'Untitled Material',
      description: description || '',
      type: type || 'document', // document, video, link, assignment
      url: url || '',
      fileSize: fileSize || 0,
      duration: duration || 0,
      uploadedBy: req.user.id,
      uploadedAt: new Date().toISOString(),
      views: 0,
      downloads: 0
    };

    materials.push(newMaterial);
    batch.materials = JSON.stringify(materials);
    await batch.save();

    res.json({
      success: true,
      data: newMaterial,
      message: 'Material added successfully'
    });
  } catch (error) {
    console.error('Error adding material:', error);
    res.status(500).json({ success: false, error: 'Failed to add material' });
  }
});

router.put('/:id/materials/:materialId', auth.authMiddleware, auth.requireRole('teacher', 'admin'), batchIdValidation, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const batch = await Batch.findByPk(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Check if user is the teacher of this batch
    if (req.user.role === 'teacher' && batch.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this batch materials' });
    }

    let materials = [];
    try {
      materials = JSON.parse(batch.materials || '[]');
    } catch (error) {
      console.error('Error parsing materials:', error);
      return res.status(500).json({ success: false, error: 'Invalid materials data' });
    }

    const materialIndex = materials.findIndex(m => m._id === req.params.materialId);
    if (materialIndex === -1) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    // Update material with new data
    materials[materialIndex] = {
      ...materials[materialIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    batch.materials = JSON.stringify(materials);
    await batch.save();

    res.json({
      success: true,
      data: materials[materialIndex],
      message: 'Material updated successfully'
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ success: false, error: 'Failed to update material' });
  }
});

router.delete('/:id/materials/:materialId', auth.authMiddleware, auth.requireRole('teacher', 'admin'), batchIdValidation, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const batch = await Batch.findByPk(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Check if user is the teacher of this batch
    if (req.user.role === 'teacher' && batch.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this batch materials' });
    }

    let materials = [];
    try {
      materials = JSON.parse(batch.materials || '[]');
    } catch (error) {
      console.error('Error parsing materials:', error);
      return res.status(500).json({ success: false, error: 'Invalid materials data' });
    }

    const materialIndex = materials.findIndex(m => m._id === req.params.materialId);
    if (materialIndex === -1) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    materials.splice(materialIndex, 1);
    batch.materials = JSON.stringify(materials);
    await batch.save();

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ success: false, error: 'Failed to delete material' });
  }
});

module.exports = router;
