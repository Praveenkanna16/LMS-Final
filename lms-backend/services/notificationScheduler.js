const cron = require('node-cron');
const { Op } = require('sequelize');
const { LiveSession, BatchEnrollment, Payment, Assessment } = require('../models');
const fcmService = require('./fcmService');
const logger = require('../config/logger');
const moment = require('moment');

/**
 * Notification Scheduler Service
 * Handles automated push notifications based on scheduled events
 */

// Schedule class reminders (15 minutes before class)
const scheduleClassReminders = () => {
  // Run every minute to check for upcoming classes
  cron.schedule('* * * * *', async () => {
    try {
      const fifteenMinutesFromNow = moment().add(15, 'minutes').toDate();
      const sixteenMinutesFromNow = moment().add(16, 'minutes').toDate();

      // Find classes starting in 15-16 minutes
      const upcomingClasses = await LiveSession.findAll({
        where: {
          startTime: {
            [Op.gte]: fifteenMinutesFromNow,
            [Op.lt]: sixteenMinutesFromNow
          },
          status: 'scheduled'
        },
        include: ['batch']
      });

      for (const session of upcomingClasses) {
        await fcmService.sendClassStartingSoonNotification(
          session.batchId,
          session.title,
          moment(session.startTime).format('hh:mm A'),
          session.meetingUrl
        );
        
        logger.info(`Class reminder sent for session: ${session.id}`);
      }
    } catch (error) {
      logger.error('Error in class reminder scheduler:', error);
    }
  });

  logger.info('Class reminder scheduler started');
};

// Schedule payment due reminders (1 day before due)
const schedulePaymentReminders = () => {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      const tomorrow = moment().add(1, 'day').startOf('day').toDate();
      const dayAfterTomorrow = moment().add(2, 'days').startOf('day').toDate();

      // Find payments due tomorrow
      const duePayments = await Payment.findAll({
        where: {
          dueDate: {
            [Op.gte]: tomorrow,
            [Op.lt]: dayAfterTomorrow
          },
          status: 'pending'
        },
        include: ['user', 'course']
      });

      for (const payment of duePayments) {
        await fcmService.sendPaymentDueNotification(
          payment.userId,
          payment.course?.name || 'Course',
          payment.amount,
          moment(payment.dueDate).format('DD MMM YYYY')
        );
        
        logger.info(`Payment reminder sent for payment: ${payment.id}`);
      }
    } catch (error) {
      logger.error('Error in payment reminder scheduler:', error);
    }
  });

  logger.info('Payment reminder scheduler started');
};

// Schedule assessment reminders (1 day before due)
const scheduleAssessmentReminders = () => {
  // Run every day at 10 AM
  cron.schedule('0 10 * * *', async () => {
    try {
      const tomorrow = moment().add(1, 'day').startOf('day').toDate();
      const dayAfterTomorrow = moment().add(2, 'days').startOf('day').toDate();

      // Find assessments due tomorrow
      const dueAssessments = await Assessment.findAll({
        where: {
          dueDate: {
            [Op.gte]: tomorrow,
            [Op.lt]: dayAfterTomorrow
          },
          status: 'active'
        },
        include: ['batch']
      });

      for (const assessment of dueAssessments) {
        const enrollments = await BatchEnrollment.findAll({
          where: { batchId: assessment.batchId, status: 'active' },
          attributes: ['studentId']
        });

        for (const enrollment of enrollments) {
          await fcmService.sendAssessmentReminderNotification(
            enrollment.studentId,
            assessment.title,
            moment(assessment.dueDate).format('DD MMM YYYY')
          );
        }
        
        logger.info(`Assessment reminder sent for: ${assessment.id}`);
      }
    } catch (error) {
      logger.error('Error in assessment reminder scheduler:', error);
    }
  });

  logger.info('Assessment reminder scheduler started');
};

// Schedule attendance alerts (weekly, every Monday at 11 AM)
const scheduleAttendanceAlerts = () => {
  cron.schedule('0 11 * * 1', async () => {
    try {
      const { sequelize } = require('../models');
      
      // Query students with attendance < 75%
      const lowAttendanceStudents = await sequelize.query(`
        SELECT 
          u.id as userId,
          u.name as userName,
          b.name as batchName,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*) as attendancePercentage
        FROM users u
        INNER JOIN batch_enrollments be ON u.id = be.studentId
        INNER JOIN batches b ON be.batchId = b.id
        LEFT JOIN attendance a ON a.studentId = u.id AND a.batchId = b.id
        WHERE u.role = 'student' AND be.status = 'active'
        GROUP BY u.id, u.name, b.name
        HAVING attendancePercentage < 75
      `, { type: sequelize.QueryTypes.SELECT });

      for (const student of lowAttendanceStudents) {
        // Notify student
        await fcmService.sendNotificationToUser(
          student.userId,
          'Low Attendance Alert',
          `Your attendance in ${student.batchName} is ${student.attendancePercentage.toFixed(1)}%. Please attend regularly.`,
          { type: 'low_attendance', action: 'view_attendance' }
        );

        // Notify admin
        await fcmService.sendLowAttendanceAlertToAdmin(
          student.userName,
          student.batchName,
          student.attendancePercentage.toFixed(1)
        );
      }
      
      logger.info(`Attendance alerts sent for ${lowAttendanceStudents.length} students`);
    } catch (error) {
      logger.error('Error in attendance alert scheduler:', error);
    }
  });

  logger.info('Attendance alert scheduler started');
};

// Schedule daily engagement notifications (8 PM)
const scheduleDailyEngagementNotifications = () => {
  cron.schedule('0 20 * * *', async () => {
    try {
      // Find students who haven't attended any class today
      const today = moment().startOf('day').toDate();
      const tomorrow = moment().add(1, 'day').startOf('day').toDate();

      const { sequelize } = require('../models');
      
      const inactiveStudents = await sequelize.query(`
        SELECT DISTINCT u.id as userId
        FROM users u
        INNER JOIN batch_enrollments be ON u.id = be.studentId
        WHERE u.role = 'student' 
        AND be.status = 'active'
        AND u.id NOT IN (
          SELECT DISTINCT studentId 
          FROM attendance 
          WHERE createdAt >= ? AND createdAt < ?
        )
      `, {
        replacements: [today, tomorrow],
        type: sequelize.QueryTypes.SELECT
      });

      for (const student of inactiveStudents) {
        await fcmService.sendNotificationToUser(
          student.userId,
          'Keep Learning! 📚',
          'You missed your classes today. Check your schedule and stay on track!',
          { type: 'engagement', action: 'view_schedule' }
        );
      }
      
      logger.info(`Engagement notifications sent to ${inactiveStudents.length} students`);
    } catch (error) {
      logger.error('Error in engagement notification scheduler:', error);
    }
  });

  logger.info('Daily engagement notification scheduler started');
};

// Schedule auto-retry for failed payments (every 4 hours)
const schedulePaymentRetry = () => {
  cron.schedule('0 */4 * * *', async () => {
    try {
      const { autoRetryFailedPayments } = require('../controllers/paymentEnhancedController');
      await autoRetryFailedPayments();
      logger.info('Payment retry scheduler executed');
    } catch (error) {
      logger.error('Error in payment retry scheduler:', error);
    }
  });

  logger.info('Payment retry scheduler started');
};

// Schedule auto-debit for installments (daily at 12 PM)
const scheduleInstallmentAutoDebit = () => {
  cron.schedule('0 12 * * *', async () => {
    try {
      const { InstallmentPlan } = require('../models');
      const { autoDebitInstallment } = require('../controllers/paymentEnhancedController');
      
      const now = new Date();
      const plans = await InstallmentPlan.findAll({
        where: {
          status: 'active',
          autoDebit: true,
          nextDueDate: {
            [Op.lte]: now
          }
        }
      });

      for (const plan of plans) {
        await autoDebitInstallment(plan.id);
      }
      
      logger.info(`Auto-debit executed for ${plans.length} installment plans`);
    } catch (error) {
      logger.error('Error in installment auto-debit scheduler:', error);
    }
  });

  logger.info('Installment auto-debit scheduler started');
};

// Initialize all schedulers
const initializeSchedulers = () => {
  try {
    scheduleClassReminders();
    schedulePaymentReminders();
    scheduleAssessmentReminders();
    scheduleAttendanceAlerts();
    scheduleDailyEngagementNotifications();
    schedulePaymentRetry();
    scheduleInstallmentAutoDebit();
    
    logger.info('All notification schedulers initialized successfully');
  } catch (error) {
    logger.error('Error initializing notification schedulers:', error);
  }
};

module.exports = {
  initializeSchedulers,
  scheduleClassReminders,
  schedulePaymentReminders,
  scheduleAssessmentReminders,
  scheduleAttendanceAlerts,
  scheduleDailyEngagementNotifications,
  schedulePaymentRetry,
  scheduleInstallmentAutoDebit
};
