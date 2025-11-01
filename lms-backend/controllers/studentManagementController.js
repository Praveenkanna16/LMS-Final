const { Op } = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');
const { createObjectCsvStringifier } = require('csv-writer');
const { 
  User, 
  BatchEnrollment, 
  Course, 
  Batch,
  Attendance,
  Assessment,
  Payment,
  VideoProgress
} = require('../models');
const logger = require('../config/logger');
const { sendBulkNotification, sendEnrollmentConfirmation } = require('../services/fcmService');

// ==================== BULK OPERATIONS ====================

/**
 * Bulk enroll students
 */
const bulkEnrollStudents = async (req, res) => {
  try {
    const { batchId, studentIds, sendNotification = true } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }

    const batch = await Batch.findByPk(batchId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const results = [];
    const enrolledStudents = [];

    for (const studentId of studentIds) {
      try {
        // Check if already enrolled
        const existing = await BatchEnrollment.findOne({
          where: { studentId, batchId }
        });

        if (existing) {
          results.push({
            studentId,
            success: false,
            message: 'Already enrolled'
          });
          continue;
        }

        // Create enrollment
        const enrollment = await BatchEnrollment.create({
          studentId,
          batchId,
          courseId: batch.courseId,
          enrolledAt: new Date(),
          status: 'active',
          amountPaid: 0,
          paymentStatus: 'pending'
        });

        results.push({
          studentId,
          success: true,
          enrollmentId: enrollment.id
        });

        enrolledStudents.push(studentId);
      } catch (error) {
        results.push({
          studentId,
          success: false,
          message: error.message
        });
      }
    }

    // Send notifications
    if (sendNotification && enrolledStudents.length > 0) {
      for (const studentId of enrolledStudents) {
        await sendEnrollmentConfirmation(studentId, {
          courseName: batch.course.name,
          batchName: batch.name
        });
      }
    }

    logger.info(`Bulk enrollment completed: ${enrolledStudents.length}/${studentIds.length} successful`);

    res.json({
      success: true,
      message: `Enrolled ${enrolledStudents.length} out of ${studentIds.length} students`,
      data: {
        total: studentIds.length,
        successful: enrolledStudents.length,
        failed: studentIds.length - enrolledStudents.length,
        results
      }
    });
  } catch (error) {
    logger.error('Error in bulk enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk enroll students'
    });
  }
};

/**
 * Import students from CSV
 */
const importStudentsFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const { batchId, autoEnroll = false } = req.body;
    const students = [];
    const results = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          students.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each student
    for (const studentData of students) {
      try {
        const { name, email, phone, password = 'Student@123' } = studentData;

        // Check if user exists
        let user = await User.findOne({ where: { email } });

        if (!user) {
          // Create new user
          user = await User.create({
            name,
            email,
            phone,
            password, // Should be hashed in User model
            role: 'student',
            isVerified: true
          });

          results.push({
            email,
            success: true,
            action: 'created',
            userId: user.id
          });
        } else {
          results.push({
            email,
            success: true,
            action: 'exists',
            userId: user.id
          });
        }

        // Auto-enroll if batchId provided
        if (autoEnroll && batchId) {
          const existing = await BatchEnrollment.findOne({
            where: { studentId: user.id, batchId }
          });

          if (!existing) {
            await BatchEnrollment.create({
              studentId: user.id,
              batchId,
              enrolledAt: new Date(),
              status: 'active'
            });
          }
        }
      } catch (error) {
        results.push({
          email: studentData.email,
          success: false,
          error: error.message
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    logger.info(`CSV import completed: ${results.filter(r => r.success).length}/${students.length} successful`);

    res.json({
      success: true,
      message: 'CSV import completed',
      data: {
        total: students.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });
  } catch (error) {
    logger.error('Error importing CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import CSV'
    });
  }
};

/**
 * Export students to CSV
 */
const exportStudentsToCSV = async (req, res) => {
  try {
    const { batchId, courseId, includeProgress = false } = req.query;

    const whereClause = { role: 'student' };
    const include = [];

    if (batchId || courseId) {
      include.push({
        model: BatchEnrollment,
        as: 'enrollments',
        where: {
          ...(batchId && { batchId }),
          ...(courseId && { courseId })
        },
        required: true
      });
    }

    const students = await User.findAll({
      where: whereClause,
      include,
      attributes: ['id', 'name', 'email', 'phone', 'createdAt']
    });

    const csvData = [];

    for (const student of students) {
      const data = {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        registeredAt: student.createdAt
      };

      if (includeProgress === 'true' && batchId) {
        // Get attendance percentage
        const attendanceCount = await Attendance.count({
          where: { studentId: student.id, batchId, status: 'present' }
        });
        const totalSessions = await Attendance.count({
          where: { studentId: student.id, batchId }
        });
        data.attendancePercentage = totalSessions > 0 ? ((attendanceCount / totalSessions) * 100).toFixed(2) : 0;

        // Get average assessment score
        const assessments = await Assessment.findAll({
          where: { batchId }
        });
        let totalScore = 0;
        let scoredAssessments = 0;
        
        for (const assessment of assessments) {
          const submissions = JSON.parse(assessment.submissions || '[]');
          const studentSubmission = submissions.find(s => s.student == student.id && s.status === 'graded');
          if (studentSubmission) {
            totalScore += studentSubmission.scores.percentage;
            scoredAssessments++;
          }
        }
        
        data.averageScore = scoredAssessments > 0 ? (totalScore / scoredAssessments).toFixed(2) : 0;
      }

      csvData.push(data);
    }

    // Create CSV string
    const csvStringifier = createObjectCsvStringifier({
      header: Object.keys(csvData[0] || {}).map(key => ({ id: key, title: key }))
    });

    const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=students_${Date.now()}.csv`);
    res.send(csvString);

    logger.info(`Exported ${students.length} students to CSV`);
  } catch (error) {
    logger.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export CSV'
    });
  }
};

/**
 * Bulk send messages
 */
const bulkSendMessages = async (req, res) => {
  try {
    const { recipientIds, title, message, data = {} } = req.body;

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient IDs array is required'
      });
    }

    const results = await sendBulkNotification(recipientIds, title, message, data);

    logger.info(`Bulk message sent to ${recipientIds.length} recipients`);

    res.json({
      success: true,
      message: `Messages sent to ${results.successful} out of ${recipientIds.length} recipients`,
      data: {
        total: recipientIds.length,
        successful: results.successful,
        failed: results.failed
      }
    });
  } catch (error) {
    logger.error('Error sending bulk messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk messages'
    });
  }
};

/**
 * Bulk update student status
 */
const bulkUpdateStudentStatus = async (req, res) => {
  try {
    const { studentIds, status } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const [updatedCount] = await User.update(
      { status },
      { where: { id: { [Op.in]: studentIds }, role: 'student' } }
    );

    logger.info(`Bulk status update: ${updatedCount} students updated to ${status}`);

    res.json({
      success: true,
      message: `Updated ${updatedCount} students to ${status}`,
      data: { updatedCount }
    });
  } catch (error) {
    logger.error('Error in bulk status update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student status'
    });
  }
};

// ==================== STUDENT PERFORMANCE TRACKING ====================

/**
 * Get comprehensive student profile
 */
const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({
      where: { id: studentId, role: 'student' },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: BatchEnrollment,
          as: 'enrollments',
          include: [
            { model: Batch, as: 'batch' },
            { model: Course, as: 'course' }
          ]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate overall statistics
    const enrollments = student.enrollments || [];
    const stats = {
      totalCourses: enrollments.length,
      activeCourses: enrollments.filter(e => e.status === 'active').length,
      completedCourses: enrollments.filter(e => e.status === 'completed').length
    };

    // Get attendance statistics
    const totalAttendance = await Attendance.count({
      where: { studentId }
    });
    const presentCount = await Attendance.count({
      where: { studentId, status: 'present' }
    });
    stats.attendancePercentage = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(2) : 0;

    // Get assessment statistics
    const allAssessments = await Assessment.findAll();
    let totalScore = 0;
    let completedAssessments = 0;
    
    for (const assessment of allAssessments) {
      const submissions = JSON.parse(assessment.submissions || '[]');
      const studentSubmission = submissions.find(s => s.student == studentId && s.status === 'graded');
      if (studentSubmission) {
        totalScore += studentSubmission.scores.percentage;
        completedAssessments++;
      }
    }
    
    stats.averageScore = completedAssessments > 0 ? (totalScore / completedAssessments).toFixed(2) : 0;
    stats.completedAssessments = completedAssessments;

    // Get video progress
    const videoProgress = await VideoProgress.count({
      where: { studentId, completionPercentage: 100 }
    });
    stats.completedVideos = videoProgress;

    // Get payment statistics
    const totalPayments = await Payment.sum('amount', {
      where: { studentId, status: 'success' }
    }) || 0;
    const pendingPayments = await Payment.sum('amount', {
      where: { studentId, status: 'pending' }
    }) || 0;
    stats.totalPaid = totalPayments;
    stats.pendingPayments = pendingPayments;

    res.json({
      success: true,
      data: {
        student,
        statistics: stats
      }
    });
  } catch (error) {
    logger.error('Error getting student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student profile'
    });
  }
};

/**
 * Get student engagement metrics
 */
const getStudentEngagement = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate);
    if (endDate) dateFilter[Op.lte] = new Date(endDate);

    // Daily activity count
    const attendance = await Attendance.findAll({
      where: {
        studentId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      attributes: ['createdAt', 'status'],
      order: [['createdAt', 'ASC']]
    });

    // Video watch time
    const videoProgress = await VideoProgress.findAll({
      where: { studentId },
      attributes: ['totalWatchTime', 'updatedAt']
    });

    const totalWatchTime = videoProgress.reduce((sum, v) => sum + (v.totalWatchTime || 0), 0);

    // Assessment participation
    const assessments = await Assessment.findAll();
    const participatedAssessments = assessments.filter(assessment => {
      const submissions = JSON.parse(assessment.submissions || '[]');
      return submissions.some(s => s.student == studentId);
    });

    // Engagement score (0-100)
    const engagementScore = calculateEngagementScore({
      attendanceRate: attendance.length > 0 ? (attendance.filter(a => a.status === 'present').length / attendance.length) : 0,
      watchTimeMinutes: totalWatchTime / 60,
      assessmentParticipation: participatedAssessments.length / Math.max(assessments.length, 1)
    });

    res.json({
      success: true,
      data: {
        attendanceCount: attendance.length,
        presentCount: attendance.filter(a => a.status === 'present').length,
        totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
        completedVideos: videoProgress.filter(v => v.watchedPercentage === 100).length,
        participatedAssessments: participatedAssessments.length,
        totalAssessments: assessments.length,
        engagementScore: engagementScore.toFixed(2),
        activityTimeline: attendance.map(a => ({
          date: a.createdAt,
          type: 'attendance',
          status: a.status
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting student engagement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get engagement metrics'
    });
  }
};

/**
 * Calculate engagement score
 */
const calculateEngagementScore = ({ attendanceRate, watchTimeMinutes, assessmentParticipation }) => {
  // Weighted scoring
  const attendanceWeight = 0.4;
  const watchTimeWeight = 0.3;
  const assessmentWeight = 0.3;

  const attendanceScore = attendanceRate * 100 * attendanceWeight;
  const watchTimeScore = Math.min((watchTimeMinutes / 60) * 100, 100) * watchTimeWeight; // Normalize to hours
  const assessmentScore = assessmentParticipation * 100 * assessmentWeight;

  return attendanceScore + watchTimeScore + assessmentScore;
};

module.exports = {
  // Bulk Operations
  bulkEnrollStudents,
  importStudentsFromCSV,
  exportStudentsToCSV,
  bulkSendMessages,
  bulkUpdateStudentStatus,
  
  // Performance Tracking
  getStudentProfile,
  getStudentEngagement
};
