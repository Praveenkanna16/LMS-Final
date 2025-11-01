const Payment = require('../models/Payment');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Payout = require('../models/Payout');
const cashfree = require('../config/cashfree');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { Op } = require('sequelize');

// NOTE: Many functions below still use Mongoose-style calls and need full refactor.
// For now, we add a minimal admin list using Sequelize so the Admin UI works.

// @desc    List all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
const getAllPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.status) where.status = req.query.status;

  const { rows, count } = await Payment.findAndCountAll({
    where,
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
      { model: Course, attributes: ['id', 'title', 'price'] },
      { model: Batch, attributes: ['id', 'name'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  // Calculate stats
  const totalPayments = await Payment.count();
  const completedPayments = await Payment.count({ where: { status: 'paid' } });
  const pendingPayments = await Payment.count({ where: { status: 'created' } });
  const failedPayments = await Payment.count({ where: { status: 'failed' } });
  const refundedPayments = await Payment.count({ 
    where: { status: ['refunded', 'partial_refund'] } 
  });

  const totalRevenueResult = await Payment.sum('amount', { 
    where: { status: 'paid' } 
  });
  const totalRevenue = totalRevenueResult || 0;

  const successRate = totalPayments > 0 
    ? (completedPayments / totalPayments) * 100 
    : 0;

  const avgTransactionResult = await Payment.findAll({
    where: { status: 'paid' },
    attributes: ['amount'],
  });
  const avgTransaction = avgTransactionResult.length > 0
    ? avgTransactionResult.reduce((sum, p) => sum + p.amount, 0) / avgTransactionResult.length
    : 0;

  // This month revenue
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthResult = await Payment.sum('amount', {
    where: {
      status: 'paid',
      created_at: {
        [Op.gte]: monthStart
      }
    }
  });
  const thisMonth = thisMonthResult || 0;

  // Normalize to the shape the frontend expects
  const payments = rows.map(p => ({
    id: String(p.id),
    userId: String(p.studentId),
    user: {
      name: p.student?.name ?? 'Unknown',
      email: p.student?.email ?? 'n/a',
    },
    courseId: String(p.courseId),
    batchId: String(p.batchId),
    course: {
      title: p.Course?.title ?? 'Course',
      price: Number(p.Course?.price ?? 0),
    },
    batch: p.Batch ? { name: p.Batch.name } : null,
    amount: Number(p.amount),
    currency: p.currency || 'INR',
    method: p.paymentMethod || 'cashfree',
    status: mapStatus(p.status),
    transactionId: p.cashfreePaymentId || p.razorpayPaymentId || p.cashfreeOrderId || p.razorpayOrderId || `txn_${p.id}`,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    refundReason: p.refundReason || undefined,
  }));

  const stats = {
    total: totalPayments,
    completed: completedPayments,
    pending: pendingPayments,
    failed: failedPayments,
    refunded: refundedPayments,
    totalRevenue: Math.round(totalRevenue),
    successRate: Math.round(successRate * 10) / 10,
    avgTransaction: Math.round(avgTransaction),
    thisMonth: Math.round(thisMonth),
  };

  return res.json({ 
    success: true, 
    data: {
      payments,
      stats,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

function mapStatus(status) {
  switch (status) {
    case 'paid':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'refunded':
    case 'partial_refund':
      return 'refunded';
    case 'created':
    default:
      return 'pending';
  }
}

// @desc    Create payment order
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { batchId, source = 'platform', paymentMethod = 'card' } = req.body;

  // Validate batch exists and is active
  const batch = await Batch.findById(batchId)
    .populate('course', 'title price settings')
    .populate('teacher', 'name email');

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  if (!batch.settings.isActive) {
    throw new AppError('Batch is not active', 400);
  }

  // Check if student is already enrolled
  if (req.user.role === 'student') {
    const isEnrolled = batch.students.some(s => s.student.toString() === req.user._id.toString());
    if (isEnrolled) {
      throw new AppError('You are already enrolled in this batch', 400);
    }

    // Check if batch is full
    if (batch.students.length >= batch.studentLimit) {
      throw new AppError('Batch is full', 400);
    }
  }

  // Calculate commission based on source
  const commissionRate = source === 'platform' ? 0.4 : 0.6; // 40% or 60% platform fee
  const amount = batch.enrollmentFee || batch.course.price;
  const platformFee = Math.round(amount * commissionRate);
  const teacherEarnings = amount - platformFee;

  try {
    // Create Cashfree order
    const orderData = {
      order_id: `order_${Date.now()}_${req.user._id}`,
      order_amount: amount,
      order_currency: 'INR',
      order_note: `Enrollment in ${batch.name}`,
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: req.user.profile?.phone || '9999999999'
      },
      order_meta: {
        batchId: batch._id.toString(),
        courseId: batch.course._id.toString(),
        studentId: req.user._id.toString(),
        teacherId: batch.teacher._id.toString(),
        source,
        amount: amount.toString(),
        platformFee: platformFee.toString(),
        teacherEarnings: teacherEarnings.toString(),
        paymentMethod,
        commissionRate: commissionRate.toString()
      },
      order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    };

    const cashfreeOrder = await cashfree.createOrder(orderData);

    // Create payment record
    const payment = await Payment.create({
      cashfreeOrderId: cashfreeOrder.order_id,
      student: req.user._id,
      batch: batch._id,
      course: batch.course._id,
      teacher: batch.teacher._id,
      amount,
      originalAmount: amount,
      source,
      commissionRate,
      platformFee,
      teacherEarnings,
      status: 'created',
      paymentMethod: paymentMethod,
      paymentGateway: 'cashfree',
      paymentLink: cashfreeOrder.payment_link
    });

    logger.info(`Payment order created: ${cashfreeOrder.order_id} for batch ${batch.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        order: cashfreeOrder,
        payment: {
          id: payment._id,
          amount,
          currency: 'INR',
          commissionRate,
          platformFee,
          teacherEarnings
        }
      }
    });

  } catch (cashfreeError) {
    logger.error('Cashfree order creation failed:', cashfreeError);
    throw new AppError('Failed to create payment order', 500);
  }
});

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { order_id, payment_id, signature } = req.body;

  // Verify payment with Cashfree
  try {
    const paymentDetails = await cashfree.getPayment(payment_id);

    // Find payment record
    const payment = await Payment.findOne({ cashfreeOrderId: order_id });

    if (!payment) {
      throw new AppError('Payment order not found', 404);
    }

    if (payment.status === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: { payment }
      });
    }

    // Check if payment is successful
    if (paymentDetails.payment_status === 'SUCCESS') {
      // Update payment status
      await payment.markAsPaid(payment_id, signature);

      // Get batch and student data
      const batch = await Batch.findByPk(payment.batchId);
      const student = await User.findByPk(payment.studentId);
      
      if (batch && student) {
        // Auto-enroll student in batch using addStudent method
        try {
          await batch.addStudent(payment.studentId, payment.studentId);
          logger.info(`Student ${payment.studentId} auto-enrolled in batch ${batch.id} after payment`);
        } catch (enrollError) {
          logger.warn(`Auto-enrollment warning: ${enrollError.message}`);
          // If student already enrolled, that's fine - payment is still verified
        }

        // Create enrollment record in BatchEnrollment table
        const { BatchEnrollment } = require('../models');
        try {
          await BatchEnrollment.findOrCreate({
            where: {
              batchId: payment.batchId,
              studentId: payment.studentId
            },
            defaults: {
              status: 'active',
              enrolledAt: new Date()
            }
          });
        } catch (enrollmentError) {
          logger.warn(`BatchEnrollment record creation warning: ${enrollmentError.message}`);
        }
      }

      // Create notifications
      const Notification = require('../models').Notification;
      
      // Notification to student
      if (Notification && Notification.create) {
        try {
          await Notification.create({
            title: 'Payment Successful',
            message: `Your payment of ₹${payment.amount} for batch "${batch?.name}" has been verified. You are now enrolled!`,
            recipientId: payment.studentId,
            type: 'payment_received',
            category: 'financial',
            priority: 'high',
            relatedPaymentId: payment.id,
            relatedBatchId: payment.batchId,
            channels: {
              email: true,
              push: true,
              sms: false,
              inApp: true
            }
          }).catch(err => logger.warn(`Student notification creation warning: ${err.message}`));
        } catch (notifError) {
          logger.warn(`Notification creation failed: ${notifError.message}`);
        }

        // Notification to teacher
        try {
          const teacher = await User.findByPk(payment.teacherId);
          if (teacher) {
            await Notification.create({
              title: 'New Enrollment - Payment Received',
              message: `${student?.name || 'A student'} has enrolled in your batch "${batch?.name}" and paid ₹${payment.amount}.`,
              recipientId: payment.teacherId,
              type: 'payment_received',
              category: 'financial',
              priority: 'high',
              relatedPaymentId: payment.id,
              relatedBatchId: payment.batchId,
              channels: {
                email: true,
                push: true,
                sms: false,
                inApp: true
              }
            }).catch(err => logger.warn(`Teacher notification creation warning: ${err.message}`));
          }
        } catch (teacherNotifError) {
          logger.warn(`Teacher notification creation failed: ${teacherNotifError.message}`);
        }
      }

      logger.info(`Payment verified: ${payment_id} for order ${order_id}. Student ${payment.studentId} auto-enrolled in batch ${payment.batchId}`);

      res.json({
        success: true,
        message: 'Payment verified successfully and student auto-enrolled',
        data: {
          payment,
          enrollment: {
            batchId: payment.batchId,
            courseId: payment.courseId,
            teacherId: payment.teacherId,
            studentId: payment.studentId
          }
        }
      });
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = paymentDetails.failure_reason || 'Payment failed';
      payment.failedAt = new Date();
      await payment.save();

      // Create failure notification
      await Notification.create({
        title: 'Payment Failed',
        message: `Your payment of ₹${payment.amount} has failed. ${payment.failureReason || 'Please try again.'}`,
        recipient: payment.student,
        type: 'payment_received',
        category: 'financial',
        priority: 'high',
        relatedPayment: payment._id,
        channels: {
          email: true,
          push: true,
          sms: false,
          inApp: true
        }
      });

      logger.error(`Payment failed: ${payment_id} for order ${order_id}`);

      throw new AppError('Payment verification failed', 400);
    }

  } catch (error) {
    logger.error('Payment verification failed:', error);
    throw new AppError('Failed to verify payment', 500);
  }
});

// @desc    Get user payments
// @route   GET /api/payments/my-payments
// @access  Private/Student
const getMyPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let filter = { student: req.user._id };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.dateFrom) filter.createdAt = { $gte: new Date(req.query.dateFrom) };
  if (req.query.dateTo) {
    filter.createdAt = filter.createdAt || {};
    filter.createdAt.$lte = new Date(req.query.dateTo);
  }

  const payments = await Payment.find(filter)
    .populate('batch', 'name')
    .populate('course', 'title')
    .populate('teacher', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments(filter);
  const totalAmount = await Payment.aggregate([
    { $match: { student: req.user._id, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  res.json({
    success: true,
    data: {
      payments,
      summary: {
        totalPayments: total,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get teacher's earnings data
// @route   GET /api/payments/earnings
// @access  Private/Teacher
const getTeacherEarnings = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;

  // Get current month start and end
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Get lifetime earnings
  const lifetimeResult = await Payment.sum('teacherEarnings', {
    where: {
      teacherId,
      status: 'paid'
    }
  });
  const lifetimeEarnings = lifetimeResult || 0;

  // Get current month earnings
  const currentMonthResult = await Payment.sum('teacherEarnings', {
    where: {
      teacherId,
      status: 'paid',
      paidAt: {
        [Op.gte]: currentMonthStart,
        [Op.lte]: currentMonthEnd
      }
    }
  });
  const currentMonthEarnings = currentMonthResult || 0;

  // Get pending payouts (requested but not completed)
  const pendingPayoutsResult = await Payout.sum('amount', {
    where: {
      teacherId,
      status: { [Op.in]: ['requested', 'processing'] }
    }
  });
  const pendingPayouts = pendingPayoutsResult || 0;

  // Get completed payouts
  const completedPayoutsResult = await Payout.sum('amount', {
    where: {
      teacherId,
      status: 'completed'
    }
  });
  const completedPayouts = completedPayoutsResult || 0;

  // Calculate available for payout
  const availableForPayout = lifetimeEarnings - pendingPayouts - completedPayouts;

  // Get batch-wise earnings
  const batchEarnings = await Payment.findAll({
    where: {
      teacherId,
      status: 'paid'
    },
    attributes: [
      'batchId',
      [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'studentCount'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'grossRevenue'],
      [sequelize.fn('SUM', sequelize.col('teacherEarnings')), 'teacherShare']
    ],
    include: [
      {
        model: Batch,
        attributes: ['name']
      },
      {
        model: User,
        as: 'student',
        attributes: ['name']
      }
    ],
    group: ['batchId', 'Batch.id', 'Batch.name'],
    order: [[sequelize.fn('SUM', sequelize.col('teacherEarnings')), 'DESC']]
  });

  // Format batch earnings
  const formattedBatchEarnings = batchEarnings.map(be => ({
    batchName: be.Batch?.name || 'Unknown Batch',
    students: parseInt(be.get('studentCount')),
    source: 'platform', // Default to platform, can be enhanced later
    grossRevenue: parseFloat(be.get('grossRevenue')),
    teacherShare: parseFloat(be.get('teacherShare')),
    status: 'paid'
  }));

  // Get payout history
  const payoutHistory = await Payout.findAll({
    where: { teacherId },
    order: [['requestedAt', 'DESC']],
    limit: 10
  });

  res.json({
    success: true,
    data: {
      totals: {
        lifetime: Math.round(lifetimeEarnings),
        thisMonth: Math.round(currentMonthEarnings),
        pendingPayouts: Math.round(pendingPayouts),
        paidOut: Math.round(completedPayouts)
      },
      batchEarnings: formattedBatchEarnings,
      payoutHistory: payoutHistory.map(p => ({
        date: p.requestedAt,
        amount: parseFloat(p.amount),
        mode: p.paymentMethod,
        status: p.status,
        transactionId: p.transactionId
      }))
    }
  });
});

// @desc    Get teacher payments (legacy function)
// @route   GET /api/payments/teacher-payments
// @access  Private/Teacher
const getTeacherPayments = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;

  const payments = await Payment.findAll({
    where: {
      teacherId,
      status: 'paid'
    },
    include: [
      {
        model: Batch,
        attributes: ['name']
      },
      {
        model: User,
        as: 'student',
        attributes: ['name']
      }
    ],
    order: [['paidAt', 'DESC']],
    limit: 20
  });

  res.json({
    success: true,
    data: payments.map(p => ({
      id: p.id,
      batchName: p.Batch?.name || 'Unknown',
      amount: parseFloat(p.teacherEarnings),
      date: p.paidAt,
      status: 'paid'
    }))
  });
});

// @desc    Request payout
// @route   POST /api/payments/request-payout
// @access  Private/Teacher
const requestPayout = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 1000) {
    throw new AppError('Minimum payout amount is ₹1000', 400);
  }

  if (amount > req.user.availableForPayout) {
    throw new AppError('Insufficient balance for payout', 400);
  }

  // Create payout request notification (admin approval needed)
  await Notification.create({
    title: 'Payout Request',
    message: `₹${amount} payout request submitted. Admin approval required.`,
    recipient: req.user._id,
    type: 'payment_reminder',
    category: 'financial',
    priority: 'high',
    channels: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    },
    metadata: {
      amount,
      type: 'payout_request'
    }
  });

  // Notify admins
  const admins = await User.findAll({ 
    where: { role: 'admin', isActive: true },
    attributes: ['id', 'name', 'email'] 
  });
  for (const admin of admins) {
    await Notification.create({
      title: 'New Payout Request',
      message: `${req.user.name} has requested a payout of ₹${amount}.`,
      recipientId: admin.id,
      senderId: req.user.id,
      type: 'payment_reminder',
      category: 'financial',
      priority: 'high',
      channels: {
        email: true,
        push: true,
        sms: false,
        inApp: true
      },
      metadata: {
        teacherId: req.user._id,
        teacherName: req.user.name,
        amount,
        type: 'payout_request'
      }
    });
  }

  logger.info(`Payout request: ₹${amount} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Payout request submitted successfully. Admin approval required.',
    data: {
      amount,
      status: 'pending_approval',
      estimatedProcessingTime: '2-3 business days'
    }
  });
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private/Admin
const getPaymentStats = asyncHandler(async (req, res) => {
  const { period = 'monthly', dateFrom, dateTo } = req.query;

  let matchConditions = { status: 'paid' };

  if (dateFrom || dateTo) {
    matchConditions.createdAt = {};
    if (dateFrom) matchConditions.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchConditions.createdAt.$lte = new Date(dateTo);
  }

  const stats = await Payment.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          source: '$source'
        },
        totalAmount: { $sum: '$amount' },
        totalPlatformFee: { $sum: '$platformFee' },
        totalTeacherEarnings: { $sum: '$teacherEarnings' },
        paymentCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    }
  ]);

  // Calculate overall stats
  const overallStats = await Payment.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalPlatformEarnings: { $sum: '$platformFee' },
        totalTeacherEarnings: { $sum: '$teacherEarnings' },
        totalPayments: { $sum: 1 },
        averagePayment: { $avg: '$amount' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      periodStats: stats,
      overallStats: overallStats.length > 0 ? overallStats[0] : {
        totalRevenue: 0,
        totalPlatformEarnings: 0,
        totalTeacherEarnings: 0,
        totalPayments: 0,
        averagePayment: 0
      }
    }
  });
});

// @desc    Process refund
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
const processRefund = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (payment.status !== 'paid') {
    throw new AppError('Only paid payments can be refunded', 400);
  }

  await payment.refund(amount, reason);

  // Create notifications
  await Notification.create({
    title: 'Refund Processed',
    message: `₹${amount} has been refunded for your course enrollment.`,
    recipient: payment.student,
    type: 'payment_received',
    category: 'financial',
    priority: 'medium',
    relatedPayment: payment._id,
    channels: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  });

  await Notification.create({
    title: 'Refund Processed',
    message: `₹${amount} has been refunded to ${req.user.name} for batch "${payment.batch.name}".`,
    recipient: payment.teacher,
    type: 'payment_received',
    category: 'financial',
    priority: 'medium',
    relatedPayment: payment._id,
    channels: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  });

  logger.info(`Refund processed: ₹${amount} for payment ${payment._id} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: { payment }
  });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('student', 'name email')
    .populate('teacher', 'name email')
    .populate('batch', 'name')
    .populate('course', 'title');

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Check authorization
  if (req.user.role === 'student' && payment.student._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this payment', 403);
  }

  if (req.user.role === 'teacher' && payment.teacher._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this payment', 403);
  }

  res.json({
    success: true,
    data: { payment }
  });
});

// @desc    Update payment status (Admin only)
// @route   PUT /api/payments/:id/status
// @access  Private/Admin
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  const oldStatus = payment.status;
  payment.status = status;

  if (status === 'failed' && reason) {
    payment.failureReason = reason;
    payment.failedAt = new Date();
  }

  await payment.save();

  // Create notifications based on status change
  if (status === 'failed') {
    await Notification.create({
      title: 'Payment Failed',
      message: `Your payment of ₹${payment.amount} has failed. ${reason || 'Please try again.'}`,
      recipient: payment.student,
      type: 'payment_received',
      category: 'financial',
      priority: 'high',
      relatedPayment: payment._id,
      channels: {
        email: true,
        push: true,
        sms: false,
        inApp: true
      }
    });
  }

  logger.info(`Payment ${payment._id} status updated from ${oldStatus} to ${status} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Payment status updated successfully',
    data: { payment }
  });
});

// @desc    Retry failed payment
// @route   POST /api/payments/:id/retry
// @access  Private/Admin
const retryPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email', 'phone'] },
      { model: Course, attributes: ['id', 'title', 'price'] },
      { model: Batch, attributes: ['id', 'name'] }
    ]
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Only allow retry for failed payments
  if (payment.status !== 'failed') {
    throw new AppError('Only failed payments can be retried', 400);
  }

  // Reset payment status to created
  payment.status = 'created';
  payment.failureReason = null;
  payment.failedAt = null;
  await payment.save();

  // Create notification for user
  await Notification.create({
    title: 'Payment Retry Initiated',
    message: `Your payment of ₹${payment.amount} for ${payment.Course?.title || 'course'} is being retried. Please complete the payment.`,
    recipient: payment.studentId,
    type: 'payment_received',
    category: 'financial',
    priority: 'high',
    relatedPayment: payment.id,
    channels: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  });

  logger.info(`Payment retry initiated: ${payment.id} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Payment retry initiated successfully. User will be notified.',
    data: { 
      payment: {
        id: String(payment.id),
        status: payment.status,
        amount: Number(payment.amount),
        transactionId: payment.cashfreeOrderId || payment.razorpayOrderId || `txn_${payment.id}`
      }
    }
  });
});

// @desc    Get EMI plans for a course amount
// @route   GET /api/payments/emi-plans?amount=X
// @access  Private
const getEMIPlans = asyncHandler(async (req, res) => {
  const { amount } = req.query;

  if (!amount || isNaN(amount)) {
    throw new AppError('Valid amount is required', 400);
  }

  const baseAmount = parseFloat(amount);

  // Define EMI plans with different tenures
  const plans = [
    {
      id: 'emi_3m',
      months: 3,
      interestRate: 0, // No interest for 3 months
      processingFee: 99,
      downPaymentPercentage: 10,
      isPopular: false,
    },
    {
      id: 'emi_6m',
      months: 6,
      interestRate: 8,
      processingFee: 199,
      downPaymentPercentage: 15,
      isPopular: true, // Most popular
    },
    {
      id: 'emi_9m',
      months: 9,
      interestRate: 10,
      processingFee: 299,
      downPaymentPercentage: 20,
      isPopular: false,
    },
    {
      id: 'emi_12m',
      months: 12,
      interestRate: 12,
      processingFee: 399,
      downPaymentPercentage: 25,
      isPopular: false,
    },
  ];

  // Calculate EMI details for each plan
  const emiPlans = plans.map(plan => {
    const downPayment = Math.round((baseAmount * plan.downPaymentPercentage) / 100);
    const principalAmount = baseAmount - downPayment;
    const totalInterest = Math.round((principalAmount * plan.interestRate) / 100);
    const totalAmount = baseAmount + totalInterest + plan.processingFee;
    const monthlyAmount = Math.round((principalAmount + totalInterest) / plan.months);

    // Calculate savings (if any) compared to base amount
    const savings = plan.interestRate === 0 ? plan.processingFee * 2 : 0;

    return {
      id: plan.id,
      months: plan.months,
      monthlyAmount,
      processingFee: plan.processingFee,
      totalAmount,
      interestRate: plan.interestRate,
      downPayment,
      isPopular: plan.isPopular,
      savings: savings > 0 ? savings : null,
    };
  });

  res.status(200).json({
    success: true,
    plans: emiPlans,
    baseAmount,
  });
});

// @desc    Enroll in EMI plan
// @route   POST /api/payments/enroll-emi
// @access  Private
const enrollEMI = asyncHandler(async (req, res) => {
  const { courseId, planId, acceptedTerms } = req.body;
  const userId = req.user.id;

  if (!courseId || !planId) {
    throw new AppError('Course ID and Plan ID are required', 400);
  }

  if (!acceptedTerms) {
    throw new AppError('You must accept the terms and conditions', 400);
  }

  // Verify course exists
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check if user already enrolled
  const existingEnrollment = await Payment.findOne({
    where: {
      student_id: userId,
      course_id: courseId,
      payment_type: 'emi',
      status: { [Op.in]: ['paid', 'created', 'pending'] },
    },
  });

  if (existingEnrollment) {
    throw new AppError('You are already enrolled in this course with EMI', 400);
  }

  // Define plan details (same as getEMIPlans)
  const planDetails = {
    emi_3m: { months: 3, interestRate: 0, processingFee: 99, downPaymentPercentage: 10 },
    emi_6m: { months: 6, interestRate: 8, processingFee: 199, downPaymentPercentage: 15 },
    emi_9m: { months: 9, interestRate: 10, processingFee: 299, downPaymentPercentage: 20 },
    emi_12m: { months: 12, interestRate: 12, processingFee: 399, downPaymentPercentage: 25 },
  };

  const plan = planDetails[planId];
  if (!plan) {
    throw new AppError('Invalid EMI plan selected', 400);
  }

  // Calculate EMI details
  const baseAmount = parseFloat(course.price);
  const downPayment = Math.round((baseAmount * plan.downPaymentPercentage) / 100);
  const principalAmount = baseAmount - downPayment;
  const totalInterest = Math.round((principalAmount * plan.interestRate) / 100);
  const totalAmount = baseAmount + totalInterest + plan.processingFee;
  const monthlyAmount = Math.round((principalAmount + totalInterest) / plan.months);

  // Create payment record for down payment + processing fee
  const initialPaymentAmount = downPayment + plan.processingFee;

  // Create Cashfree order for initial payment
  const orderId = `EMI_${Date.now()}_${userId}`;
  const orderData = {
    order_id: orderId,
    order_amount: initialPaymentAmount,
    order_currency: 'INR',
    customer_details: {
      customer_id: String(userId),
      customer_name: req.user.name,
      customer_email: req.user.email,
      customer_phone: req.user.phone || '9999999999',
    },
    order_meta: {
      return_url: `${process.env.FRONTEND_URL}/payment/callback`,
      notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
    },
  };

  let cashfreeOrder;
  try {
    cashfreeOrder = await cashfree.createOrder(orderData);
  } catch (error) {
    logger.error('Cashfree order creation failed:', error);
    throw new AppError('Failed to create payment order', 500);
  }

  // Create payment record with EMI details
  const payment = await Payment.create({
    student_id: userId,
    course_id: courseId,
    amount: initialPaymentAmount,
    payment_type: 'emi',
    payment_method: 'cashfree',
    status: 'created',
    cashfreeOrderId: orderId,
    metadata: {
      emi_plan: planId,
      emi_months: plan.months,
      emi_monthly_amount: monthlyAmount,
      emi_total_amount: totalAmount,
      emi_down_payment: downPayment,
      emi_processing_fee: plan.processingFee,
      emi_interest_rate: plan.interestRate,
      emi_principal: principalAmount,
      emi_accepted_terms: acceptedTerms,
      emi_start_date: null, // Set after first payment
      emi_next_due_date: null,
    },
  });

  // Send notification to user
  await Notification.create({
    user_id: userId,
    title: 'EMI Enrollment Initiated',
    message: `Your EMI enrollment for ${course.title} has been initiated. Please complete the down payment of ₹${downPayment} + processing fee ₹${plan.processingFee}.`,
    type: 'payment',
    priority: 'high',
    data: {
      paymentId: payment.id,
      courseId: course.id,
      amount: initialPaymentAmount,
    },
  });

  logger.info(`EMI enrollment created: ${payment.id} for user ${userId}`);

  res.status(201).json({
    success: true,
    message: 'EMI enrollment initiated successfully',
    enrollmentId: payment.id,
    paymentUrl: cashfreeOrder.payment_link,
    data: {
      payment: {
        id: String(payment.id),
        amount: initialPaymentAmount,
        downPayment,
        processingFee: plan.processingFee,
        monthlyAmount,
        months: plan.months,
        totalAmount,
      },
      cashfreeOrder: {
        orderId: cashfreeOrder.order_id,
        paymentSessionId: cashfreeOrder.payment_session_id,
        paymentLink: cashfreeOrder.payment_link,
      },
    },
  });
});



module.exports = {
  getAllPayments,
  createOrder,
  verifyPayment,
  getMyPayments,
  getTeacherPayments,
  requestPayout,
  getPaymentStats,
  processRefund,
  getPayment,
  updatePaymentStatus,
  retryPayment,
  getEMIPlans,
  enrollEMI,
  getTeacherEarnings,
};
