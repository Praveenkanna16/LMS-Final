const express = require('express');
const { sequelize } = require('./models');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const dotenv = require('dotenv');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const batchRoutes = require('./routes/batchRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationPreferenceRoutes = require('./routes/notificationPreferenceRoutes');
const notificationTopicRoutes = require('./routes/notificationTopicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const fcmRoutes = require('./routes/fcmRoutes');
const cashfreeRoutes = require('./routes/cashfreeRoutes');
const notificationManagementRoutes = require('./routes/notificationManagementRoutes');
const teacherManagementRoutes = require('./routes/teacherManagementRoutes');
const recordedContentRoutes = require('./routes/recordedContentRoutes');
const bulkOperationsRoutes = require('./routes/bulkOperationsRoutes');
const teacherPortalRoutes = require('./routes/teacherPortalRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const auth = require('./middleware/authMiddleware');

// Import services
const socketManager = require('./services/socketManager');
const notificationScheduler = require('./services/notificationScheduler');
const logger = require('./config/logger');

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8084", "http://localhost:8085", "http://localhost:8087", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Connect to database and sync database - TEMPORARILY DISABLED
// sequelize.sync({ alter: true })
// .then(() => {
//   logger.info('Database synchronized successfully');
// })
// .catch((err) => {
//   logger.error('Database connection error:', err);
//   process.exit(1);
// });

logger.info('Database sync disabled - using existing database');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:8084", "http://localhost:8085", "http://localhost:8087", "http://localhost:3000"],
  credentials: true
}));
app.use(xss());
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: sequelize ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', auth.authMiddleware, userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', require('./routes/payoutRoutes'));
app.use('/api/content-library', require('./routes/contentLibraryRoutes'));
app.use('/api/assessments', assessmentRoutes);
app.use('/api/assessments-enhanced', require('./routes/assessmentEnhancedRoutes'));
app.use('/api/attendance-enhanced', require('./routes/attendanceEnhancedRoutes'));
app.use('/api/payments-enhanced', require('./routes/paymentEnhancedRoutes'));
app.use('/api/student-management', require('./routes/studentManagementRoutes'));
app.use('/api/parent-portal', require('./routes/parentPortalRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/live-classes', auth.authMiddleware, require('./routes/liveClassRoutes'));
app.use('/api/notifications', auth.authMiddleware, notificationRoutes);
app.use('/api/admin', auth.authMiddleware, adminRoutes);
app.use('/api/analytics', auth.authMiddleware, analyticsRoutes);
app.use('/api/notification-preferences', auth.authMiddleware, notificationPreferenceRoutes);
app.use('/api/notification-topics', auth.authMiddleware, notificationTopicRoutes);
app.use('/api/fcm', fcmRoutes);
app.use('/api/payments/cashfree', cashfreeRoutes);
app.use('/api/notification-management', notificationManagementRoutes);
app.use('/api/teacher-management', teacherManagementRoutes);
app.use('/api/recorded-content', recordedContentRoutes);
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/student', auth.authMiddleware, require('./routes/studentPortalRoutes'));
app.use('/api/teacher', auth.teacherPortalAuth, teacherPortalRoutes);
app.use('/api/admin/bulk', auth.authMiddleware, bulkOperationsRoutes);
app.use('/api/admin/teacher-salaries', require('./routes/teacherSalaryRoutes'));
// app.use('/api/cart', cartRoutes); // Temporarily disabled
// app.use('/api/wishlist', wishlistRoutes); // Temporarily disabled

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      batches: '/api/batches',
      payments: '/api/payments',
      assessments: '/api/assessments',
      notifications: '/api/notifications',
      admin: '/api/admin',
      analytics: '/api/analytics',
      'notification-preferences': '/api/notification-preferences',
      'notification-topics': '/api/notification-topics',
      fcm: '/api/fcm'
      // cart: '/api/cart', // Temporarily disabled
      // wishlist: '/api/wishlist' // Temporarily disabled
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Socket Manager
socketManager.init(io);

// Initialize Notification Schedulers
notificationScheduler.initializeSchedulers();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  logger.info(`GenZEd LMS Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
});

module.exports = app;
