const Payout = require('../models/Payout');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Revenue = require('../models/Revenue');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const cashfreePayoutService = require('../services/cashfreePayoutService');
const fcmService = require('../services/fcmService');

// @desc    Get all payout requests (Admin)
// @route   GET /api/payouts
// @access  Private/Admin
const getAllPayouts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = (page - 1) * limit;
  const status = req.query.status;

  const where = {};
  if (status && status !== 'all') {
    where.status = status;
  }

  const { rows: payouts, count } = await Payout.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['requestedAt', 'DESC']],
    limit,
    offset
  });

  // Calculate stats
  const stats = {
    total: await Payout.count(),
    pending: await Payout.count({ where: { status: 'requested' } }),
    processing: await Payout.count({ where: { status: 'processing' } }),
    completed: await Payout.count({ where: { status: 'completed' } }),
    rejected: await Payout.count({ where: { status: 'rejected' } }),
    totalProcessed: Math.round(await Payout.sum('amount', { where: { status: 'completed' } }) || 0),
    totalPending: Math.round(await Payout.sum('amount', { where: { status: 'requested' } }) || 0),
    avgPayout: 0
  };

  const completedPayouts = await Payout.findAll({
    where: { status: 'completed' },
    attributes: ['amount']
  });

  if (completedPayouts.length > 0) {
    const total = completedPayouts.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    stats.avgPayout = Math.round(total / completedPayouts.length);
  }

  // Format payouts for frontend
  const formattedPayouts = payouts.map(p => ({
    id: p.id,
    teacherId: p.teacherId,
    teacher: {
      id: p.teacher?.id,
      name: p.teacher?.name || 'Unknown',
      email: p.teacher?.email || 'N/A'
    },
    amount: parseFloat(p.amount),
    status: p.status,
    paymentMethod: p.paymentMethod,
    paymentDetails: p.paymentDetails ? JSON.parse(p.paymentDetails) : {},
    transactionId: p.transactionId,
    note: p.note,
    rejectionReason: p.rejectionReason,
    requestedAt: p.requestedAt,
    processedAt: p.processedAt,
    completedAt: p.completedAt,
    rejectedAt: p.rejectedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }));

  res.json({
    success: true,
    data: {
      payouts: formattedPayouts,
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

// @desc    Get teacher's payout requests
// @route   GET /api/payouts/my-payouts
// @access  Private/Teacher
const getMyPayouts = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;

  const payouts = await Payout.findAll({
    where: { teacherId },
    order: [['requestedAt', 'DESC']]
  });

  // Calculate teacher's available balance
  const revenues = await Revenue.findAll({
    where: {
      teacherId,
      status: 'confirmed'
    },
  // select teacher_share column and expose as teacherShare on model
  attributes: [['teacher_share', 'teacherShare']]
  });

  // Sum up teacher share (Revenue model uses teacherShare -> DB field teacher_share)
  const totalEarned = revenues.reduce((sum, r) => {
    const amt = r && (r.teacherShare !== undefined && r.teacherShare !== null) ? parseFloat(r.teacherShare) : 0;
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);
  const totalWithdrawn = await Payout.sum('amount', {
    where: {
      teacherId,
      status: ['completed', 'processing']
    }
  }) || 0;

  const availableBalance = totalEarned - totalWithdrawn;

  res.json({
    success: true,
    data: {
      payouts,
      balance: {
        totalEarned: Math.round(totalEarned),
        totalWithdrawn: Math.round(totalWithdrawn),
        available: Math.round(availableBalance)
      }
    }
  });
});

// @desc    Request payout (Teacher)
// @route   POST /api/payments/payouts
// @access  Private/Teacher
const requestPayout = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, paymentDetails, note } = req.body;
  const teacherId = req.user.id;

  // Validate amount
  if (!amount || amount < 1000) {
    throw new AppError('Minimum payout amount is ₹1000', 400);
  }

  // Calculate available balance from Payment model
  const totalEarnedResult = await Payment.sum('teacher_earnings', {
    where: {
      teacher_id: teacherId,
      status: 'paid'
    }
  });
  const totalEarned = totalEarnedResult || 0;

  const totalWithdrawnResult = await Payout.sum('amount', {
    where: {
      teacher_id: teacherId,
      status: { [Op.in]: ['completed', 'processing', 'requested'] }
    }
  });
  const totalWithdrawn = totalWithdrawnResult || 0;

  const availableBalance = totalEarned - totalWithdrawn;

  if (amount > availableBalance) {
    throw new AppError(`Insufficient balance. Available: ₹${Math.round(availableBalance)}`, 400);
  }

  // Create payout request in DB
  const payout = await Payout.create({
    teacher_id: teacherId,
    amount,
    payment_method: paymentMethod,
    payment_details: JSON.stringify(paymentDetails),
    note,
    status: 'requested'
  });

  try {
    // Trigger Cashfree Payouts API
    const result = await cashfreePayoutService.processPayout({
      payoutId: payout.id,
      teacherId: teacherId,
      teacherName: req.user.name,
      teacherEmail: req.user.email,
      teacherPhone: req.user.phone || '9999999999',
      amount: parseFloat(amount),
      bankAccount: paymentDetails.accountNumber,
      ifsc: paymentDetails.ifscCode,
      address: paymentDetails.address || 'N/A',
      city: paymentDetails.city || 'N/A',
      state: paymentDetails.state || 'N/A',
      pincode: paymentDetails.pincode || '000000'
    });

    // Update payout with Cashfree transaction ID
    await payout.update({
      status: 'processing',
      transfer_id: result.referenceId,
      processed_at: new Date(),
      metadata: JSON.stringify({
        cashfree: result.data,
        initiatedAt: new Date()
      })
    });

    // Send success notification
    try {
      await fcmService.sendToUser(teacherId, {
        title: 'Payout Initiated',
        body: `Your payout request of ₹${amount} has been initiated. Processing may take 1-2 business days.`,
        data: {
          type: 'payout_initiated',
          payoutId: payout.id.toString(),
          amount: amount.toString()
        }
      });
    } catch (notifError) {
      logger.warn('Failed to send payout initiated notification:', notifError);
    }

    logger.info(`Payout initiated via Cashfree: ₹${amount} by teacher ${teacherId}, ref: ${result.referenceId}`);

    res.status(201).json({
      success: true,
      message: 'Payout request submitted and initiated via Cashfree',
      data: {
        payout: {
          id: payout.id,
          amount: payout.amount,
          status: payout.status,
          transferId: result.referenceId,
          requestedAt: payout.requested_at
        },
        cashfreeStatus: result.status
      }
    });
  } catch (cashfreeError) {
    logger.error('Cashfree payout failed:', cashfreeError);

    // Update payout status to failed
    await payout.update({
      status: 'rejected',
      rejected_at: new Date(),
      rejection_reason: `Cashfree error: ${cashfreeError.message}`,
      metadata: JSON.stringify({
        error: cashfreeError.message,
        failedAt: new Date()
      })
    });

    throw new AppError(`Payout failed: ${cashfreeError.message}`, 500);
  }
});

// @desc    Approve payout (Admin)
// @route   POST /api/payouts/:id/approve
// @access  Private/Admin
const approvePayout = asyncHandler(async (req, res) => {
  const { transactionId, note } = req.body;
  const payout = await Payout.findByPk(req.params.id, {
    include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
  });

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  if (payout.status !== 'requested') {
    throw new AppError('Only requested payouts can be approved', 400);
  }

  payout.status = 'processing';
  payout.processedAt = new Date();
  payout.note = note || payout.note;
  await payout.save();

  // Send notification to teacher via FCM
  try {
    await fcmService.sendPayoutApprovedNotification(
      payout.teacherId,
      payout.amount,
      payout.id
    );
  } catch (notifError) {
    logger.warn('Failed to send payout approved notification:', notifError);
  }

  logger.info(`Payout approved: ${payout.id} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Payout approved and processing',
    data: { payout }
  });
});

// @desc    Complete payout (Admin)
// @route   POST /api/payouts/:id/complete
// @access  Private/Admin
const completePayout = asyncHandler(async (req, res) => {
  const { transactionId, note } = req.body;
  
  if (!transactionId) {
    throw new AppError('Transaction ID is required', 400);
  }

  const payout = await Payout.findByPk(req.params.id, {
    include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
  });

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  if (payout.status !== 'processing' && payout.status !== 'requested') {
    throw new AppError('Only processing/requested payouts can be completed', 400);
  }

  payout.status = 'completed';
  payout.transactionId = transactionId;
  payout.completedAt = new Date();
  payout.processedAt = payout.processedAt || new Date();
  payout.note = note || payout.note;
  await payout.save();

  // Create notification for teacher
  await Notification.create({
    title: 'Payout Completed',
    message: `Your payout of ₹${payout.amount} has been completed. Transaction ID: ${transactionId}`,
    recipient: payout.teacherId,
    type: 'payout_completed',
    category: 'financial',
    priority: 'high',
    relatedPayout: payout.id,
    channels: {
      email: true,
      push: true,
      sms: true,
      inApp: true
    }
  });

  // Send FCM notification
  try {
    await fcmService.sendToUser(payout.teacherId, {
      title: 'Payout Completed',
      body: `Your payout of ₹${payout.amount} has been completed. Transaction ID: ${transactionId}`,
      data: {
        type: 'payout_completed',
        payoutId: payout.id.toString(),
        amount: payout.amount.toString()
      }
    });
  } catch (error) {
    logger.error('FCM notification failed for completed payout:', error);
  }

  logger.info(`Payout completed: ${payout.id} by admin ${req.user.email}, txn: ${transactionId}`);

  res.json({
    success: true,
    message: 'Payout completed successfully',
    data: { payout }
  });
});

// @desc    Reject payout (Admin)
// @route   POST /api/payouts/:id/reject
// @access  Private/Admin
const rejectPayout = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    throw new AppError('Rejection reason must be at least 10 characters', 400);
  }

  const payout = await Payout.findByPk(req.params.id, {
    include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
  });

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  if (payout.status !== 'requested') {
    throw new AppError('Only requested payouts can be rejected', 400);
  }

  payout.status = 'rejected';
  payout.rejectionReason = reason;
  payout.rejectedAt = new Date();
  await payout.save();

  // Create notification for teacher
  await Notification.create({
    title: 'Payout Rejected',
    message: `Your payout request of ₹${payout.amount} has been rejected. Reason: ${reason}`,
    recipient: payout.teacherId,
    type: 'payout_rejected',
    category: 'financial',
    priority: 'high',
    relatedPayout: payout.id,
    channels: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  });

  // Send FCM notification
  try {
    await fcmService.sendToUser(payout.teacherId, {
      title: 'Payout Rejected',
      body: `Your payout request of ₹${payout.amount} has been rejected. Reason: ${reason}`,
      data: {
        type: 'payout_rejected',
        payoutId: payout.id.toString(),
        amount: payout.amount.toString()
      }
    });
  } catch (error) {
    logger.error('FCM notification failed for rejected payout:', error);
  }

  logger.info(`Payout rejected: ${payout.id} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Payout rejected',
    data: { payout }
  });
});

// @desc    Get payout by ID
// @route   GET /api/payouts/:id
// @access  Private
const getPayoutById = asyncHandler(async (req, res) => {
  const payout = await Payout.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  // Check authorization
  if (req.user.role === 'teacher' && payout.teacherId !== req.user.id) {
    throw new AppError('Not authorized to view this payout', 403);
  }

  const formattedPayout = {
    id: payout.id,
    teacherId: payout.teacherId,
    teacher: {
      id: payout.teacher?.id,
      name: payout.teacher?.name || 'Unknown',
      email: payout.teacher?.email || 'N/A'
    },
    amount: parseFloat(payout.amount),
    status: payout.status,
    paymentMethod: payout.paymentMethod,
    paymentDetails: payout.paymentDetails ? JSON.parse(payout.paymentDetails) : {},
    transactionId: payout.transactionId,
    note: payout.note,
    rejectionReason: payout.rejectionReason,
    requestedAt: payout.requestedAt,
    processedAt: payout.processedAt,
    completedAt: payout.completedAt,
    rejectedAt: payout.rejectedAt,
    createdAt: payout.createdAt,
    updatedAt: payout.updatedAt
  };

  res.json({
    success: true,
    data: { payout: formattedPayout }
  });
});

// @desc    Get teacher's earnings summary
// @route   GET /api/payouts/earnings/summary
// @access  Private/Teacher
const getEarningsSummary = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;
  try {
  // Get all revenues for teacher (defensive: some associations may be missing)
  let revenues = [];
  try {
    revenues = await Revenue.findAll({
      where: { teacherId },
      include: [
        {
          model: Payment,
          as: 'payment',
          attributes: ['amount', 'status', 'created_at'],
          include: [
            { model: User, as: 'student', attributes: ['name'] },
            { model: Course, as: 'course', attributes: ['title'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  } catch (err) {
    // If eager-loading fails due to missing associations, fallback to a safer query
    logger.warn('Revenue.findAll with includes failed, falling back to safe query: ', err.message || err);
    // Fallback: select teacher_share (uses model alias teacherShare)
    revenues = await Revenue.findAll({
      where: { teacherId },
      attributes: ['id', ['teacher_share', 'teacherShare'], 'created_at'],
      order: [['created_at', 'DESC']]
    });
  }

  const totalEarned = revenues.reduce((sum, r) => {
    // r.teacherShare might be string or undefined; guard conversion
    const amt = r && (r.teacherShare !== undefined && r.teacherShare !== null) ? parseFloat(r.teacherShare) : 0;
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  // Get payout history
  const payouts = await Payout.findAll({
    where: { teacherId },
    order: [['requestedAt', 'DESC']],
    limit: 10
  });

  const totalWithdrawn = await Payout.sum('amount', {
    where: {
      teacherId,
      status: ['completed']
    }
  }) || 0;

  const pendingPayouts = await Payout.sum('amount', {
    where: {
      teacherId,
      status: ['requested', 'processing']
    }
  }) || 0;

  const availableBalance = totalEarned - totalWithdrawn - pendingPayouts;

  // Monthly earnings (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Use DB-dialect aware function for month grouping — DATE_FORMAT (MySQL) vs strftime (SQLite)
  const isSQLite = sequelize.getDialect && sequelize.getDialect() === 'sqlite';
  const monthFn = isSQLite
    ? sequelize.fn('strftime', '%Y-%m', sequelize.col('created_at'))
    : sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m');

  const monthlyRevenues = await Revenue.findAll({
    where: {
      teacherId,
      created_at: { [Op.gte]: sixMonthsAgo }
    },
    attributes: [
      [monthFn, 'month'],
      [sequelize.fn('SUM', sequelize.col('teacher_share')), 'amount']
    ],
    group: [monthFn],
    order: [[monthFn, 'ASC']]
  });

  res.json({
    success: true,
    data: {
      balance: {
        totalEarned: Math.round(totalEarned),
        totalWithdrawn: Math.round(totalWithdrawn),
        pending: Math.round(pendingPayouts),
        available: Math.round(availableBalance)
      },
      recentPayouts: payouts,
      monthlyEarnings: monthlyRevenues.map(r => ({
        month: r.get('month'),
        amount: Math.round(parseFloat(r.get('amount')))
      }))
    }
  });
  } catch (err) {
    logger.error('Failed to compute earnings summary:', err);
    // Return a friendly partial response instead of 500
    return res.status(200).json({
      success: false,
      message: err && err.message ? err.message : 'Failed to compute earnings summary',
      data: {
        balance: {
          totalEarned: 0,
          totalWithdrawn: 0,
          pending: 0,
          available: 0
        },
        recentPayouts: [],
        monthlyEarnings: []
      }
    });
  }
});

module.exports = {
  getAllPayouts,
  getMyPayouts,
  requestPayout,
  approvePayout,
  completePayout,
  rejectPayout,
  getPayoutById,
  getEarningsSummary
};

// ==================== ENHANCED PAYOUT FUNCTIONS ====================

/**
 * Process payout via Cashfree
 */
const processPayoutViaCashfree = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const payout = await Payout.findByPk(id, {
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'email', 'phone']
      }
    ]
  });

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  if (payout.status !== 'approved' && payout.status !== 'processing') {
    throw new AppError('Payout must be approved before processing', 400);
  }

  try {
    const paymentDetails = JSON.parse(payout.paymentDetails);
    
    // Process payout via Cashfree
    const result = await cashfreePayoutService.processPayout({
      payoutId: payout.id,
      teacherId: payout.teacherId,
      teacherName: payout.teacher.name,
      teacherEmail: payout.teacher.email,
      teacherPhone: payout.teacher.phone,
      amount: parseFloat(payout.amount),
      bankAccount: paymentDetails.accountNumber,
      ifsc: paymentDetails.ifscCode,
      address: paymentDetails.address,
      city: paymentDetails.city,
      state: paymentDetails.state,
      pincode: paymentDetails.pincode
    });

    // Update payout with Cashfree details
    await payout.update({
      status: 'processing',
      transactionId: result.referenceId,
      metadata: JSON.stringify({
        cashfree: result.data,
        processedAt: new Date()
      })
    });

    // Send notification
    try {
      await fcmService.sendPayoutApprovedNotification(
        payout.teacherId,
        payout.amount,
        payout.id
      );
    } catch (notifError) {
      logger.warn('Failed to send notification:', notifError);
    }

    logger.info(`Payout processed via Cashfree: ${payout.id}`);

    res.json({
      success: true,
      message: 'Payout initiated via Cashfree',
      data: {
        payout,
        cashfreeStatus: result.status,
        referenceId: result.referenceId
      }
    });
  } catch (error) {
    logger.error('Cashfree payout failed:', error);
    
    // Update payout status to failed
    await payout.update({
      note: `Cashfree error: ${error.message}`,
      metadata: JSON.stringify({
        error: error.message,
        failedAt: new Date()
      })
    });

    throw new AppError(`Payout processing failed: ${error.message}`, 500);
  }
});

/**
 * Check payout status from Cashfree
 */
const checkPayoutStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const payout = await Payout.findByPk(id);

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  if (!payout.transactionId) {
    return res.json({
      success: true,
      message: 'Payout not yet processed',
      data: { status: payout.status }
    });
  }

  try {
    const status = await cashfreePayoutService.getTransferStatus(payout.id, payout.transactionId);
    
    // Update payout if status changed
    if (status.status === 'SUCCESS' && payout.status !== 'completed') {
      await payout.update({
        status: 'completed',
        completedAt: new Date(),
        metadata: JSON.stringify({
          ...(payout.metadata ? JSON.parse(payout.metadata) : {}),
          cashfreeStatus: status.data,
          completedAt: new Date()
        })
      });

      // Send completion notification
      try {
        await fcmService.sendPayoutCompletedNotification(
          payout.teacherId,
          payout.amount,
          status.utr || payout.transactionId
        );
      } catch (notifError) {
        logger.warn('Failed to send completion notification:', notifError);
      }
    }

    res.json({
      success: true,
      data: {
        payoutId: payout.id,
        status: status.status,
        utr: status.utr,
        acknowledged: status.acknowledged,
        details: status.data
      }
    });
  } catch (error) {
    logger.error('Failed to check payout status:', error);
    throw new AppError('Failed to check payout status', 500);
  }
});

/**
 * Validate bank account before payout
 */
const validateBankAccount = asyncHandler(async (req, res) => {
  const { name, phone, accountNumber, ifscCode } = req.body;

  if (!name || !phone || !accountNumber || !ifscCode) {
    throw new AppError('All fields are required', 400);
  }

  try {
    const result = await cashfreePayoutService.validateBankAccount(
      name,
      phone,
      accountNumber,
      ifscCode
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Bank account validation failed:', error);
    throw new AppError('Validation failed', 500);
  }
});

/**
 * Get Cashfree wallet balance (Admin)
 */
const getCashfreeBalance = asyncHandler(async (req, res) => {
  try {
    const balance = await cashfreePayoutService.getBalance();

    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    logger.error('Failed to get Cashfree balance:', error);
    throw new AppError('Failed to get balance', 500);
  }
});

/**
 * Handle Cashfree payout webhook
 */
const handleCashfreeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const rawBody = JSON.stringify(req.body);

  // Verify Cashfree signature
  const isValidSignature = verifyCashfreeSignature(rawBody, signature);
  if (!isValidSignature) {
    logger.error('Invalid Cashfree webhook signature');
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  const { event, data } = req.body;

  if (event === 'PAYOUT_SUCCESS' || event === 'PAYOUT_FAILED') {
    const { referenceId, utr, status } = data;

    // Find payout by transactionId (referenceId)
    const payout = await Payout.findOne({
      where: { transactionId: referenceId }
    });

    if (!payout) {
      logger.error(`Payout not found for referenceId: ${referenceId}`);
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    // Update payout status
    if (status === 'SUCCESS') {
      await payout.update({
        status: 'completed',
        completedAt: new Date(),
        metadata: JSON.stringify({
          ...(payout.metadata ? JSON.parse(payout.metadata) : {}),
          webhookData: data,
          completedAt: new Date()
        })
      });

      // Send notification to teacher
      try {
        await fcmService.sendPayoutCompletedNotification(
          payout.teacherId,
          payout.amount,
          utr || referenceId
        );
      } catch (notifError) {
        logger.warn('Failed to send completion notification:', notifError);
      }
    } else if (status === 'FAILED') {
      await payout.update({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: 'Payment failed by bank',
        metadata: JSON.stringify({
          ...(payout.metadata ? JSON.parse(payout.metadata) : {}),
          webhookData: data,
          failedAt: new Date()
        })
      });

      // Send notification to teacher
      try {
        await fcmService.sendToUser(payout.teacherId, {
          title: 'Payout Failed',
          body: `Your payout of ₹${payout.amount} has failed. Please contact support.`,
          data: {
            type: 'payout_failed',
            payoutId: payout.id.toString(),
            amount: payout.amount.toString()
          }
        });
      } catch (notifError) {
        logger.warn('Failed to send failure notification:', notifError);
      }
    }

    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`teacher-${payout.teacherId}`).emit('payout-update', {
        payoutId: payout.id,
        status: payout.status,
        amount: payout.amount,
        timestamp: new Date()
      });
    }

    logger.info(`Payout webhook processed: ${payout.id}, status: ${status}`);
  }

  res.json({ success: true, message: 'Webhook processed' });
});

/**
 * Verify Cashfree webhook signature
 */
function verifyCashfreeSignature(rawBody, signature) {
  const crypto = require('crypto');
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;

  if (!secret) {
    logger.error('CASHFREE_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return signature === expectedSignature;
}

// Export enhanced functions
module.exports = {
  getAllPayouts,
  getMyPayouts,
  requestPayout,
  approvePayout,
  completePayout,
  rejectPayout,
  getPayoutById,
  getEarningsSummary,
  processPayoutViaCashfree,
  checkPayoutStatus,
  validateBankAccount,
  getCashfreeBalance,
  handleCashfreeWebhook
};
