const admin = require('firebase-admin');
const { FCMToken } = require('../models');
const logger = require('../config/logger');

// Initialize Firebase Admin (if not already initialized)
let isFirebaseInitialized = false;

if (!admin.apps.length) {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isFirebaseInitialized = true;
      logger.info('Firebase Admin initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin:', error);
    }
  } else {
    logger.warn(`Firebase credentials not found. Missing: ${missingVars.join(', ')}. Push notifications will be disabled.`);
  }
}

// Send push notification to a single token
const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    if (!isFirebaseInitialized) {
      throw new Error('Firebase Admin not initialized. Check Firebase credentials.');
    }

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      token
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent successfully`, { messageId: response });
    return response;
  } catch (error) {
    logger.error('Failed to send push notification:', error);
    
    // If token is invalid, remove it from database
    if (error.code === 'messaging/registration-token-not-registered' || 
        error.code === 'messaging/invalid-registration-token') {
      await FCMToken.destroy({ where: { token } });
      logger.info(`Removed invalid FCM token: ${token}`);
    }
    
    throw new Error(`Push notification failed: ${error.message}`);
  }
};

// Send push notification to multiple tokens
const sendMulticastNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!tokens || tokens.length === 0) {
      throw new Error('No tokens provided');
    }

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    
    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          logger.warn(`Failed to send to token ${tokens[idx]}:`, resp.error);
          
          // Remove invalid tokens
          if (resp.error?.code === 'messaging/registration-token-not-registered' || 
              resp.error?.code === 'messaging/invalid-registration-token') {
            FCMToken.destroy({ where: { token: tokens[idx] } });
          }
        }
      });
    }

    logger.info(`Multicast notification sent: ${response.successCount} success, ${response.failureCount} failures`);
    return response;
  } catch (error) {
    logger.error('Failed to send multicast notification:', error);
    throw new Error(`Multicast notification failed: ${error.message}`);
  }
};

// Send notification to all users of a specific role
const sendNotificationToRole = async (role, title, body, data = {}) => {
  try {
    const tokens = await FCMToken.findAll({
      include: [{
        model: require('../models').User,
        as: 'user',
        where: { role, isActive: true },
        attributes: []
      }],
      attributes: ['token']
    });

    if (tokens.length === 0) {
      logger.info(`No FCM tokens found for role: ${role}`);
      return { successCount: 0, failureCount: 0 };
    }

    const tokenStrings = tokens.map(t => t.token);
    return await sendMulticastNotification(tokenStrings, title, body, data);
  } catch (error) {
    logger.error('Failed to send notification to role:', error);
    throw error;
  }
};

// Send notification to specific user
const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    const tokens = await FCMToken.findAll({
      where: { userId },
      attributes: ['token']
    });

    if (tokens.length === 0) {
      logger.info(`No FCM tokens found for user: ${userId}`);
      return { successCount: 0, failureCount: 0 };
    }

    const tokenStrings = tokens.map(t => t.token);
    return await sendMulticastNotification(tokenStrings, title, body, data);
  } catch (error) {
    logger.error('Failed to send notification to user:', error);
    throw error;
  }
};

// Send course enrollment notification
const sendEnrollmentNotification = async (userId, courseName) => {
  const title = 'Course Enrollment Confirmed';
  const body = `You have successfully enrolled in "${courseName}". Start learning now!`;
  const data = {
    type: 'enrollment',
    action: 'view_course'
  };

  return await sendNotificationToUser(userId, title, body, data);
};

// Send class reminder notification
const sendClassReminderNotification = async (userId, className, startTime) => {
  const title = 'Class Starting Soon';
  const body = `Your class "${className}" starts at ${startTime}. Don't miss it!`;
  const data = {
    type: 'class_reminder',
    action: 'join_class'
  };

  return await sendNotificationToUser(userId, title, body, data);
};

// Send payment confirmation notification
const sendPaymentConfirmationNotification = async (userId, amount, courseName) => {
  const title = 'Payment Confirmed';
  const body = `Your payment of ₹${amount} for "${courseName}" has been confirmed.`;
  const data = {
    type: 'payment_confirmation',
    action: 'view_course'
  };

  return await sendNotificationToUser(userId, title, body, data);
};

// Send teacher application status notification
const sendTeacherApplicationNotification = async (userId, status) => {
  const title = `Teacher Application ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  const body = status === 'approved' 
    ? 'Congratulations! Your teacher application has been approved.'
    : 'Your teacher application has been rejected. Check your email for details.';
  
  const data = {
    type: 'teacher_application',
    status,
    action: status === 'approved' ? 'view_teacher_dashboard' : 'view_profile'
  };

  return await sendNotificationToUser(userId, title, body, data);
};

// Send assignment/assessment reminder
const sendAssessmentReminderNotification = async (userId, assessmentName, dueDate) => {
  const title = 'Assessment Reminder';
  const body = `Don't forget to complete "${assessmentName}" by ${dueDate}.`;
  const data = {
    type: 'assessment_reminder',
    action: 'take_assessment'
  };

  return await sendNotificationToUser(userId, title, body, data);
};

// ==================== ENHANCED STUDENT NOTIFICATIONS ====================

// Send payment due notification
const sendPaymentDueNotification = async (userId, courseName, amount, dueDate) => {
  const title = 'Payment Due Reminder';
  const body = `Payment of ₹${amount} for "${courseName}" is due by ${dueDate}.`;
  const data = {
    type: 'payment_due',
    action: 'make_payment',
    courseName,
    amount: amount.toString(),
    dueDate
  };

  return await sendNotificationToUser(userId, title, body, data);
};

// Send announcement notification to students
const sendAnnouncementToStudents = async (title, message, batchId = null) => {
  try {
    let tokens;
    
    if (batchId) {
      // Send to specific batch students
      const { BatchEnrollment } = require('../models');
      const enrollments = await BatchEnrollment.findAll({
        where: { batchId, status: 'active' },
        attributes: ['studentId']
      });
      
      const studentIds = enrollments.map(e => e.studentId);
      tokens = await FCMToken.findAll({
        where: { userId: studentIds },
        attributes: ['token']
      });
    } else {
      // Send to all students
      tokens = await FCMToken.findAll({
        include: [{
          model: require('../models').User,
          as: 'user',
          where: { role: 'student', isActive: true },
          attributes: []
        }],
        attributes: ['token']
      });
    }

    if (tokens.length === 0) {
      logger.info('No student tokens found for announcement');
      return { successCount: 0, failureCount: 0 };
    }

    const tokenStrings = tokens.map(t => t.token);
    return await sendMulticastNotification(tokenStrings, title, message, {
      type: 'announcement',
      action: 'view_announcement',
      batchId: batchId?.toString() || 'all'
    });
  } catch (error) {
    logger.error('Failed to send announcement:', error);
    throw error;
  }
};

// Send class starting now notification (15 mins before)
const sendClassStartingSoonNotification = async (batchId, className, startTime, meetingUrl) => {
  try {
    const { BatchEnrollment } = require('../models');
    const enrollments = await BatchEnrollment.findAll({
      where: { batchId, status: 'active' },
      attributes: ['studentId']
    });
    
    const studentIds = enrollments.map(e => e.studentId);
    
    for (const studentId of studentIds) {
      await sendNotificationToUser(
        studentId,
        'Class Starting in 15 Minutes!',
        `"${className}" is starting soon. Join now!`,
        {
          type: 'class_starting_soon',
          action: 'join_class',
          meetingUrl,
          startTime,
          batchId: batchId.toString()
        }
      );
    }
    
    logger.info(`Class starting soon notifications sent for batch ${batchId}`);
  } catch (error) {
    logger.error('Failed to send class starting notifications:', error);
    throw error;
  }
};

// ==================== ENHANCED TEACHER NOTIFICATIONS ====================

// Send payment received notification to teacher
const sendTeacherPaymentReceivedNotification = async (teacherId, amount, source, studentName) => {
  const title = 'Payment Received';
  const body = `You received ₹${amount} from ${studentName} (${source} source).`;
  const data = {
    type: 'payment_received',
    action: 'view_earnings',
    amount: amount.toString(),
    source
  };

  return await sendNotificationToUser(teacherId, title, body, data);
};

// Send new enrollment notification to teacher
const sendNewEnrollmentNotification = async (teacherId, studentName, courseName, batchName) => {
  const title = 'New Student Enrollment';
  const body = `${studentName} has enrolled in "${batchName || courseName}".`;
  const data = {
    type: 'new_enrollment',
    action: 'view_batch',
    courseName,
    batchName
  };

  return await sendNotificationToUser(teacherId, title, body, data);
};

// Send payout approved notification to teacher
const sendPayoutApprovedNotification = async (teacherId, amount, payoutId) => {
  const title = 'Payout Approved';
  const body = `Your payout request of ₹${amount} has been approved and is being processed.`;
  const data = {
    type: 'payout_approved',
    action: 'view_payout_history',
    amount: amount.toString(),
    payoutId: payoutId.toString()
  };

  return await sendNotificationToUser(teacherId, title, body, data);
};

// Send payout completed notification to teacher
const sendPayoutCompletedNotification = async (teacherId, amount, transactionId) => {
  const title = 'Payout Completed';
  const body = `₹${amount} has been transferred to your account. Transaction ID: ${transactionId}`;
  const data = {
    type: 'payout_completed',
    action: 'view_payout_history',
    amount: amount.toString(),
    transactionId
  };

  return await sendNotificationToUser(teacherId, title, body, data);
};

// Send class feedback reminder to teacher
const sendClassFeedbackReminderNotification = async (teacherId, className, classId) => {
  const title = 'Class Feedback Reminder';
  const body = `Please provide feedback for "${className}" session.`;
  const data = {
    type: 'feedback_reminder',
    action: 'provide_feedback',
    classId: classId.toString()
  };

  return await sendNotificationToUser(teacherId, title, body, data);
};

// ==================== ADMIN NOTIFICATIONS ====================

// Send critical platform alert to admin
const sendAdminCriticalAlert = async (alertTitle, alertMessage, severity = 'high') => {
  const title = `🚨 ${severity.toUpperCase()} ALERT: ${alertTitle}`;
  const body = alertMessage;
  const data = {
    type: 'admin_alert',
    severity,
    action: 'view_admin_dashboard',
    timestamp: new Date().toISOString()
  };

  return await sendNotificationToRole('admin', title, body, data);
};

// Send new payout request notification to admin
const sendNewPayoutRequestNotification = async (teacherName, amount, payoutId) => {
  const title = 'New Payout Request';
  const body = `${teacherName} has requested a payout of ₹${amount}.`;
  const data = {
    type: 'payout_request',
    action: 'review_payout',
    payoutId: payoutId.toString(),
    amount: amount.toString()
  };

  return await sendNotificationToRole('admin', title, body, data);
};

// Send payment failure notification to admin
const sendPaymentFailureAlertToAdmin = async (studentName, amount, reason) => {
  const title = 'Payment Failure Alert';
  const body = `Payment of ₹${amount} from ${studentName} failed. Reason: ${reason}`;
  const data = {
    type: 'payment_failure',
    action: 'view_payments',
    amount: amount.toString()
  };

  return await sendNotificationToRole('admin', title, body, data);
};

// Send low attendance alert to admin
const sendLowAttendanceAlertToAdmin = async (studentName, batchName, attendancePercentage) => {
  const title = 'Low Attendance Alert';
  const body = `${studentName} in ${batchName} has ${attendancePercentage}% attendance.`;
  const data = {
    type: 'low_attendance',
    action: 'view_student_details',
    attendancePercentage: attendancePercentage.toString()
  };

  return await sendNotificationToRole('admin', title, body, data);
};

// Send new user registration to admin
const sendNewUserRegistrationToAdmin = async (userName, userRole) => {
  const title = 'New User Registration';
  const body = `${userName} has registered as a ${userRole}.`;
  const data = {
    type: 'new_user',
    action: 'view_users',
    userRole
  };

  return await sendNotificationToRole('admin', title, body, data);
};

// ==================== SCHEDULED NOTIFICATIONS ====================

// Schedule class reminder (call this 15 minutes before class)
const scheduleClassReminder = async (batchId, className, startTime, meetingUrl) => {
  // This should be called by a cron job or scheduled task
  return await sendClassStartingSoonNotification(batchId, className, startTime, meetingUrl);
};

// Send batch completion notification
const sendBatchCompletionNotification = async (batchId, batchName) => {
  try {
    const { BatchEnrollment } = require('../models');
    const enrollments = await BatchEnrollment.findAll({
      where: { batchId, status: 'active' },
      attributes: ['studentId']
    });
    
    const studentIds = enrollments.map(e => e.studentId);
    
    for (const studentId of studentIds) {
      await sendNotificationToUser(
        studentId,
        'Batch Completed!',
        `Congratulations! You have completed "${batchName}". Download your certificate now.`,
        {
          type: 'batch_completion',
          action: 'download_certificate',
          batchId: batchId.toString()
        }
      );
    }
    
    logger.info(`Batch completion notifications sent for batch ${batchId}`);
  } catch (error) {
    logger.error('Failed to send batch completion notifications:', error);
    throw error;
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastNotification,
  sendNotificationToRole,
  sendNotificationToUser,
  sendEnrollmentNotification,
  sendClassReminderNotification,
  sendPaymentConfirmationNotification,
  sendTeacherApplicationNotification,
  sendAssessmentReminderNotification,
  
  // Student notifications
  sendPaymentDueNotification,
  sendAnnouncementToStudents,
  sendClassStartingSoonNotification,
  
  // Teacher notifications
  sendTeacherPaymentReceivedNotification,
  sendNewEnrollmentNotification,
  sendPayoutApprovedNotification,
  sendPayoutCompletedNotification,
  sendClassFeedbackReminderNotification,
  
  // Admin notifications
  sendAdminCriticalAlert,
  sendNewPayoutRequestNotification,
  sendPaymentFailureAlertToAdmin,
  sendLowAttendanceAlertToAdmin,
  sendNewUserRegistrationToAdmin,
  
  // Scheduled notifications
  scheduleClassReminder,
  sendBatchCompletionNotification
};
