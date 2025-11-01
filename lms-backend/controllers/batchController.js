const Batch = require('../models/Batch');
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');

// @desc    Get all batches
// @route   GET /api/batches
// @access  Public (with filters)
const getBatches = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  // Get all batches first
  const { rows: allBatches, count } = await Batch.findAndCountAll({
    order: [['created_at', 'DESC']],
    limit: 1000, // Get all for filtering
    offset: 0
  });

  // Filter in JavaScript instead of complex SQL
  let batches = allBatches;
  if (req.query.status) {
    const isPublished = req.query.status === 'published';
    batches = batches.filter(batch => {
      try {
        const settings = JSON.parse(batch.settings || '{}');
        return settings.isPublished === isPublished;
      } catch (error) {
        return false;
      }
    });
  }

  // Apply pagination after filtering
  const paginatedBatches = batches.slice(offset, offset + limit);

  // Enrich batches with teacher and course information
  const enrichedBatches = await Promise.all(
    paginatedBatches.map(async (batch) => {
      const batchData = batch.toJSON();
      
      // Fetch teacher information
      if (batch.teacherId) {
        const teacher = await User.findByPk(batch.teacherId, {
          attributes: ['id', 'name', 'email']
        });
        batchData.teacher = teacher ? {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email
        } : { name: 'Unknown', email: 'N/A' };
      } else {
        batchData.teacher = { name: 'Unknown', email: 'N/A' };
      }

      // Fetch course information
      if (batch.courseId) {
        const course = await Course.findByPk(batch.courseId, {
          attributes: ['id', 'title', 'category', 'level']
        });
        if (course) {
          batchData.course = {
            id: course.id,
            title: course.title,
            category: course.category,
            level: course.level
          };
          // Extract subject and grade from course title or use category
          // Course title format: "Subject - Grade Level - Batch Name"
          const titleParts = course.title.split('-').map(p => p.trim());
          batchData.subject = titleParts[0] || course.category || 'N/A';
          batchData.grade = titleParts.length > 1 && titleParts[1].includes('Grade') 
            ? titleParts[1].replace('Grade', '').trim() 
            : course.level || 'N/A';
        } else {
          batchData.course = null;
          batchData.subject = 'N/A';
          batchData.grade = 'N/A';
        }
      } else {
        batchData.subject = 'N/A';
        batchData.grade = 'N/A';
      }

      // Parse JSON fields for easier frontend consumption
      try {
        batchData.students = JSON.parse(batch.students || '[]');
        batchData.progress = JSON.parse(batch.progress || '{}');
        batchData.settings = JSON.parse(batch.settings || '{}');
        
        // Extract isActive from settings
        batchData.isActive = batchData.settings.isActive !== undefined 
          ? batchData.settings.isActive 
          : true;
          
        // Extract start and end dates from progress
        if (batchData.progress.startDate) {
          batchData.startDate = batchData.progress.startDate;
        }
        if (batchData.progress.endDate) {
          batchData.endDate = batchData.progress.endDate;
        }
      } catch (error) {
        batchData.students = [];
        batchData.progress = {};
        batchData.settings = {};
        batchData.isActive = true;
      }

      // Add schedule from batch data (it's stored in schedule column)
      batchData.schedule = batch.schedule || 'Not scheduled';
      
      // Add maxStudents
      batchData.maxStudents = batch.studentLimit || 30;

      return batchData;
    })
  );

  res.json({
    success: true,
    data: {
      batches: enrichedBatches,
      pagination: {
        page,
        limit,
        total: batches.length,
        pages: Math.ceil(batches.length / limit)
      }
    }
  });
});

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Public
const getBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  const batchData = batch.toJSON();

  // Fetch teacher information
  if (batch.teacherId) {
    const teacher = await User.findByPk(batch.teacherId, {
      attributes: ['id', 'name', 'email']
    });
    batchData.teacher = teacher ? {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email
    } : { name: 'Unknown', email: 'N/A' };
  }

  // Fetch course information
  if (batch.courseId) {
    const course = await Course.findByPk(batch.courseId);
    batchData.course = course;
  }

  // Parse JSON fields
  try {
    batchData.students = JSON.parse(batch.students || '[]');
    batchData.progress = JSON.parse(batch.progress || '{}');
    batchData.settings = JSON.parse(batch.settings || '{}');
  } catch (error) {
    batchData.students = [];
    batchData.progress = {};
    batchData.settings = {};
  }

  // Fetch full student details
  if (batchData.students && batchData.students.length > 0) {
    const studentIds = batchData.students.map(s => s.student);
    const students = await User.findAll({
      where: { id: studentIds },
      attributes: ['id', 'name', 'email', 'role']
    });
    
    // Map students with enrollment info
    batchData.students = batchData.students.map(enrollment => {
      const student = students.find(s => s.id === enrollment.student);
      if (student) {
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role,
          enrolledAt: enrollment.enrolledAt,
          enrolledBy: enrollment.enrolledBy,
          status: enrollment.status,
          progress: enrollment.progress
        };
      }
      return null;
    }).filter(s => s !== null);
  }

  // Check if current user is enrolled (if authenticated)
  let isEnrolled = false;
  let userProgress = null;
  if (req.user) {
    const enrollment = batchData.students.find(s => s.id === req.user.id);
    isEnrolled = !!enrollment;
    if (enrollment) {
      userProgress = enrollment.progress;
    }
  }

  res.json({
    success: true,
    data: {
      batch: batchData,
      isEnrolled,
      userProgress
    }
  });
});

// @desc    Create new batch
// @route   POST /api/batches
// @access  Private/Teacher/Admin
const createBatch = asyncHandler(async (req, res) => {
  const { 
    name, 
    subject, 
    grade, 
    description, 
    teacherId, 
    maxStudents, 
    schedule, 
    startDate, 
    endDate, 
    isActive,
    studentIds,
    courseId,
    enrollmentFee,
    studentLimit
  } = req.body;

  let finalCourseId = courseId;
  let finalTeacherId = teacherId || req.user.id;

  // Verify teacher exists. Be tolerant: frontend may send numeric id, numeric string, email or name.
  let teacher = null;

  // Try direct PK lookup first
  try {
    teacher = await User.findByPk(finalTeacherId);
  } catch (err) {
    teacher = null;
  }

  // If not found, try numeric conversion (string ids)
  if (!teacher && typeof finalTeacherId === 'string' && /^\d+$/.test(finalTeacherId)) {
    teacher = await User.findByPk(Number(finalTeacherId));
  }

  // If still not found, try lookup by email
  if (!teacher && typeof finalTeacherId === 'string') {
    teacher = await User.findOne({ where: { email: finalTeacherId } });
  }

  // If still not found, try lookup by name
  if (!teacher && typeof finalTeacherId === 'string') {
    teacher = await User.findOne({ where: { name: finalTeacherId } });
  }

  if (!teacher) {
    throw new AppError('Invalid teacher ID', 400);
  }

  // Allow admins to be assigned as teacher (admins should be able to create/assign batches)
  if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
    throw new AppError('Invalid teacher role', 400);
  }

  // Ensure finalTeacherId is the resolved numeric PK
  finalTeacherId = teacher.id;

  // If no courseId provided, create a default course for this batch
  if (!finalCourseId) {
    if (!subject) {
      throw new AppError('Subject is required when no courseId is provided', 400);
    }

    // Map subject to category (Course model ENUM)
    const categoryMap = {
      'mathematics': 'Mathematics',
      'math': 'Mathematics',
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'biology': 'Biology',
      'english': 'English',
      'computer science': 'Computer Science',
      'cs': 'Computer Science',
      'programming': 'Programming',
      'java': 'Programming',
      'python': 'Programming',
      'javascript': 'Programming',
      'economics': 'Economics',
      'history': 'History',
      'geography': 'Geography',
      'art': 'Art',
      'music': 'Music'
    };

    const category = categoryMap[subject.toLowerCase()] || 'Other';

    // Create a default course for this batch
    const courseData = {
      title: `${subject}${grade ? ` - Grade ${grade}` : ''} - ${name}`,
      description: description || `Course for ${name} batch`,
      category: category,
      teacherId: finalTeacherId,
      duration: '30 days',
      level: 'All Levels',
      price: 0,
      language: 'English',
      isPublished: true,
      createdBy: req.user.id
    };

    const course = await Course.create(courseData);
    finalCourseId = course.id;
    logger.info(`Auto-created course ${course.id} for batch ${name}`);
  } else {
    // Verify course exists
    const course = await Course.findByPk(finalCourseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      throw new AppError('You can only create batches for your own courses', 403);
    }
  }

  // Normalize and format students array correctly
  const normalizedStudentIds = (studentIds || []).map(s => {
    if (!s) return null;
    if (typeof s === 'object') return s.id ?? s._id ?? s.student ?? null;
    return s;
  }).filter(Boolean);

  const formattedStudents = normalizedStudentIds.map(studentId => ({
    student: studentId,
    enrolledBy: req.user.id,
    enrolledAt: new Date().toISOString(),
    status: 'active',
    progress: {
      modulesCompleted: 0,
      totalModules: 0,
      overallProgress: 0,
      lastActivity: new Date().toISOString()
    }
  }));

  const batchData = {
    name,
    courseId: finalCourseId,
    teacherId: finalTeacherId,
    schedule: schedule || [],
    studentLimit: studentLimit || maxStudents || 30,
    enrollmentType: 'open',
    enrollmentFee: enrollmentFee || 0,
    students: JSON.stringify(formattedStudents),
    createdBy: req.user.id,
    progress: JSON.stringify({
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentModule: 1,
      sessionsCompleted: 0,
      sessionsRemaining: 0
    }),
    settings: JSON.stringify({
      isActive: isActive !== undefined ? isActive : true,
      isPublished: true,
      allowWaitlist: true,
      autoEnrollment: false,
      notificationsEnabled: true,
      recordingEnabled: true,
      chatEnabled: true
    })
  };

  const batch = await Batch.create(batchData);

  // Create BatchEnrollment records for initial students so student-facing
  // endpoints that rely on the batch_enrollments table will see these
  // enrollments. We create them after the batch is created to get the PK.
  try {
    const BatchEnrollment = require('../models/BatchEnrollment');
    if (formattedStudents && formattedStudents.length > 0) {
      const enrollmentsToCreate = formattedStudents.map(s => ({
        batchId: batch.id,
        studentId: s.student,
        status: s.status || 'active',
        enrolledAt: s.enrolledAt || new Date(),
        progressModulesCompleted: (s.progress && s.progress.modulesCompleted) || 0,
        progressTotalModules: (s.progress && s.progress.totalModules) || 0,
        progressOverall: (s.progress && s.progress.overallProgress) || 0,
        progressLastActivity: (s.progress && s.progress.lastActivity) || new Date()
      }));

      // Use bulkCreate with ignoreDuplicates to avoid any conflicts
      await BatchEnrollment.bulkCreate(enrollmentsToCreate, { ignoreDuplicates: true });
    }
  } catch (err) {
    logger.error('Failed to create batch enrollments for initial students', err);
    // don't fail the batch create if enrollment creation fails
  }

  logger.info(`Batch created: ${batch.name} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Batch created successfully',
    data: { batch }
  });
});

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private/Teacher (owner only)
const updateBatch = asyncHandler(async (req, res) => {
  let batch = await Batch.findByPk(req.params.id);

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  // Check ownership - Allow admins or the teacher who created the batch
  if (req.user.role !== 'admin' && batch.teacher_id !== req.user.id) {
    throw new AppError('Not authorized to update this batch', 403);
  }

  batch = await batch.update(req.body);

  logger.info(`Batch updated: ${batch.name} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Batch updated successfully',
    data: { batch }
  });
});

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private/Teacher (owner only) or Admin
const deleteBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  // Check ownership - Allow admins or the teacher who created the batch
  if (req.user.role !== 'admin' && batch.teacher_id !== req.user.id) {
    throw new AppError('Not authorized to delete this batch', 403);
  }

  // Soft delete - mark as inactive by updating JSON settings
  const settings = JSON.parse(batch.settings || '{}');
  settings.isActive = false;
  await batch.update({ settings: JSON.stringify(settings) });

  logger.info(`Batch deleted: ${batch.name} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Batch deleted successfully'
  });
});

// @desc    Enroll student in batch
// @route   POST /api/batches/:id/enroll
// @access  Private
const enrollInBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  if (!batch.settings || !JSON.parse(batch.settings || '{}').isActive) {
    throw new AppError('Batch is not active', 400);
  }

  const studentId = req.user.role === 'student' ? req.user.id : req.body.studentId;

  if (!studentId) {
    throw new AppError('Student ID is required', 400);
  }

  // Check if payment is required
  if (batch.enrollmentFee && batch.enrollmentFee > 0) {
    // Payment is required - verify payment has been made
    const Payment = require('../models/Payment');
    const payment = await Payment.findOne({
      where: {
        studentId: studentId,
        batchId: batch.id,
        status: 'success'
      }
    });

    if (!payment) {
      throw new AppError('Payment required for enrollment. Please complete the payment first.', 402);
    }
  }

  // Check if student is already enrolled
  let students = [];
  try {
    if (typeof batch.students === 'string') {
      students = JSON.parse(batch.students || '[]');
    } else if (Array.isArray(batch.students)) {
      students = batch.students;
    }
  } catch (error) {
    console.error('Error parsing students data:', error);
    students = [];
  }
  
  // Ensure students is an array
  if (!Array.isArray(students)) {
    students = [];
  }
  
  const isAlreadyEnrolled = students.some(s => s.student === studentId || s.id === studentId || s === studentId);
  if (isAlreadyEnrolled) {
    throw new AppError('Student is already enrolled in this batch', 400);
  }

  // Check if batch is full
  if (students.length >= batch.studentLimit) {
    throw new AppError('Batch is full', 400);
  }

  // If enrollment requires approval and user is student, create request
  if (batch.enrollmentType === 'approval_required' && req.user.role === 'student') {
    // For now, auto-approve. In production, this would create a request
    await batch.addStudent(studentId, req.user.id);
  } else {
    await batch.addStudent(studentId, req.user.id);
  }

  logger.info(`Student ${studentId} enrolled in batch ${batch.name} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Enrolled in batch successfully',
    data: { batch }
  });
});

// @desc    Remove student from batch
// @route   DELETE /api/batches/:id/students/:studentId
// @access  Private/Teacher (owner only) or Admin
const removeStudentFromBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  // Check authorization
  if (req.user.role !== 'admin' && batch.teacher_id !== req.user.id) {
    throw new AppError('Not authorized to remove students from this batch', 403);
  }

  await batch.removeStudent(req.params.studentId);

  logger.info(`Student ${req.params.studentId} removed from batch ${batch.name} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Student removed from batch successfully'
  });
});

// @desc    Get batch schedule
// @route   GET /api/batches/:id/schedule
// @access  Private (enrolled students or teacher)
const getBatchSchedule = asyncHandler(async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  // Check if user has access
  if (req.user.role === 'student') {
    const students = JSON.parse(batch.students || '[]');
    const isEnrolled = students.some(s => s.student === req.user.id);
    if (!isEnrolled) {
      throw new AppError('You must be enrolled in this batch to view the schedule', 403);
    }
  } else if (req.user.role === 'teacher' && batch.teacherId !== req.user.id && batch.teacher_id !== req.user.id) {
    throw new AppError('Not authorized to view this batch schedule', 403);
  }

  res.json({
    success: true,
    data: {
      schedule: batch.schedule,
      batch: {
        id: batch.id,
        name: batch.name
      }
    }
  });
});

// @desc    Get student's batches
// @route   GET /api/batches/my-batches
// @access  Private/Student
const getMyBatches = asyncHandler(async (req, res) => {
  try {
    const batches = await Batch.getBatchesByStudent(req.user.id);
    
    // Enrich with teacher and course details
    const enrichedBatches = await Promise.all((batches || []).map(async (batch) => {
      const batchData = { ...batch };
      
      // Fetch teacher if not already present
      if (batch.teacherId && !batch.teacher) {
        try {
          const teacher = await User.findByPk(batch.teacherId, {
            attributes: ['id', 'name', 'email']
          });
          if (teacher) {
            batchData.teacher = { id: teacher.id, name: teacher.name, email: teacher.email };
            batchData.teacherName = teacher.name;
          }
        } catch (err) {
          logger.warn(`Failed to fetch teacher ${batch.teacherId} for batch ${batch.id}`);
        }
      }
      
      // Fetch course if not already present
      if (batch.courseId && !batch.course) {
        try {
          const course = await Course.findByPk(batch.courseId, {
            attributes: ['id', 'title', 'description', 'category', 'level']
          });
          if (course) {
            batchData.course = { id: course.id, title: course.title, description: course.description };
            batchData.courseTitle = course.title;
          }
        } catch (err) {
          logger.warn(`Failed to fetch course ${batch.courseId} for batch ${batch.id}`);
        }
      }
      
      return batchData;
    }));

    res.json({
      success: true,
      data: enrichedBatches
    });
  } catch (error) {
    logger.error('Error fetching student batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Get teacher's batches
// @route   GET /api/batches/teacher/my-batches
// @access  Private/Teacher
const getMyTeacherBatches = asyncHandler(async (req, res) => {
  try {
    const batches = await Batch.getBatchesByTeacher(req.user.id);

    // Enrich with full course details
    const enrichedBatches = await Promise.all((batches || []).map(async (batch) => {
      const batchData = { ...batch };
      
      // Fetch course if not already present
      if (batch.courseId && !batch.course) {
        try {
          const course = await Course.findByPk(batch.courseId, {
            attributes: ['id', 'title', 'description', 'category', 'level', 'price']
          });
          if (course) {
            batchData.course = { 
              id: course.id, 
              title: course.title, 
              description: course.description,
              category: course.category,
              level: course.level,
              price: course.price
            };
            batchData.courseTitle = course.title;
          }
        } catch (err) {
          logger.warn(`Failed to fetch course ${batch.courseId} for batch ${batch.id}`);
        }
      }
      
      return batchData;
    }));

    res.json({
      success: true,
      data: enrichedBatches
    });
  } catch (error) {
    logger.error('Error fetching teacher batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Get upcoming sessions
// @route   GET /api/batches/upcoming-sessions
// @access  Private
const getUpcomingSessions = asyncHandler(async (req, res) => {
  const sessions = await Batch.getUpcomingSessions(20);

  // Filter for current user's batches if student
  let filteredSessions = sessions;
  if (req.user.role === 'student') {
    const myBatches = await Batch.getBatchesByStudent(req.user.id);
    const myBatchIds = myBatches.map(b => b.id.toString());
    filteredSessions = sessions.filter(session =>
      myBatchIds.includes(session.batchId.toString())
    );
  }

  res.json(filteredSessions);
});

// @desc    Update batch settings
// @route   PUT /api/batches/:id/settings
// @access  Private/Teacher (owner only)
const updateBatchSettings = asyncHandler(async (req, res) => {
  const allowedFields = [
    'settings.isPublished',
    'settings.allowWaitlist',
    'settings.autoEnrollment',
    'settings.notificationsEnabled',
    'settings.recordingEnabled',
    'settings.chatEnabled'
  ];

  const batch = await Batch.findByPk(req.params.id);

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  // Check ownership - Allow admins or the teacher who created the batch
  if (req.user.role !== 'admin' && batch.teacher_id !== req.user.id) {
    throw new AppError('Not authorized to update this batch', 403);
  }

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      // Convert settings field updates to proper JSON format
      if (key.startsWith('settings.')) {
        const settingsKey = key.replace('settings.', '');
        const currentSettings = JSON.parse(batch.settings || '{}');
        currentSettings[settingsKey] = req.body[key];
        updates.settings = JSON.stringify(currentSettings);
      }
    }
  });

  await batch.update(updates);

  logger.info(`Batch settings updated: ${batch.name} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Batch settings updated successfully',
    data: { batch }
  });
});

// @desc    Check if student can enroll in batch (payment status check)
// @route   GET /api/batches/:id/can-enroll
// @access  Private/Student
const checkEnrollmentStatus = asyncHandler(async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  const studentId = req.user.id;
  const requiresPayment = batch.enrollmentFee && batch.enrollmentFee > 0;
  let paymentMade = false;

  if (requiresPayment) {
    // Check if payment exists
    const Payment = require('../models/Payment');
    const payment = await Payment.findOne({
      where: {
        studentId: studentId,
        batchId: batch.id,
        status: 'success'
      }
    });
    paymentMade = !!payment;
  }

  res.json({
    success: true,
    data: {
      batchId: batch.id,
      requiresPayment,
      paymentMade,
      canEnroll: !requiresPayment || paymentMade,
      enrollmentFee: batch.enrollmentFee || 0
    }
  });
});

module.exports = {
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
  checkEnrollmentStatus,
  updateBatchSettings
};
