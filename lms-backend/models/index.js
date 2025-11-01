const sequelize = require('../config/database');
const ActivityLog = require('./ActivityLog');
const Achievement = require('./Achievement');
const Assessment = require('./Assessment');
const AssessmentSubmission = require('./AssessmentSubmission');
const Batch = require('./Batch');
const BatchEnrollment = require('./BatchEnrollment');
const Certificate = require('./Certificate');
const Content = require('./Content');
const Course = require('./Course');
const Doubt = require('./Doubt');
const FCMToken = require('./FCMToken');
const ForumPost = require('./ForumPost');
const LearningPath = require('./LearningPath');
const LiveSession = require('./LiveSession');
const Notification = require('./Notification');
const NotificationPreference = require('./NotificationPreference');
const NotificationTopic = require('./NotificationTopic');
const Payment = require('./Payment');
const Payout = require('./Payout');
const Progress = require('./Progress');
const Question = require('./Question');
const Revenue = require('./Revenue');
const SessionAttendance = require('./SessionAttendance');
const SystemSettings = require('./SystemSettings');
const TopicSubscription = require('./TopicSubscription');
const User = require('./User');
const UserAchievement = require('./UserAchievement');
const UserGamification = require('./UserGamification');
const UserPreferences = require('./UserPreferences');
const UserProfile = require('./UserProfile');
const UserProgress = require('./UserProgress');
const Wishlist = require('./Wishlist');

// New models
const TeacherApplication = require('./TeacherApplication');
const NotificationTemplate = require('./NotificationTemplate');
const RecordedContent = require('./RecordedContent');
const GeneratedReport = require('./GeneratedReport');
const NotificationLog = require('./NotificationLog');
const CashfreeTransaction = require('./CashfreeTransaction');
const Backup = require('./Backup');
const VideoProgress = require('./VideoProgress');
const TeacherBankAccount = require('./TeacherBankAccount');

// Define model relationships
Course.hasMany(Batch, { foreignKey: 'courseId', as: 'batches' });
Batch.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Course-User teacher relationship
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });

Course.belongsToMany(User, { through: 'course_enrollments', timestamps: true });
User.belongsToMany(Course, { through: 'course_enrollments', timestamps: true });

Batch.belongsToMany(User, { through: BatchEnrollment });
User.belongsToMany(Batch, { through: BatchEnrollment });

// BatchEnrollment direct associations (needed for queries)
BatchEnrollment.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
BatchEnrollment.belongsTo(User, { foreignKey: 'studentId', as: 'user' });
Batch.hasMany(BatchEnrollment, { foreignKey: 'batchId', as: 'enrollments' });
User.hasMany(BatchEnrollment, { foreignKey: 'studentId', as: 'enrollments' });

// LiveSession associations
LiveSession.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
Batch.hasMany(LiveSession, { foreignKey: 'batchId', as: 'liveSessions' });

LiveSession.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(LiveSession, { foreignKey: 'teacherId', as: 'liveSessions' });

// Batch-User teacher relationship
Batch.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Batch, { foreignKey: 'teacherId', as: 'batches' });

// Assessment associations
Assessment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(Assessment, { foreignKey: 'courseId' });

Assessment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Assessment, { foreignKey: 'teacherId', as: 'assessments' });

Assessment.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
Batch.hasMany(Assessment, { foreignKey: 'batchId', as: 'assessments' });

Assessment.hasMany(AssessmentSubmission, { foreignKey: 'assessmentId' });
AssessmentSubmission.belongsTo(Assessment, { foreignKey: 'assessmentId' });

User.hasMany(AssessmentSubmission, { foreignKey: 'userId', as: 'submissions' });
AssessmentSubmission.belongsTo(User, { foreignKey: 'userId', as: 'student' });

// Notification associations with aliases
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Payments associations
User.hasMany(Payment, { foreignKey: 'studentId', as: 'studentPayments' });
User.hasMany(Payment, { foreignKey: 'teacherId', as: 'teacherPayments' });
Payment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Payment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

Course.hasMany(Payment, { foreignKey: 'courseId' });
Payment.belongsTo(Course, { foreignKey: 'courseId' });

Batch.hasMany(Payment, { foreignKey: 'batchId' });
Payment.belongsTo(Batch, { foreignKey: 'batchId' });

// Payout associations
Payout.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Payout, { foreignKey: 'teacherId', as: 'payouts' });

User.hasOne(Wishlist);
Wishlist.belongsTo(User);
Wishlist.belongsToMany(Course, { through: 'wishlist_items', timestamps: true });
Course.belongsToMany(Wishlist, { through: 'wishlist_items', timestamps: true });

// New model associations
TeacherApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
TeacherApplication.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(TeacherApplication, { foreignKey: 'userId', as: 'teacherApplications' });

NotificationTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(NotificationTemplate, { foreignKey: 'createdBy' });

RecordedContent.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
RecordedContent.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
RecordedContent.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
RecordedContent.belongsTo(LiveSession, { foreignKey: 'liveSessionId', as: 'liveSession' });
Course.hasMany(RecordedContent, { foreignKey: 'courseId', as: 'recordedContents' });
Batch.hasMany(RecordedContent, { foreignKey: 'batchId', as: 'recordedContents' });
User.hasMany(RecordedContent, { foreignKey: 'teacherId', as: 'recordedContents' });
LiveSession.hasOne(RecordedContent, { foreignKey: 'liveSessionId', as: 'recordedContent' });

// VideoProgress associations
VideoProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
VideoProgress.belongsTo(RecordedContent, { foreignKey: 'recordedContentId', as: 'video' });
User.hasMany(VideoProgress, { foreignKey: 'userId', as: 'videoProgress' });
RecordedContent.hasMany(VideoProgress, { foreignKey: 'recordedContentId', as: 'viewProgress' });

GeneratedReport.belongsTo(User, { foreignKey: 'generatedBy', as: 'generator' });
User.hasMany(GeneratedReport, { foreignKey: 'generatedBy' });

NotificationLog.belongsTo(Notification, { foreignKey: 'notificationId' });
NotificationLog.belongsTo(User, { foreignKey: 'userId' });
Notification.hasMany(NotificationLog, { foreignKey: 'notificationId' });
User.hasMany(NotificationLog, { foreignKey: 'userId' });

CashfreeTransaction.belongsTo(Payment, { foreignKey: 'paymentId' });
Payment.hasOne(CashfreeTransaction, { foreignKey: 'paymentId' });

// Backup associations
Backup.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Backup, { foreignKey: 'createdBy', as: 'backups' });

// UserProfile associations
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// TeacherBankAccount associations
User.hasOne(TeacherBankAccount, { foreignKey: 'teacher_id', as: 'bankAccount' });
TeacherBankAccount.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// Database synchronization function
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
  } catch (err) {
    console.error('Error syncing database:', err);
    throw err;
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  ActivityLog,
  Achievement,
  Assessment,
  AssessmentSubmission,
  Batch,
  BatchEnrollment,
  Certificate,
  Content,
  Course,
  Doubt,
  FCMToken,
  ForumPost,
  LearningPath,
  LiveSession,
  Notification,
  NotificationPreference,
  NotificationTopic,
  Payment,
  Payout,
  Progress,
  Question,
  Revenue,
  SessionAttendance,
  SystemSettings,
  TopicSubscription,
  User,
  UserAchievement,
  UserGamification,
  UserPreferences,
  UserProfile,
  UserProgress,
  Wishlist,
  // New models
  TeacherApplication,
  NotificationTemplate,
  RecordedContent,
  GeneratedReport,
  NotificationLog,
  CashfreeTransaction,
  Backup,
  VideoProgress,
  TeacherBankAccount
};
