const axios = require('axios');
const crypto = require('crypto');
const { CashfreeTransaction, Payment } = require('../models');
const logger = require('../config/logger');

// Cashfree configuration
const CASHFREE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

const CLIENT_ID = process.env.CASHFREE_CLIENT_ID || 'your-client-id';
const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || 'your-client-secret';

// Generate Cashfree auth headers
const getCashfreeHeaders = () => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-client-id': CLIENT_ID,
    'x-client-secret': CLIENT_SECRET,
    'x-api-version': '2023-08-01'
  };
};

// Create Cashfree order
const createCashfreeOrder = async (orderDetails) => {
  try {
    const {
      orderId,
      amount,
      currency = 'INR',
      customerName,
      customerEmail,
      customerPhone,
      returnUrl,
      notifyUrl
    } = orderDetails;

    const orderData = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: currency,
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl
      }
    };

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      orderData,
      { headers: getCashfreeHeaders() }
    );

    if (response.data && response.data.order_token) {
      // Save transaction to database
      await CashfreeTransaction.create({
        orderId: orderId,
        cashfreeOrderId: response.data.cf_order_id,
        orderToken: response.data.order_token,
        amount: amount,
        currency: currency,
        status: 'created',
        customerName,
        customerEmail,
        customerPhone,
        gatewayResponse: JSON.stringify(response.data)
      });

      logger.info(`Cashfree order created successfully: ${orderId}`);
      return response.data;
    } else {
      throw new Error('Invalid response from Cashfree');
    }
  } catch (error) {
    logger.error('Error creating Cashfree order:', error);
    throw new Error(`Cashfree order creation failed: ${error.response?.data?.message || error.message}`);
  }
};

// Get payment details from Cashfree
const getPaymentDetails = async (orderId) => {
  try {
    const response = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${orderId}`,
      { headers: getCashfreeHeaders() }
    );

    return response.data;
  } catch (error) {
    logger.error('Error fetching payment details:', error);
    throw new Error(`Failed to fetch payment details: ${error.response?.data?.message || error.message}`);
  }
};

// Get payment information by payment ID
const getPaymentInfo = async (orderId, paymentId) => {
  try {
    const response = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${orderId}/payments/${paymentId}`,
      { headers: getCashfreeHeaders() }
    );

    return response.data;
  } catch (error) {
    logger.error('Error fetching payment info:', error);
    throw new Error(`Failed to fetch payment info: ${error.response?.data?.message || error.message}`);
  }
};

// Verify webhook signature
const verifyWebhookSignature = (webhookData, signature) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', CLIENT_SECRET)
      .update(JSON.stringify(webhookData))
      .digest('base64');

    return signature === expectedSignature;
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return false;
  }
};

// Handle Cashfree webhook
const handleCashfreeWebhook = async (webhookData, signature) => {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(webhookData, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const { order, payment } = webhookData.data;

    // Find the transaction in our database
    const transaction = await CashfreeTransaction.findOne({
      where: { orderId: order.order_id }
    });

    if (!transaction) {
      throw new Error(`Transaction not found for order: ${order.order_id}`);
    }

    // Update transaction status
    await transaction.update({
      paymentId: payment?.cf_payment_id,
      paymentMethod: payment?.payment_method,
      status: order.order_status.toLowerCase(),
      paidAmount: payment?.payment_amount || order.order_amount,
      paymentTime: payment?.payment_time ? new Date(payment.payment_time) : null,
      gatewayResponse: JSON.stringify(webhookData.data),
      webhookData: JSON.stringify(webhookData)
    });

    // If payment is successful, update the main Payment record
    if (order.order_status === 'PAID') {
      const paymentRecord = await Payment.findOne({
        where: { transactionId: order.order_id }
      });

      if (paymentRecord) {
        await paymentRecord.update({
          status: 'completed',
          gatewayTransactionId: payment.cf_payment_id,
          gatewayResponse: JSON.stringify(payment),
          paidAt: new Date()
        });

        logger.info(`Payment completed successfully: ${order.order_id}`);
      }
    } else if (order.order_status === 'FAILED') {
      const paymentRecord = await Payment.findOne({
        where: { transactionId: order.order_id }
      });

      if (paymentRecord) {
        await paymentRecord.update({
          status: 'failed',
          gatewayTransactionId: payment?.cf_payment_id,
          gatewayResponse: JSON.stringify(payment || order)
        });

        logger.info(`Payment failed: ${order.order_id}`);
      }
    }

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    logger.error('Error handling Cashfree webhook:', error);
    throw error;
  }
};

// Initiate refund
const initiateRefund = async (orderId, refundAmount, refundNote) => {
  try {
    const refundData = {
      refund_amount: parseFloat(refundAmount),
      refund_id: `refund_${Date.now()}`,
      refund_note: refundNote || 'Refund initiated by admin'
    };

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders/${orderId}/refunds`,
      refundData,
      { headers: getCashfreeHeaders() }
    );

    // Update transaction record
    const transaction = await CashfreeTransaction.findOne({
      where: { orderId }
    });

    if (transaction) {
      await transaction.update({
        refundId: response.data.cf_refund_id,
        refundAmount: refundAmount,
        refundStatus: response.data.refund_status,
        gatewayResponse: JSON.stringify({
          ...JSON.parse(transaction.gatewayResponse || '{}'),
          refund: response.data
        })
      });
    }

    logger.info(`Refund initiated successfully for order: ${orderId}`);
    return response.data;
  } catch (error) {
    logger.error('Error initiating refund:', error);
    throw new Error(`Refund initiation failed: ${error.response?.data?.message || error.message}`);
  }
};

// Get refund status
const getRefundStatus = async (orderId, refundId) => {
  try {
    const response = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${orderId}/refunds/${refundId}`,
      { headers: getCashfreeHeaders() }
    );

    return response.data;
  } catch (error) {
    logger.error('Error fetching refund status:', error);
    throw new Error(`Failed to fetch refund status: ${error.response?.data?.message || error.message}`);
  }
};

// Get settlement report
const getSettlementReport = async (startDate, endDate) => {
  try {
    const params = {
      start_date: startDate,
      end_date: endDate
    };

    const response = await axios.get(
      `${CASHFREE_BASE_URL}/settlements`,
      { 
        headers: getCashfreeHeaders(),
        params
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Error fetching settlement report:', error);
    throw new Error(`Failed to fetch settlement report: ${error.response?.data?.message || error.message}`);
  }
};

module.exports = {
  createCashfreeOrder,
  getPaymentDetails,
  getPaymentInfo,
  handleCashfreeWebhook,
  verifyWebhookSignature,
  initiateRefund,
  getRefundStatus,
  getSettlementReport
};
