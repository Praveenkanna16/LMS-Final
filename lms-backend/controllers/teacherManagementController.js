const { 
  User, 
  TeacherApplication, 
  Course, 
  Batch,
  BatchEnrollment,
  Revenue,
  Payout,
  UserProfile,
  Payment,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get all teacher applications
const getTeacherApplications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      subject,
      experienceLevel 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (subject) whereClause.subject = { [Op.iLike]: `%${subject}%` };
    if (experienceLevel) whereClause.experienceLevel = experienceLevel;

    const { count, rows: applications } = await TeacherApplication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher applications'
    });
  }
};

// Get single teacher application
const getTeacherApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await TeacherApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'email', 'phone', 'createdAt']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Teacher application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching teacher application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher application'
    });
  }
};

// Submit teacher application
const submitTeacherApplication = async (req, res) => {
  try {
    const {
      subject,
      experienceLevel,
      experienceYears,
      qualifications,
      certifications,
      portfolioUrl,
      bio,
      hourlyRate,
      availability
    } = req.body;

    // Check if user already has a pending or approved application
    const existingApplication = await TeacherApplication.findOne({
      where: {
        userId: req.user.id,
        status: ['pending', 'approved']
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved teacher application'
      });
    }

    const application = await TeacherApplication.create({
      userId: req.user.id,
      subject,
      experienceLevel,
      experienceYears,
      qualifications: JSON.stringify(qualifications || []),
      certifications: JSON.stringify(certifications || []),
      portfolioUrl,
      bio,
      hourlyRate,
      availability: JSON.stringify(availability || {}),
      status: 'pending'
    });

    const applicationWithUser = await TeacherApplication.findByPk(application.id, {
      include: [{
        model: User,
        as: 'applicant',
        attributes: ['id', 'name', 'email', 'phone']
      }]
    });

    res.status(201).json({
      success: true,
      data: applicationWithUser,
      message: 'Teacher application submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting teacher application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit teacher application'
    });
  }
};

// Review teacher application (approve/reject)
const reviewTeacherApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewNotes, commissionRate } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    const application = await TeacherApplication.findByPk(id, {
      include: [{
        model: User,
        as: 'applicant'
      }]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Teacher application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been reviewed'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Update application status
      await application.update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewNotes,
        commissionRate: action === 'approve' ? commissionRate : null,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }, { transaction });

      // If approved, update user role and add teacher-specific fields
      if (action === 'approve') {
        await application.applicant.update({
          role: 'teacher',
          approvalStatus: 'approved',
          commissionRate: commissionRate,
          maxStudentsPerBatch: 50 // Default value
        }, { transaction });
      }

      await transaction.commit();

      // Fetch updated application with all relations
      const updatedApplication = await TeacherApplication.findByPk(id, {
        include: [
          {
            model: User,
            as: 'applicant',
            attributes: ['id', 'name', 'email', 'phone', 'role']
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedApplication,
        message: `Teacher application ${action}d successfully`
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error reviewing teacher application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review teacher application'
    });
  }
};

// Get all teachers with stats
const getTeachers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      status,
      subject 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { role: 'teacher' };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status === 'active') {
      whereClause.isActive = true;
      whereClause.approvalStatus = 'approved';
    } else if (status === 'suspended') {
      whereClause.isActive = false;
    } else if (status === 'pending') {
      whereClause.approvalStatus = 'pending';
    }

    const { count, rows: teachers } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'email', 'phone', 'isActive', 
        'approvalStatus', 'commissionRate', 'maxStudentsPerBatch',
        'suspensionReason', 'suspendedAt', 'totalEarnings', 'pendingEarnings',
        'createdAt'
      ],
      include: [
        {
          model: Course,
          as: 'instructedCourses',
          attributes: ['id', 'title'],
          required: false
        },
        {
          model: TeacherApplication,
          as: 'teacherApplications',
          where: subject ? { subject: { [Op.iLike]: `%${subject}%` } } : {},
          attributes: ['subject', 'experienceLevel', 'hourlyRate'],
          required: subject ? true : false,
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get additional stats for each teacher
    const teachersWithStats = await Promise.all(teachers.map(async (teacher) => {
      const teacherData = teacher.toJSON();
      
      // Get total students taught
      const totalStudents = await BatchEnrollment.count({
        include: [{
          model: Batch,
          as: 'batch',
          include: [{
            model: Course,
            as: 'course',
            where: { instructorId: teacher.id }
          }]
        }]
      });

      // Get active batches
      const activeBatches = await Batch.count({
        include: [{
          model: Course,
          as: 'course',
          where: { instructorId: teacher.id }
        }],
        where: {
          status: 'active',
          endDate: { [Op.gt]: new Date() }
        }
      });

      return {
        ...teacherData,
        stats: {
          totalCourses: teacherData.instructedCourses?.length || 0,
          totalStudents,
          activeBatches
        }
      };
    }));

    res.json({
      success: true,
      data: {
        teachers: teachersWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers'
    });
  }
};

// Get teacher details with comprehensive stats
const getTeacherDetails = async (req, res) => {
  try {
    console.log('❌ getTeacherDetails called - ID param:', req.params.id, 'User:', req.user.id);
    const { id } = req.params;

    const teacher = await User.findOne({
      where: { id, role: 'teacher' },
      attributes: [
        'id', 'name', 'email', 'phone', 'isActive', 
        'approvalStatus', 'commissionRate', 'maxStudentsPerBatch',
        'suspensionReason', 'suspendedAt', 'suspendedBy',
        'totalEarnings', 'pendingEarnings', 'payoutStatus',
        'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: User,
          as: 'suspendedByUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: TeacherApplication,
          as: 'teacherApplications',
          attributes: ['subject', 'experienceLevel', 'experienceYears', 'bio', 'hourlyRate'],
          order: [['createdAt', 'DESC']],
          limit: 1
        },
        {
          model: Course,
          as: 'instructedCourses',
          attributes: ['id', 'title', 'price', 'isActive', 'createdAt'],
          include: [{
            model: Batch,
            as: 'batches',
            attributes: ['id', 'name', 'status', 'startDate', 'endDate']
          }]
        }
      ]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get comprehensive stats
    const stats = await Promise.all([
      // Total students across all courses
      BatchEnrollment.count({
        include: [{
          model: Batch,
          as: 'batch',
          include: [{
            model: Course,
            as: 'course',
            where: { instructorId: id }
          }]
        }]
      }),
      
      // Active students (in ongoing batches)
      BatchEnrollment.count({
        include: [{
          model: Batch,
          as: 'batch',
          where: { 
            status: 'active',
            endDate: { [Op.gt]: new Date() }
          },
          include: [{
            model: Course,
            as: 'course',
            where: { instructorId: id }
          }]
        }]
      }),

      // Total revenue generated
      Revenue.sum('amount', {
        where: { userId: id }
      }),

      // Pending payouts
      Payout.sum('amount', {
        where: { 
          userId: id, 
          status: 'pending' 
        }
      }),

      // Recent earnings (last 30 days)
      Revenue.sum('amount', {
        where: { 
          userId: id,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const teacherData = teacher.toJSON();
    teacherData.detailedStats = {
      totalStudents: stats[0] || 0,
      activeStudents: stats[1] || 0,
      totalRevenue: parseFloat(stats[2] || 0),
      pendingPayouts: parseFloat(stats[3] || 0),
      recentEarnings: parseFloat(stats[4] || 0),
      totalCourses: teacherData.instructedCourses?.length || 0,
      activeCourses: teacherData.instructedCourses?.filter(course => course.isActive).length || 0
    };

    res.json({
      success: true,
      data: teacherData
    });
  } catch (error) {
    console.error('Error fetching teacher details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher details'
    });
  }
};

// Suspend/Unsuspend teacher
const toggleTeacherSuspension = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend, reason } = req.body;

    const teacher = await User.findOne({
      where: { id, role: 'teacher' }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (suspend && !reason) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required'
      });
    }

    await teacher.update({
      isActive: !suspend,
      suspensionReason: suspend ? reason : null,
      suspendedBy: suspend ? req.user.id : null,
      suspendedAt: suspend ? new Date() : null
    });

    const updatedTeacher = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'isActive', 'suspensionReason', 'suspendedAt'],
      include: [{
        model: User,
        as: 'suspendedByUser',
        attributes: ['id', 'name'],
        required: false
      }]
    });

    res.json({
      success: true,
      data: updatedTeacher,
      message: `Teacher ${suspend ? 'suspended' : 'reactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling teacher suspension:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher status'
    });
  }
};

// Update teacher commission rate
const updateTeacherCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionRate, maxStudentsPerBatch } = req.body;

    const teacher = await User.findOne({
      where: { id, role: 'teacher' }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (commissionRate && (commissionRate < 0 || commissionRate > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Commission rate must be between 0 and 100'
      });
    }

    await teacher.update({
      commissionRate: commissionRate || teacher.commissionRate,
      maxStudentsPerBatch: maxStudentsPerBatch || teacher.maxStudentsPerBatch
    });

    res.json({
      success: true,
      data: {
        id: teacher.id,
        name: teacher.name,
        commissionRate: teacher.commissionRate,
        maxStudentsPerBatch: teacher.maxStudentsPerBatch
      },
      message: 'Teacher settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating teacher commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher settings'
    });
  }
};

// @desc    Get all students enrolled in teacher's courses/batches
// @route   GET /api/teacher/my-students
// @access  Private/Teacher
const getMyStudents = async (req, res) => {
  try {
    console.log('✅ getMyStudents called - Teacher ID:', req.user.id);
    const teacherId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      courseId = '',
      batchId = '',
      status = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for enrollments
    const enrollmentWhere = {};
    if (status) {
      enrollmentWhere.status = status;
    }

    // Build where clause for students
    const studentWhere = {
      role: 'student'
    };

    if (search) {
      studentWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Build where clause for batches
    const batchWhere = {
      teacherId: teacherId  // Use Sequelize field name (not database column name)
    };

    if (batchId) {
      batchWhere.id = batchId;
    }

    // Build where clause for courses
    const courseWhere = {};
    if (courseId) {
      courseWhere.id = courseId;
    }

    // Get all students enrolled in teacher's batches
    const { count, rows: enrollments } = await BatchEnrollment.findAndCountAll({
      where: enrollmentWhere,
      include: [
        {
          model: User,
          as: 'user',
          where: studentWhere,
          attributes: {
            exclude: ['password'],
            include: [
              [
                sequelize.literal(`(
                  SELECT COUNT(*)
                  FROM batch_enrollments be2
                  INNER JOIN batches b ON be2.batch_id = b.id
                  WHERE be2.student_id = BatchEnrollment.student_id
                  AND b.teacher_id = ${teacherId}
                )`),
                'totalEnrollments'
              ],
              [
                sequelize.literal(`(
                  SELECT SUM(p.amount)
                  FROM payments p
                  WHERE p.student_id = BatchEnrollment.student_id
                  AND p.teacher_id = ${teacherId}
                  AND p.status = 'paid'
                )`),
                'totalPaid'
              ]
            ]
          },
          include: [
            {
              model: UserProfile,
              as: 'profile',
              required: false
            }
          ]
        },
        {
          model: Batch,
          as: 'batch',
          where: batchWhere,
          include: [
            {
              model: Course,
              as: 'course',
              where: courseWhere,
              required: false,
              attributes: ['id', 'title']
            }
          ]
        }
      ],
      order: [['enrolledAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
      subQuery: false
    });

    // If we have enrollments from batch_enrollments, normalize them into students
    let students = [];
    if (enrollments && enrollments.length > 0) {
      const studentsMap = new Map();
      enrollments.forEach(enrollment => {
        const studentId = enrollment.user.id;

        if (!studentsMap.has(studentId)) {
          studentsMap.set(studentId, {
            ...enrollment.user.toJSON(),
            enrollments: [],
            courses: []
          });
        }

        const student = studentsMap.get(studentId);
        student.enrollments.push({
          id: enrollment.id,
          status: enrollment.status,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          batch: enrollment.batch
        });

        // Add unique courses
        if (enrollment.batch && enrollment.batch.course) {
          const courseExists = student.courses.some(c => c.id === enrollment.batch.course.id);
          if (!courseExists) {
            student.courses.push(enrollment.batch.course);
          }
        }
      });

      students = Array.from(studentsMap.values());
    } else {
      // Fallback: read students JSON from batches table for this teacher
      const teacherBatches = await Batch.findAll({ where: { teacherId }, attributes: ['id', 'name', 'students'] });
      const map = new Map();
      teacherBatches.forEach(b => {
        let studs = [];
        try { studs = JSON.parse(b.students || '[]'); } catch (e) { studs = []; }
        studs.forEach(s => {
          const studentId = s.student || s.id || s;
          if (!studentId) return;
          if (!map.has(studentId)) {
            map.set(studentId, {
              id: studentId,
              name: null,
              email: null,
              enrollments: [],
              courses: []
            });
          }

          const obj = map.get(studentId);
          obj.enrollments.push({
            id: null,
            status: s.status || 'active',
            progress: s.progress || null,
            enrolledAt: s.enrolledAt || null,
            batch: { id: b.id, name: b.name }
          });
        });
      });

      students = Array.from(map.values());
    }

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalCount: count,
          hasMore: offset + enrollments.length < count
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

// @desc    Get detailed info about a specific student
// @route   GET /api/teacher/students/:id
// @access  Private/Teacher
const getStudentInfo = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id: studentId } = req.params;

    // Verify student is enrolled in at least one of teacher's batches
    const enrollment = await BatchEnrollment.findOne({
      where: { userId: studentId },
      include: [
        {
          model: Batch,
          where: { teacherId },
          required: true
        }
      ]
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this student\'s information'
      });
    }

    // Get student details
    const student = await User.findOne({
      where: { id: studentId, role: 'student' },
      attributes: {
        exclude: ['password'],
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM batch_enrollments be
              INNER JOIN batches b ON be.batchId = b.id
              WHERE be.userId = User.id
              AND b.teacherId = ${teacherId}
            )`),
            'enrollmentCount'
          ],
          [
            sequelize.literal(`(
              SELECT SUM(amount)
              FROM payments
              WHERE payments.studentId = User.id
              AND payments.teacherId = ${teacherId}
              AND payments.status = 'paid'
            )`),
            'totalPaid'
          ]
        ]
      },
      include: [
        {
          model: UserProfile,
          as: 'profile',
          required: false
        },
        {
          model: BatchEnrollment,
          as: 'enrollments',
          include: [
            {
              model: Batch,
              where: { teacherId },
              include: [
                {
                  model: Course,
                  attributes: ['id', 'title', 'thumbnail']
                }
              ]
            }
          ]
        },
        {
          model: Payment,
          as: 'studentPayments',
          where: { teacherId, status: 'paid' },
          required: false,
          attributes: ['id', 'amount', 'paidAt', 'courseId'],
          include: [
            {
              model: Course,
              attributes: ['id', 'title']
            }
          ],
          order: [['paidAt', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student information',
      error: error.message
    });
  }
};

module.exports = {
  getTeacherApplications,
  getTeacherApplication,
  submitTeacherApplication,
  reviewTeacherApplication,
  getTeachers,
  getTeacherDetails,
  toggleTeacherSuspension,
  updateTeacherCommission,
  getMyStudents,
  getStudentInfo
};
