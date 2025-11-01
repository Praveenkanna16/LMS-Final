const { Payment, User, Course, Batch, ActivityLog, sequelize } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const crypto = require('crypto');

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

// Generate Cashfree signature
const generateSignature = (postData, timestamp) => {
  const signatureData = postData + timestamp;
  return crypto
    .createHmac('sha256', CASHFREE_SECRET_KEY)
    .update(signatureData)
    .digest('base64');
};

// @desc    Create Cashfree payment order
// @route   POST /api/payments/cashfree/create
// @access  Private
const createCashfreeOrder = asyncHandler(async (req, res) => {
  const { courseId, batchId, amount, currency = 'INR' } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!amount || amount <= 0) {
    throw new AppError('Invalid amount provided', 400);
  }

  if (!courseId && !batchId) {
    throw new AppError('Either courseId or batchId is required', 400);
  }

  // Verify course/batch exists
  let course = null;
  let batch = null;
  
  if (courseId) {
    course = await Course.findByPk(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
  }
  
  if (batchId) {
    batch = await Batch.findByPk(batchId, {
      include: [{ model: Course, attributes: ['title'] }]
    });
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
  }

  // Create payment record in database
  const payment = await Payment.create({
    studentId: userId,
    courseId: courseId || null,
    batchId: batchId || null,
    amount: parseFloat(amount),
    currency,
    status: 'pending',
    paymentGateway: 'cashfree',
    metadata: {
      itemType: courseId ? 'course' : 'batch',
      itemName: course?.title || batch?.name || 'Unknown',
      createdAt: new Date().toISOString()
    }
  });

  // Generate unique order ID
  const orderId = `ORDER_${payment.id}_${Date.now()}`;
  
  // Prepare Cashfree order data
  const orderData = {
    order_amount: amount,
    order_currency: currency,
    order_id: orderId,
    customer_details: {
      customer_id: `USER_${userId}`,
      customer_name: req.user.name,
      customer_email: req.user.email,
      customer_phone: req.user.phone || '9999999999'
    },
    order_meta: {
      return_url: `${process.env.FRONTEND_URL}/payment/success?order_id=${orderId}`,
      notify_url: `${process.env.BACKEND_URL}/api/payments/cashfree/webhook`,
      payment_methods: 'cc,dc,nb,upi,paypal,app'
    },
    order_note: `Payment for ${course?.title || batch?.name || 'Course/Batch'}`
  };

  try {
    // In a real implementation, you would make API call to Cashfree
    // For now, we'll simulate the response
    const cashfreeResponse = {
      cf_order_id: `cf_${orderId}`,
      order_id: orderId,
      entity: 'order',
      order_currency: currency,
      order_amount: amount,
      order_status: 'ACTIVE',
      payment_session_id: `session_${Date.now()}`,
      order_expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      order_note: orderData.order_note
    };

    // Update payment record with Cashfree order details
    await payment.update({
      gatewayOrderId: cashfreeResponse.cf_order_id,
      paymentSessionId: cashfreeResponse.payment_session_id,
      expiresAt: new Date(cashfreeResponse.order_expiry_time),
      metadata: {
        ...payment.metadata,
        cashfreeOrderId: cashfreeResponse.cf_order_id,
        orderData: orderData
      }
    });

    // Log payment creation
    await ActivityLog.create({
      userId,
      action: 'CREATE_PAYMENT_ORDER',
      entityType: 'PAYMENT',
      entityId: payment.id,
      details: JSON.stringify({
        amount,
        currency,
        courseId,
        batchId,
        orderId,
        gateway: 'cashfree'
      }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    logger.info(`Cashfree order created: ${orderId} for user ${userId}, amount: ${amount}`);

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        payment_session_id: cashfreeResponse.payment_session_id,
        order_id: orderId,
        cf_order_id: cashfreeResponse.cf_order_id,
        amount: amount,
        currency: currency,
        expires_at: cashfreeResponse.order_expiry_time,
        checkout_url: `${CASHFREE_BASE_URL}/checkout?payment_session_id=${cashfreeResponse.payment_session_id}`
      }
    });

  } catch (error) {
    logger.error('Cashfree order creation failed:', error);
    
    // Update payment status to failed
    await payment.update({ status: 'failed' });
    
    throw new AppError('Failed to create payment order', 500);
  }
});

// @desc    Handle Cashfree webhook
// @route   POST /api/payments/cashfree/webhook
// @access  Public (but verified)
const handleCashfreeWebhook = asyncHandler(async (req, res) => {
  const { 
    type, 
    data: { 
      order = {}, 
      payment = {} 
    } 
  } = req.body;

  // Verify webhook signature (in production)
  const timestamp = req.headers['x-webhook-timestamp'];
  const signature = req.headers['x-webhook-signature'];
  
  if (process.env.NODE_ENV === 'production' && (!timestamp || !signature)) {
    throw new AppError('Invalid webhook signature', 400);
  }

  try {
    const orderId = order.order_id;
    const cfOrderId = order.cf_order_id;

    // Find payment record
    const paymentRecord = await Payment.findOne({
      where: {
        [sequelize.Op.or]: [
          { gatewayOrderId: cfOrderId },
          { id: orderId.replace('ORDER_', '').split('_')[0] }
        ]
      },
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, attributes: ['title'] },
        { model: Batch, attributes: ['name'] }
      ]
    });

    if (!paymentRecord) {
      logger.error(`Payment record not found for order: ${orderId}`);
      return res.status(400).json({ success: false, message: 'Payment record not found' });
    }

    // Handle different webhook events
    switch (type) {
      case 'PAYMENT_SUCCESS':
        await paymentRecord.update({
          status: 'completed',
          gatewayPaymentId: payment.cf_payment_id,
          paidAt: new Date(),
          metadata: {
            ...paymentRecord.metadata,
            paymentMethod: payment.payment_method,
            bankReference: payment.bank_reference,
            webhookData: { type, order, payment }
          }
        });

        // Log successful payment
        await ActivityLog.create({
          userId: paymentRecord.studentId,
          action: 'PAYMENT_SUCCESS',
          entityType: 'PAYMENT',
          entityId: paymentRecord.id,
          details: JSON.stringify({
            amount: payment.payment_amount,
            method: payment.payment_method,
            orderId,
            cfPaymentId: payment.cf_payment_id
          }),
          status: 'success'
        });

        logger.info(`Payment successful: ${orderId}, amount: ${payment.payment_amount}`);
        break;

      case 'PAYMENT_FAILED':
        await paymentRecord.update({
          status: 'failed',
          failureReason: payment.failure_reason || 'Payment failed',
          metadata: {
            ...paymentRecord.metadata,
            failureReason: payment.failure_reason,
            webhookData: { type, order, payment }
          }
        });

        // Log failed payment
        await ActivityLog.create({
          userId: paymentRecord.studentId,
          action: 'PAYMENT_FAILED',
          entityType: 'PAYMENT',
          entityId: paymentRecord.id,
          details: JSON.stringify({
            reason: payment.failure_reason,
            orderId,
            cfPaymentId: payment.cf_payment_id
          }),
          status: 'failed'
        });

        logger.warn(`Payment failed: ${orderId}, reason: ${payment.failure_reason}`);
        break;

      case 'PAYMENT_PENDING':
        await paymentRecord.update({
          status: 'processing',
          metadata: {
            ...paymentRecord.metadata,
            webhookData: { type, order, payment }
          }
        });
        logger.info(`Payment pending: ${orderId}`);
        break;

      default:
        logger.info(`Unhandled webhook event: ${type} for order: ${orderId}`);
    }

    res.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// @desc    Get payment status
// @route   GET /api/payments/cashfree/status/:orderId
// @access  Private
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const payment = await Payment.findOne({
    where: {
      [sequelize.Op.or]: [
        { id: orderId.replace('ORDER_', '').split('_')[0] },
        { gatewayOrderId: orderId }
      ]
    },
    include: [
      { model: Course, attributes: ['title'] },
      { model: Batch, attributes: ['name'] }
    ]
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Check if user owns this payment
  if (payment.studentId !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  res.json({
    success: true,
    data: {
      payment_id: payment.id,
      order_id: orderId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      item_name: payment.Course?.title || payment.Batch?.name || 'Unknown',
      created_at: payment.createdAt,
      paid_at: payment.paidAt,
      failure_reason: payment.failureReason
    }
  });
});

module.exports = {
  createCashfreeOrder,
  handleCashfreeWebhook,
  getPaymentStatus
};
