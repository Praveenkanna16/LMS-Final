const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../config/logger');

// Initialize Razorpay instance
let razorpayInstance = null;

const initializeRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.warn('Razorpay credentials not configured');
    return null;
  }

  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  logger.info('Razorpay initialized successfully');
  return razorpayInstance;
};

/**
 * Create Razorpay order
 */
const createRazorpayOrder = async (orderData) => {
  try {
    if (!razorpayInstance) {
      razorpayInstance = initializeRazorpay();
    }

    if (!razorpayInstance) {
      throw new Error('Razorpay not initialized');
    }

    const options = {
      amount: Math.round(orderData.amount * 100), // Convert to paise
      currency: orderData.currency || 'INR',
      receipt: orderData.orderId,
      notes: orderData.notes || {},
      payment_capture: 1 // Auto capture
    };

    const order = await razorpayInstance.orders.create(options);

    logger.info(`Razorpay order created: ${order.id}`);

    return {
      success: true,
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    };
  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment signature
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    logger.error('Error verifying Razorpay signature:', error);
    return false;
  }
};

/**
 * Fetch payment details
 */
const fetchPaymentDetails = async (paymentId) => {
  try {
    if (!razorpayInstance) {
      razorpayInstance = initializeRazorpay();
    }

    const payment = await razorpayInstance.payments.fetch(paymentId);

    return {
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        capturedAt: payment.captured_at,
        createdAt: payment.created_at
      }
    };
  } catch (error) {
    logger.error('Error fetching payment details:', error);
    throw error;
  }
};

/**
 * Create refund
 */
const createRefund = async (paymentId, amount = null) => {
  try {
    if (!razorpayInstance) {
      razorpayInstance = initializeRazorpay();
    }

    const options = amount ? { amount: Math.round(amount * 100) } : {};
    const refund = await razorpayInstance.payments.refund(paymentId, options);

    logger.info(`Razorpay refund created: ${refund.id} for payment ${paymentId}`);

    return {
      success: true,
      refund: {
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        createdAt: refund.created_at
      }
    };
  } catch (error) {
    logger.error('Error creating refund:', error);
    throw error;
  }
};

/**
 * Create subscription (for auto-debit)
 */
const createSubscription = async (subscriptionData) => {
  try {
    if (!razorpayInstance) {
      razorpayInstance = initializeRazorpay();
    }

    // First create a plan
    const planOptions = {
      period: subscriptionData.period || 'monthly',
      interval: subscriptionData.interval || 1,
      item: {
        name: subscriptionData.planName,
        amount: Math.round(subscriptionData.amount * 100),
        currency: subscriptionData.currency || 'INR'
      }
    };

    const plan = await razorpayInstance.plans.create(planOptions);

    // Then create subscription
    const subscriptionOptions = {
      plan_id: plan.id,
      customer_notify: 1,
      total_count: subscriptionData.totalCount || 12,
      start_at: subscriptionData.startAt || Math.floor(Date.now() / 1000),
      notes: subscriptionData.notes || {}
    };

    const subscription = await razorpayInstance.subscriptions.create(subscriptionOptions);

    logger.info(`Razorpay subscription created: ${subscription.id}`);

    return {
      success: true,
      subscription: {
        id: subscription.id,
        planId: plan.id,
        status: subscription.status,
        currentStart: subscription.current_start,
        currentEnd: subscription.current_end,
        chargeAt: subscription.charge_at
      }
    };
  } catch (error) {
    logger.error('Error creating subscription:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (subscriptionId) => {
  try {
    if (!razorpayInstance) {
      razorpayInstance = initializeRazorpay();
    }

    const subscription = await razorpayInstance.subscriptions.cancel(subscriptionId);

    logger.info(`Razorpay subscription cancelled: ${subscriptionId}`);

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        endedAt: subscription.ended_at
      }
    };
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Fetch all payments for an order
 */
const fetchOrderPayments = async (orderId) => {
  try {
    if (!razorpayInstance) {
      razorpayInstance = initializeRazorpay();
    }

    const payments = await razorpayInstance.orders.fetchPayments(orderId);

    return {
      success: true,
      payments: payments.items.map(payment => ({
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: payment.created_at
      }))
    };
  } catch (error) {
    logger.error('Error fetching order payments:', error);
    throw error;
  }
};

module.exports = {
  initializeRazorpay,
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchPaymentDetails,
  createRefund,
  createSubscription,
  cancelSubscription,
  fetchOrderPayments
};
