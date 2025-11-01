const { Op } = require('sequelize');
const crypto = require('crypto');
const { 
  ParentAccess, 
  User, 
  BatchEnrollment,
  Attendance,
  Assessment,
  Payment,
  VideoProgress
} = require('../models');
const logger = require('../config/logger');
const { sendEmail } = require('../services/emailService');

/**
 * Create parent access
 */
const createParentAccess = async (req, res) => {
  try {
    const { studentId, parentName, parentEmail, parentPhone, relationship } = req.body;

    // Verify student exists
    const student = await User.findOne({
      where: { id: studentId, role: 'student' }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if parent access already exists
    let parentAccess = await ParentAccess.findOne({
      where: { studentId, parentEmail }
    });

    if (parentAccess) {
      return res.status(400).json({
        success: false,
        message: 'Parent access already exists for this email'
      });
    }

    // Generate unique access code
    let accessCode;
    let isUnique = false;
    while (!isUnique) {
      accessCode = ParentAccess.generateAccessCode();
      const existing = await ParentAccess.findOne({ where: { accessCode } });
      isUnique = !existing;
    }

    // Create parent access
    parentAccess = await ParentAccess.create({
      studentId,
      parentName,
      parentEmail,
      parentPhone,
      relationship,
      accessCode,
      isActive: true
    });

    // Send access code via email
    // await sendEmail({
    //   to: parentEmail,
    //   subject: 'Parent Portal Access - GenZEd LMS',
    //   html: `
    //     <h2>Welcome to GenZEd LMS Parent Portal</h2>
    //     <p>Your access code: <strong>${accessCode}</strong></p>
    //     <p>Use this code to access your child's progress.</p>
    //   `
    // });

    logger.info(`Parent access created for student ${studentId}`);

    res.status(201).json({
      success: true,
      message: 'Parent access created successfully',
      data: {
        accessCode,
        parentEmail
      }
    });
  } catch (error) {
    logger.error('Error creating parent access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create parent access'
    });
  }
};

/**
 * Parent login with access code
 */
const parentLogin = async (req, res) => {
  try {
    const { accessCode } = req.body;

    const parentAccess = await ParentAccess.findOne({
      where: { accessCode, isActive: true },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email', 'phone']
      }]
    });

    if (!parentAccess) {
      return res.status(404).json({
        success: false,
        message: 'Invalid access code'
      });
    }

    // Update last access time
    await parentAccess.update({ lastAccessAt: new Date() });

    logger.info(`Parent accessed portal for student ${parentAccess.studentId}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: accessCode, // In production, generate a proper JWT
        parent: {
          name: parentAccess.parentName,
          email: parentAccess.parentEmail,
          relationship: parentAccess.relationship
        },
        student: parentAccess.student
      }
    });
  } catch (error) {
    logger.error('Error in parent login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Get student progress for parent
 */
const getStudentProgressForParent = async (req, res) => {
  try {
    const { accessCode } = req.headers;

    const parentAccess = await ParentAccess.findOne({
      where: { accessCode, isActive: true }
    });

    if (!parentAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const studentId = parentAccess.studentId;

    // Get enrollments
    const enrollments = await BatchEnrollment.findAll({
      where: { studentId },
      include: ['batch', 'course']
    });

    // Get attendance
    const totalAttendance = await Attendance.count({ where: { studentId } });
    const presentCount = await Attendance.count({ where: { studentId, status: 'present' } });
    const attendancePercentage = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(2) : 0;

    // Get assessments
    const allAssessments = await Assessment.findAll();
    const assessmentResults = [];
    let totalScore = 0;
    let gradedCount = 0;

    for (const assessment of allAssessments) {
      const submissions = JSON.parse(assessment.submissions || '[]');
      const submission = submissions.find(s => s.student == studentId);
      
      if (submission && submission.status === 'graded') {
        assessmentResults.push({
          title: assessment.title,
          score: submission.scores.percentage,
          grade: submission.scores.grade,
          date: submission.submittedAt
        });
        totalScore += submission.scores.percentage;
        gradedCount++;
      }
    }

    const averageScore = gradedCount > 0 ? (totalScore / gradedCount).toFixed(2) : 0;

    // Get video progress
    const completedVideos = await VideoProgress.count({
      where: { studentId, completionPercentage: 100 }
    });

    res.json({
      success: true,
      data: {
        enrollments: enrollments.map(e => ({
          courseName: e.course?.name,
          batchName: e.batch?.name,
          status: e.status
        })),
        attendance: {
          totalClasses: totalAttendance,
          present: presentCount,
          percentage: attendancePercentage
        },
        assessments: {
          averageScore,
          recentResults: assessmentResults.slice(-5)
        },
        videoProgress: {
          completedVideos
        }
      }
    });
  } catch (error) {
    logger.error('Error getting student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress'
    });
  }
};

/**
 * Get attendance report for parent
 */
const getAttendanceReportForParent = async (req, res) => {
  try {
    const { accessCode } = req.headers;
    const { startDate, endDate, batchId } = req.query;

    const parentAccess = await ParentAccess.findOne({
      where: { accessCode, isActive: true }
    });

    if (!parentAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const whereClause = { studentId: parentAccess.studentId };
    if (batchId) whereClause.batchId = batchId;
    if (startDate) whereClause.markedAt = { [Op.gte]: new Date(startDate) };
    if (endDate) whereClause.markedAt = { [Op.lte]: new Date(endDate) };

    const attendance = await Attendance.findAll({
      where: whereClause,
      include: ['liveSession'],
      order: [['markedAt', 'DESC']]
    });

    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      percentage: attendance.length > 0 
        ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(2)
        : 0
    };

    res.json({
      success: true,
      data: {
        summary,
        records: attendance.map(a => ({
          date: a.markedAt,
          className: a.liveSession?.title || 'N/A',
          status: a.status
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance report'
    });
  }
};

/**
 * Get payment history for parent
 */
const getPaymentHistoryForParent = async (req, res) => {
  try {
    const { accessCode } = req.headers;

    const parentAccess = await ParentAccess.findOne({
      where: { accessCode, isActive: true }
    });

    if (!parentAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const payments = await Payment.findAll({
      where: { studentId: parentAccess.studentId },
      order: [['createdAt', 'DESC']]
    });

    const summary = {
      totalPaid: payments.filter(p => p.status === 'success').reduce((sum, p) => sum + parseFloat(p.amount), 0),
      totalPending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0),
      totalTransactions: payments.length
    };

    res.json({
      success: true,
      data: {
        summary,
        payments: payments.map(p => ({
          orderId: p.orderId,
          amount: p.amount,
          status: p.status,
          date: p.createdAt,
          paymentMethod: p.paymentMethod
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
};

/**
 * Update notification preferences
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const { accessCode } = req.headers;
    const { preferences } = req.body;

    const parentAccess = await ParentAccess.findOne({
      where: { accessCode, isActive: true }
    });

    if (!parentAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await parentAccess.update({
      notificationPreferences: preferences
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: parentAccess.notificationPreferences
    });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
};

/**
 * Revoke parent access
 */
const revokeParentAccess = async (req, res) => {
  try {
    const { id } = req.params;

    const parentAccess = await ParentAccess.findByPk(id);

    if (!parentAccess) {
      return res.status(404).json({
        success: false,
        message: 'Parent access not found'
      });
    }

    await parentAccess.update({ isActive: false });

    logger.info(`Parent access revoked: ${id}`);

    res.json({
      success: true,
      message: 'Parent access revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking parent access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke access'
    });
  }
};

module.exports = {
  createParentAccess,
  parentLogin,
  getStudentProgressForParent,
  getAttendanceReportForParent,
  getPaymentHistoryForParent,
  updateNotificationPreferences,
  revokeParentAccess
};
