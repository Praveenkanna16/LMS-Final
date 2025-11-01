const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  courseId: {
    type: sequelize.getDialect() === 'postgres' ? DataTypes.UUID : DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    },
    field: 'course_id' // Map to actual database column
  },
  teacherId: {
    type: sequelize.getDialect() === 'postgres' ? DataTypes.UUID : DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'teacher_id' // Map to actual database column
  },
  // Students stored as JSON array
  students: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Schedule stored as JSON array
  schedule: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  studentLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 100
    }
  },
  enrollmentType: {
    type: DataTypes.ENUM('open', 'invite_only', 'approval_required'),
    defaultValue: 'open'
  },
  enrollmentFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  // Pricing stored as JSON string for SQLite
  pricing: {
    type: DataTypes.TEXT,
    defaultValue: '{"originalPrice":0,"discountPrice":0,"discountPercentage":0,"currency":"INR"}'
  },
  // Settings stored as JSON string for SQLite
  settings: {
    type: DataTypes.TEXT,
    defaultValue: '{"isActive":true,"isPublished":false,"allowWaitlist":true,"autoEnrollment":false,"notificationsEnabled":true,"recordingEnabled":true,"chatEnabled":true}'
  },
  // Analytics stored as JSON string for SQLite
  analytics: {
    type: DataTypes.TEXT,
    defaultValue: '{"totalSessions":0,"averageAttendance":0,"completionRate":0,"studentEngagement":0,"teacherRating":0,"revenueGenerated":0}'
  },
  // Announcements stored as JSON string for SQLite
  announcements: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  // Study Materials stored as JSON string for SQLite
  materials: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  // Progress stored as JSON string for SQLite
  progress: {
    type: DataTypes.TEXT,
    defaultValue: '{"startDate":"","endDate":"","currentModule":1,"sessionsCompleted":0,"sessionsRemaining":0}'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  studentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'batches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['course_id'] },
    { fields: ['teacher_id'] },
    { fields: ['created_at'] }
  ]
});

// Hooks
Batch.beforeUpdate(async (batch) => {
  // Update sessions count in progress
  try {
    const schedule = JSON.parse(batch.schedule || '[]');
    const now = new Date();

    const completedSessions = schedule.filter(session => {
      const endTime = new Date(session.endTime);
      return endTime < now && session.status === 'completed';
    }).length;

    const remainingSessions = schedule.filter(session => {
      const startTime = new Date(session.startTime);
      return startTime > now && session.status === 'scheduled';
    }).length;

    const progress = JSON.parse(batch.progress || '{}');
    progress.sessionsCompleted = completedSessions;
    progress.sessionsRemaining = remainingSessions;
    batch.progress = JSON.stringify(progress);
  } catch (error) {
    console.error('Error updating batch progress:', error);
  }
});

// Static methods
Batch.getActiveBatches = async function() {
  const now = new Date();
  const batches = await this.findAll({
    order: [['created_at', 'ASC']]
  });

  // Filter active batches in JavaScript
  return batches.filter(batch => {
    try {
      const settings = JSON.parse(batch.settings || '{}');
      const progress = JSON.parse(batch.progress || '{}');

      const isActive = settings.isActive === true;
      const startDate = progress.startDate ? new Date(progress.startDate) : null;
      const endDate = progress.endDate ? new Date(progress.endDate) : null;

      return isActive &&
             startDate &&
             endDate &&
             startDate <= now &&
             endDate >= now;
    } catch (error) {
      console.error('Error parsing batch data:', error);
      return false;
    }
  });
};

Batch.getBatchesByTeacher = async function(teacherId) {
  try {
    // Get sequelize instance and models
    const db = require('./index');
    const { User, Course } = db;
    
    const batches = await this.findAll({
      where: { teacherId: teacherId }, // Use teacherId not teacher_id
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'category', 'level'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Parse students JSON and add student count
    return batches.map(batch => {
      const batchData = batch.toJSON();
      try {
        const students = JSON.parse(batch.students || '[]');
        batchData.studentCount = students.length;
        batchData.students = students;
      } catch (error) {
        batchData.studentCount = 0;
        batchData.students = [];
      }
      return batchData;
    });
  } catch (error) {
    console.error('Error in getBatchesByTeacher:', error);
    // Fallback: return batches without includes if there's an issue
    const batches = await this.findAll({
      where: { teacherId: teacherId }, // Use teacherId not teacher_id
      order: [['created_at', 'DESC']]
    });
    
    return batches.map(batch => {
      const batchData = batch.toJSON();
      try {
        const students = JSON.parse(batch.students || '[]');
        batchData.studentCount = students.length;
        batchData.students = students;
      } catch (error) {
        batchData.studentCount = 0;
        batchData.students = [];
      }
      return batchData;
    });
  }
};

Batch.getBatchesByStudent = async function(studentId) {
  const BatchEnrollment = require('./BatchEnrollment');

  // Get all batch enrollments for this student
  const enrollments = await BatchEnrollment.findAll({
    where: {
      studentId: studentId,
      status: 'active'
    },
    include: [{
      model: this,
      as: 'batch',
      include: [{
        model: require('./User'),
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      }, {
        model: require('./Course'),
        as: 'course',
        attributes: ['id', 'title', 'description']
      }]
    }],
    order: [['enrolled_at', 'DESC']]
  });

  // If there are no normalized enrollment rows, fall back to reading the
  // `batches.students` JSON column so older data (or imports) still surface
  // in the student's My Batches view.
  if (!enrollments || enrollments.length === 0) {
    try {
      const allBatches = await this.findAll({ order: [['created_at', 'DESC']] });
      const matched = allBatches.filter(batch => {
        try {
          const raw = batch.students || [];
          const studentsArr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw || '[]') : []);
          if (!Array.isArray(studentsArr)) return false;
          return studentsArr.some(s => {
            if (!s) return false;
            if (typeof s === 'object') return String(s.student || s.id || s._id) === String(studentId);
            return String(s) === String(studentId);
          });
        } catch (err) {
          return false;
        }
      });

      // Map to the same shape as the enrollment-based path (best effort)
  const fallback = matched.map(batch => {
        let settings = {};
        let schedule = [];
        try { settings = JSON.parse(batch.settings || '{}'); } catch (e) { settings = {}; }
        try { schedule = JSON.parse(batch.schedule || '[]'); } catch (e) { schedule = []; }

        // Count students from the JSON (handle array or string)
        let studentCount = 0;
        try {
          const raw = batch.students || [];
          const studentsArr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw || '[]') : []);
          studentCount = Array.isArray(studentsArr) ? studentsArr.length : 0;
        } catch (e) { studentCount = 0; }

        return {
          id: batch.id,
          name: batch.name,
          subject: batch.subject,
          grade: batch.grade,
          description: batch.description,
          teacherId: batch.teacher_id || batch.teacherId,
          teacherName: batch.teacher ? batch.teacher.name : 'TBD',
          courseId: batch.course_id || batch.courseId,
          courseTitle: batch.course ? batch.course.title : 'Course',
          studentCount: studentCount,
          studentLimit: batch.studentLimit,
          schedule: schedule,
          settings: settings,
          enrollmentFee: batch.enrollmentFee,
          enrollmentType: batch.enrollmentType,
          startDate: batch.startDate,
          endDate: batch.endDate,
          isActive: settings.isActive !== false,
          createdAt: batch.created_at,
          updatedAt: batch.updated_at,
          // Enrollment-specific fields unavailable; set sensible defaults
          enrolledAt: null,
          enrollmentStatus: 'active',
          progress: {
            modulesCompleted: 0,
            totalModules: 0,
            overall: 0,
            lastActivity: null
          }
        };
      });

  console.info(`Batch.getBatchesByStudent fallback matched ${matched.length} batches for student ${studentId}`);
  return fallback;
    } catch (err) {
      console.error('Fallback getBatchesByStudent failed:', err);
      // continue to the enrollment-based flow (which will return empty)
    }
  }

  // Extract batch data and add enrollment info
  const batchPromises = enrollments.map(async (enrollment) => {
    const batch = enrollment.batch || enrollment;
    if (!batch) return null;

    try {
      // Robust parsing for settings (may be JSON string or already object)
      let settings = {};
      try {
        if (typeof batch.settings === 'string') settings = JSON.parse(batch.settings || '{}');
        else settings = batch.settings || {};
      } catch (e) {
        settings = {};
      }

      // Robust parsing for schedule: accept JSON array or comma-separated string like "mon,wed,fri"
      let schedule = [];
      try {
        if (Array.isArray(batch.schedule)) schedule = batch.schedule;
        else if (typeof batch.schedule === 'string') {
          try { schedule = JSON.parse(batch.schedule || '[]'); }
          catch (e) { schedule = batch.schedule.split(',').map(s => s.trim()).filter(Boolean); }
        } else {
          schedule = [];
        }
      } catch (e) {
        schedule = [];
      }

      // Count active students in this batch (best-effort)
      const studentCount = await BatchEnrollment.count({
        where: {
          batchId: batch.id,
          status: 'active'
        }
      });

      return {
        id: batch.id,
        name: batch.name,
        subject: batch.subject,
        grade: batch.grade,
        description: batch.description,
        teacherId: batch.teacher_id,
        teacherName: batch.teacher?.name || 'TBD',
        courseId: batch.course_id,
        courseTitle: batch.course?.title || 'Course',
        studentCount: studentCount,
        studentLimit: batch.studentLimit,
        schedule: schedule,
        settings: settings,
        enrollmentFee: batch.enrollmentFee,
        enrollmentType: batch.enrollmentType,
        startDate: batch.startDate,
        endDate: batch.endDate,
        isActive: settings.isActive !== false,
        createdAt: batch.created_at,
        updatedAt: batch.updated_at,
        // Add enrollment-specific data
        enrolledAt: enrollment.enrolledAt,
        enrollmentStatus: enrollment.status,
        progress: {
          modulesCompleted: enrollment.progressModulesCompleted,
          totalModules: enrollment.progressTotalModules,
          overall: parseFloat(enrollment.progressOverall) || 0,
          lastActivity: enrollment.progressLastActivity
        }
      };
    } catch (error) {
      console.error('Error parsing batch data:', error);
      return null;
    }
  });

  const batches = await Promise.all(batchPromises);
  return batches.filter(Boolean); // Remove null entries
};

Batch.getUpcomingSessions = async function(limit = 20) {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const batches = await this.findAll({
    order: [['created_at', 'ASC']]
  });

  const upcomingSessions = [];

  batches.forEach(batch => {
    try {
      const settings = JSON.parse(batch.settings || '{}');
      if (!settings.isActive) return;

      const schedule = JSON.parse(batch.schedule || '[]');
      const validSessions = schedule.filter(session => {
        const startTime = new Date(session.startTime);
        return startTime >= now && startTime <= nextWeek && session.status === 'scheduled';
      });

      validSessions.forEach(session => {
        upcomingSessions.push({
          ...session,
          batchId: batch.id,
          batchName: batch.name,
          courseId: batch.course_id,
          teacherId: batch.teacher_id
        });
      });
    } catch (error) {
      console.error('Error parsing batch schedule:', error);
    }
  });

  return upcomingSessions
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, limit);
};

// Instance methods
Batch.prototype.addStudent = async function(studentId, enrolledBy = null) {
  try {
    let students = [];
    try {
      students = JSON.parse(this.students || '[]');
    } catch (err) {
      console.error('Error parsing students in addStudent:', err);
      students = [];
    }

    // Ensure students is an array
    if (!Array.isArray(students)) {
      students = [];
    }

    // Check if student already exists - handle both object and primitive formats
    const studentExists = students.some(s => {
      if (typeof s === 'object' && s !== null) {
        return s.student === studentId || s.id === studentId;
      } else {
        return s === studentId;
      }
    });

    if (studentExists) {
      throw new Error('Student is already enrolled in this batch');
    }

    // Check if batch is full
    if (students.length >= this.studentLimit) {
      throw new Error('Batch is full. Cannot enroll more students.');
    }

    // Add student
    students.push({
      student: studentId,
      enrolledBy: enrolledBy || studentId,
      enrolledAt: new Date().toISOString(),
      status: 'active',
      progress: {
        modulesCompleted: 0,
        totalModules: 0, // This would need to be calculated from course modules
        overallProgress: 0,
        lastActivity: new Date().toISOString()
      }
    });

    this.students = JSON.stringify(students);
    await this.save();

    // Update course enrollment count
    const Course = require('./Course');
    await Course.increment('students_enrolled', { where: { id: this.course_id } });

    // Also persist enrollment to BatchEnrollment table if available
    try {
      const BatchEnrollment = require('./BatchEnrollment');
      await BatchEnrollment.create({
        batchId: this.id,
        studentId: studentId,
        status: 'active',
        enrolledAt: new Date()
      });
    } catch (err) {
      // If BatchEnrollment module isn't available or insert fails, log and continue
      console.error('Warning: failed to create BatchEnrollment record:', err.message || err);
    }

    return this;
  } catch (error) {
    console.error('Error adding student to batch:', error);
    throw error;
  }
};

Batch.prototype.removeStudent = async function(studentId) {
  try {
    const students = JSON.parse(this.students || '[]');

    // Find and remove student
    const studentIndex = students.findIndex(s => s.student === studentId);

    if (studentIndex === -1) {
      throw new Error('Student not found in this batch');
    }

    students.splice(studentIndex, 1);
    this.students = JSON.stringify(students);
    await this.save();

    // Update course enrollment count
    const Course = require('./Course');
    await Course.decrement('students_enrolled', { where: { id: this.course_id } });

    return this;
  } catch (error) {
    console.error('Error removing student from batch:', error);
    throw error;
  }
};

Batch.prototype.updateAttendance = async function(sessionId, studentId, attendanceData) {
  try {
    const schedule = JSON.parse(this.schedule || '[]');
    const sessionIndex = schedule.findIndex(s => s._id === sessionId || s.id === sessionId);

    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    const session = schedule[sessionIndex];
    const attendanceIndex = (session.attendance || []).findIndex(a => a.student === studentId);

    if (attendanceIndex >= 0) {
      // Update existing attendance
      session.attendance[attendanceIndex] = {
        ...session.attendance[attendanceIndex],
        ...attendanceData
      };
    } else {
      // Add new attendance record
      if (!session.attendance) session.attendance = [];
      session.attendance.push({
        student: studentId,
        ...attendanceData
      });
    }

    this.schedule = JSON.stringify(schedule);
    await this.save();

    return session;
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
};

Batch.prototype.getAttendanceReport = function(studentId = null) {
  try {
    const schedule = JSON.parse(this.schedule || '[]');
    const students = JSON.parse(this.students || '[]');

    const report = {
      totalSessions: schedule.length,
      completedSessions: schedule.filter(s => s.status === 'completed').length,
      attendanceRate: 0,
      sessions: []
    };

    schedule.forEach(session => {
      if (studentId) {
        const studentAttendance = (session.attendance || []).find(a => a.student === studentId);
        report.sessions.push({
          sessionId: session._id || session.id,
          topic: session.topic,
          startTime: session.startTime,
          status: studentAttendance?.status || 'absent',
          duration: studentAttendance?.duration || 0
        });
      }
    });

    if (studentId && report.sessions.length > 0) {
      const presentSessions = report.sessions.filter(s => s.status === 'present').length;
      report.attendanceRate = Math.round((presentSessions / report.sessions.length) * 100);
    }

    return report;
  } catch (error) {
    console.error('Error generating attendance report:', error);
    return {
      totalSessions: 0,
      completedSessions: 0,
      attendanceRate: 0,
      sessions: []
    };
  }
};

// Associations
Batch.associate = (models) => {
  Batch.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
  Batch.belongsTo(models.User, { foreignKey: 'teacherId', as: 'teacher' });
};

module.exports = Batch;