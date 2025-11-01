const axios = require('axios');

class CashfreeSDK {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID;
    this.secretKey = process.env.CASHFREE_SECRET_KEY;
    this.environment = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
    this.apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

    // Validate credentials
    if (!this.appId || !this.secretKey) {
      throw new Error('❌ Cashfree credentials missing! Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env');
    }

    this.baseURL = this.environment === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    this.headers = {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': this.apiVersion,
      'Content-Type': 'application/json'
    };

    console.log(`✅ Cashfree Payment Gateway SDK initialized in ${this.environment} mode`);
  }

  // Create payment order
  async createOrder(orderData) {
    try {
      console.log('🔄 Creating Cashfree payment order:', orderData.order_id);
      
      const response = await axios.post(
        `${this.baseURL}/orders`,
        orderData,
        { headers: this.headers }
      );
      
      console.log('✅ Cashfree order created successfully:', {
        order_id: response.data.order_id,
        payment_session_id: response.data.payment_session_id,
        status: response.data.order_status
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Cashfree order creation failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create payment order');
    }
  }

  // Get order details
  async getOrder(orderId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/orders/${orderId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Cashfree order fetch failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch order details');
    }
  }

  // Get payment details
  async getPayment(paymentId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/payments/${paymentId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Cashfree payment fetch failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment details');
    }
  }

  // Refund payment
  async refundPayment(paymentId, refundData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payments/${paymentId}/refund`,
        refundData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Cashfree refund failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to process refund');
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, secret) {
    const crypto = require('crypto');

    // Create HMAC using SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('base64');

    return expectedSignature === signature;
  }

  // Get settlement details
  async getSettlements(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await axios.get(
        `${this.baseURL}/settlements?${queryParams}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Cashfree settlements fetch failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch settlements');
    }
  }

  // Webhook handler helper
  handleWebhookEvent(eventType, eventData) {
    switch (eventType) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        return this.processPaymentSuccess(eventData);
      case 'PAYMENT_FAILED_WEBHOOK':
        return this.processPaymentFailure(eventData);
      case 'PAYMENT_CANCELLED_WEBHOOK':
        return this.processPaymentCancellation(eventData);
      case 'PAYMENT_PENDING_WEBHOOK':
        return this.processPaymentPending(eventData);
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
        return null;
    }
  }

  processPaymentSuccess(eventData) {
    return {
      type: 'payment_success',
      orderId: eventData.order?.order_id,
      paymentId: eventData.payment?.payment_id,
      amount: eventData.payment?.amount,
      status: 'success',
      timestamp: eventData.created_at,
      customerDetails: eventData.customer_details,
      paymentMethod: eventData.payment?.payment_method
    };
  }

  processPaymentFailure(eventData) {
    return {
      type: 'payment_failure',
      orderId: eventData.order?.order_id,
      paymentId: eventData.payment?.payment_id,
      amount: eventData.payment?.amount,
      status: 'failed',
      failureReason: eventData.payment?.failure_reason,
      timestamp: eventData.created_at,
      customerDetails: eventData.customer_details
    };
  }

  processPaymentCancellation(eventData) {
    return {
      type: 'payment_cancellation',
      orderId: eventData.order?.order_id,
      paymentId: eventData.payment?.payment_id,
      amount: eventData.payment?.amount,
      status: 'cancelled',
      timestamp: eventData.created_at,
      customerDetails: eventData.customer_details
    };
  }

  processPaymentPending(eventData) {
    return {
      type: 'payment_pending',
      orderId: eventData.order?.order_id,
      paymentId: eventData.payment?.payment_id,
      amount: eventData.payment?.amount,
      status: 'pending',
      timestamp: eventData.created_at,
      customerDetails: eventData.customer_details
    };
  }
}

module.exports = new CashfreeSDK();
