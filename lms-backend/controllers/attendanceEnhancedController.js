const { Op } = require('sequelize');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { Attendance, LiveSession, BatchEnrollment, User } = require('../models');
const logger = require('../config/logger');
const { sendAttendanceConfirmation, sendLowAttendanceAlert } = require('../services/fcmService');

/**
 * Create attendance session with QR code
 */
const createAttendanceSession = async (req, res) => {
  try {
    const { liveSessionId, duration = 10, location } = req.body;
    const teacherId = req.user.id;

    // Verify session ownership
    const liveSession = await LiveSession.findOne({
      where: { id: liveSessionId, teacherId }
    });

    if (!liveSession) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found'
      });
    }

    // Generate unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + duration * 60 * 1000); // Duration in minutes

    // Create QR code data
    const qrData = {
      sessionToken,
      liveSessionId,
      batchId: liveSession.batchId,
      createdAt: Date.now(),
      expiresAt: expiresAt.getTime(),
      location: location || null
    };

    // Generate QR code image (base64)
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

    // Store attendance session
    const attendanceSession = {
      id: sessionToken,
      liveSessionId,
      batchId: liveSession.batchId,
      teacherId,
      qrData: JSON.stringify(qrData),
      qrCodeImage,
      location: location || null,
      duration,
      expiresAt,
      status: 'active',
      scannedBy: [],
      createdAt: new Date()
    };

    // Store in database (using LiveSession metadata or create dedicated AttendanceSession table)
    const metadata = JSON.parse(liveSession.metadata || '{}');
    metadata.attendanceSession = attendanceSession;
    await liveSession.update({ metadata: JSON.stringify(metadata) });

    logger.info(`Attendance session created by teacher ${teacherId} for session ${liveSessionId}`);

    res.status(201).json({
      success: true,
      message: 'Attendance session created successfully',
      data: {
        sessionToken,
        qrCodeImage,
        expiresAt,
        duration,
        location: location || null
      }
    });
  } catch (error) {
    logger.error('Error creating attendance session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance session'
    });
  }
};

/**
 * Mark attendance via QR code scan
 */
const markAttendanceQR = async (req, res) => {
  try {
    const { sessionToken, qrData, location } = req.body;
    const studentId = req.user.id;

    // Parse QR data
    let parsedData;
    try {
      parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code data'
      });
    }

    // Verify token matches
    if (parsedData.sessionToken !== sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session token'
      });
    }

    // Check expiration
    if (Date.now() > parsedData.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'QR code has expired'
      });
    }

    // Verify student enrollment
    const enrollment = await BatchEnrollment.findOne({
      where: {
        studentId,
        batchId: parsedData.batchId,
        status: 'active'
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Not enrolled in this batch'
      });
    }

    // Verify location (if required)
    if (parsedData.location && location) {
      const distance = calculateDistance(
        parsedData.location.lat,
        parsedData.location.lng,
        location.lat,
        location.lng
      );

      // Allow 100 meter radius
      if (distance > 0.1) {
        return res.status(403).json({
          success: false,
          message: 'You must be at the class location to mark attendance',
          distance: Math.round(distance * 1000) // meters
        });
      }
    }

    // Get live session
    const liveSession = await LiveSession.findByPk(parsedData.liveSessionId);
    const metadata = JSON.parse(liveSession.metadata || '{}');
    const attendanceSession = metadata.attendanceSession;

    // Check for duplicate scan
    if (attendanceSession.scannedBy.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked'
      });
    }

    // Mark attendance
    let attendance = await Attendance.findOne({
      where: {
        studentId,
        liveSessionId: parsedData.liveSessionId
      }
    });

    if (attendance) {
      await attendance.update({
        status: 'present',
        markedAt: new Date(),
        method: 'qr_code',
        location: location || null
      });
    } else {
      attendance = await Attendance.create({
        studentId,
        liveSessionId: parsedData.liveSessionId,
        batchId: parsedData.batchId,
        courseId: liveSession.courseId,
        status: 'present',
        markedAt: new Date(),
        method: 'qr_code',
        location: location || null
      });
    }

    // Update scanned list
    attendanceSession.scannedBy.push(studentId);
    metadata.attendanceSession = attendanceSession;
    await liveSession.update({ metadata: JSON.stringify(metadata) });

    // Send confirmation notification
    await sendAttendanceConfirmation(studentId, {
      className: liveSession.title,
      date: new Date().toLocaleDateString()
    });

    logger.info(`Attendance marked for student ${studentId} via QR code`);

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        attendance,
        markedAt: attendance.markedAt
      }
    });
  } catch (error) {
    logger.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
};

/**
 * Mark attendance manually (Teacher)
 */
const markAttendanceManual = async (req, res) => {
  try {
    const { liveSessionId, attendanceList } = req.body;
    const teacherId = req.user.id;

    // Verify session ownership
    const liveSession = await LiveSession.findOne({
      where: { id: liveSessionId, teacherId }
    });

    if (!liveSession) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found'
      });
    }

    const results = [];

    for (const entry of attendanceList) {
      try {
        let attendance = await Attendance.findOne({
          where: {
            studentId: entry.studentId,
            liveSessionId
          }
        });

        if (attendance) {
          await attendance.update({
            status: entry.status,
            markedAt: new Date(),
            method: 'manual',
            remarks: entry.remarks || null
          });
        } else {
          attendance = await Attendance.create({
            studentId: entry.studentId,
            liveSessionId,
            batchId: liveSession.batchId,
            courseId: liveSession.courseId,
            status: entry.status,
            markedAt: new Date(),
            method: 'manual',
            remarks: entry.remarks || null
          });
        }

        results.push({
          studentId: entry.studentId,
          success: true,
          attendance
        });
      } catch (error) {
        results.push({
          studentId: entry.studentId,
          success: false,
          error: error.message
        });
      }
    }

    logger.info(`Manual attendance marked by teacher ${teacherId} for ${results.length} students`);

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: results
    });
  } catch (error) {
    logger.error('Error marking manual attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
};

/**
 * Get attendance for a session
 */
const getSessionAttendance = async (req, res) => {
  try {
    const { liveSessionId } = req.params;

    const liveSession = await LiveSession.findByPk(liveSessionId);

    if (!liveSession) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found'
      });
    }

    // Get all enrolled students
    const enrollments = await BatchEnrollment.findAll({
      where: { batchId: liveSession.batchId, status: 'active' },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email', 'phone']
      }]
    });

    // Get attendance records
    const attendanceRecords = await Attendance.findAll({
      where: { liveSessionId }
    });

    // Combine data
    const attendanceList = enrollments.map(enrollment => {
      const record = attendanceRecords.find(a => a.studentId == enrollment.studentId);

      return {
        studentId: enrollment.studentId,
        studentName: enrollment.student.name,
        email: enrollment.student.email,
        status: record ? record.status : 'absent',
        markedAt: record ? record.markedAt : null,
        method: record ? record.method : null,
        remarks: record ? record.remarks : null
      };
    });

    const stats = {
      total: enrollments.length,
      present: attendanceList.filter(a => a.status === 'present').length,
      absent: attendanceList.filter(a => a.status === 'absent').length,
      late: attendanceList.filter(a => a.status === 'late').length,
      percentage: enrollments.length > 0
        ? ((attendanceList.filter(a => a.status === 'present').length / enrollments.length) * 100).toFixed(2)
        : 0
    };

    res.json({
      success: true,
      data: {
        session: {
          id: liveSession.id,
          title: liveSession.title,
          scheduledFor: liveSession.scheduledFor
        },
        stats,
        attendance: attendanceList
      }
    });
  } catch (error) {
    logger.error('Error getting session attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance'
    });
  }
};

/**
 * Get student attendance report
 */
const getStudentAttendanceReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { batchId, startDate, endDate } = req.query;

    const whereClause = { studentId };
    if (batchId) whereClause.batchId = batchId;

    const sessionWhere = {};
    if (startDate) sessionWhere.scheduledFor = { [Op.gte]: new Date(startDate) };
    if (endDate) sessionWhere.scheduledFor = { [Op.lte]: new Date(endDate) };

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [{
        model: LiveSession,
        where: sessionWhere,
        required: true
      }],
      order: [['markedAt', 'DESC']]
    });

    // Calculate statistics
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const absentCount = attendanceRecords.filter(a => a.status === 'absent').length;
    const lateCount = attendanceRecords.filter(a => a.status === 'late').length;
    const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

    // Get month-wise breakdown
    const monthWise = {};
    attendanceRecords.forEach(record => {
      const month = new Date(record.LiveSession.scheduledFor).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthWise[month]) {
        monthWise[month] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      monthWise[month].total++;
      monthWise[month][record.status]++;
    });

    res.json({
      success: true,
      data: {
        studentId,
        summary: {
          totalClasses,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          attendancePercentage
        },
        monthWise,
        records: attendanceRecords
      }
    });
  } catch (error) {
    logger.error('Error getting student attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance report'
    });
  }
};

/**
 * Get batch attendance analytics
 */
const getBatchAttendanceAnalytics = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { startDate, endDate } = req.query;

    const sessionWhere = { batchId };
    if (startDate) sessionWhere.scheduledFor = { [Op.gte]: new Date(startDate) };
    if (endDate) sessionWhere.scheduledFor = { [Op.lte]: new Date(endDate) };

    const sessions = await LiveSession.findAll({
      where: sessionWhere,
      order: [['scheduledFor', 'ASC']]
    });

    const enrollments = await BatchEnrollment.findAll({
      where: { batchId, status: 'active' },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email']
      }]
    });

    const analytics = [];

    for (const session of sessions) {
      const attendanceRecords = await Attendance.findAll({
        where: { liveSessionId: session.id }
      });

      const stats = {
        sessionId: session.id,
        title: session.title,
        date: session.scheduledFor,
        total: enrollments.length,
        present: attendanceRecords.filter(a => a.status === 'present').length,
        absent: enrollments.length - attendanceRecords.filter(a => a.status === 'present').length,
        late: attendanceRecords.filter(a => a.status === 'late').length,
        percentage: enrollments.length > 0
          ? ((attendanceRecords.filter(a => a.status === 'present').length / enrollments.length) * 100).toFixed(2)
          : 0
      };

      analytics.push(stats);
    }

    // Student-wise summary
    const studentSummary = enrollments.map(enrollment => {
      const studentAttendance = sessions.map(session => {
        return Attendance.findOne({
          where: {
            studentId: enrollment.studentId,
            liveSessionId: session.id
          }
        });
      });

      return Promise.all(studentAttendance).then(records => {
        const present = records.filter(r => r && r.status === 'present').length;
        const percentage = sessions.length > 0 ? ((present / sessions.length) * 100).toFixed(2) : 0;

        return {
          studentId: enrollment.studentId,
          studentName: enrollment.student.name,
          email: enrollment.student.email,
          totalClasses: sessions.length,
          present,
          absent: sessions.length - present,
          percentage,
          status: percentage >= 75 ? 'good' : percentage >= 50 ? 'warning' : 'critical'
        };
      });
    });

    const studentStats = await Promise.all(studentSummary);

    // Identify defaulters (< 75% attendance)
    const defaulters = studentStats.filter(s => s.percentage < 75);

    res.json({
      success: true,
      data: {
        batchId,
        sessionWise: analytics,
        studentWise: studentStats,
        defaulters,
        overallStats: {
          totalSessions: sessions.length,
          averageAttendance: analytics.length > 0
            ? (analytics.reduce((sum, a) => sum + parseFloat(a.percentage), 0) / analytics.length).toFixed(2)
            : 0
        }
      }
    });
  } catch (error) {
    logger.error('Error getting batch attendance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics'
    });
  }
};

/**
 * Send low attendance alerts
 */
const sendLowAttendanceAlerts = async (req, res) => {
  try {
    const { batchId, threshold = 75 } = req.body;

    const enrollments = await BatchEnrollment.findAll({
      where: { batchId, status: 'active' },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email', 'phone']
      }]
    });

    const sessions = await LiveSession.findAll({
      where: { batchId }
    });

    const alerts = [];

    for (const enrollment of enrollments) {
      const attendanceRecords = await Attendance.findAll({
        where: {
          studentId: enrollment.studentId,
          batchId
        }
      });

      const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
      const percentage = sessions.length > 0 ? (presentCount / sessions.length) * 100 : 0;

      if (percentage < threshold) {
        // Send notification to student
        await sendLowAttendanceAlert(enrollment.studentId, {
          percentage: percentage.toFixed(2),
          threshold,
          className: `Batch ${batchId}`
        });

        alerts.push({
          studentId: enrollment.studentId,
          studentName: enrollment.student.name,
          percentage: percentage.toFixed(2),
          present: presentCount,
          total: sessions.length
        });
      }
    }

    logger.info(`Sent low attendance alerts to ${alerts.length} students in batch ${batchId}`);

    res.json({
      success: true,
      message: `Alerts sent to ${alerts.length} students`,
      data: alerts
    });
  } catch (error) {
    logger.error('Error sending attendance alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send alerts'
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

module.exports = {
  createAttendanceSession,
  markAttendanceQR,
  markAttendanceManual,
  getSessionAttendance,
  getStudentAttendanceReport,
  getBatchAttendanceAnalytics,
  sendLowAttendanceAlerts
};
