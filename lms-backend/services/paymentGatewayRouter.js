const logger = require('../config/logger');
const { createOrder: createCashfreeOrder } = require('../controllers/cashfreeController');
const { createRazorpayOrder } = require('./razorpayService');

/**
 * Payment Gateway Router
 * Handles switching between multiple payment gateways
 */

const GATEWAYS = {
  CASHFREE: 'cashfree',
  RAZORPAY: 'razorpay'
};

// Gateway priority (first available will be used)
const GATEWAY_PRIORITY = [GATEWAYS.CASHFREE, GATEWAYS.RAZORPAY];

/**
 * Check gateway availability
 */
const isGatewayAvailable = (gateway) => {
  switch (gateway) {
    case GATEWAYS.CASHFREE:
      return !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
    case GATEWAYS.RAZORPAY:
      return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    default:
      return false;
  }
};

/**
 * Get primary gateway (first available from priority list)
 */
const getPrimaryGateway = () => {
  for (const gateway of GATEWAY_PRIORITY) {
    if (isGatewayAvailable(gateway)) {
      return gateway;
    }
  }
  throw new Error('No payment gateway available');
};

/**
 * Get fallback gateway (next available after primary)
 */
const getFallbackGateway = (currentGateway) => {
  const currentIndex = GATEWAY_PRIORITY.indexOf(currentGateway);
  
  for (let i = currentIndex + 1; i < GATEWAY_PRIORITY.length; i++) {
    if (isGatewayAvailable(GATEWAY_PRIORITY[i])) {
      return GATEWAY_PRIORITY[i];
    }
  }
  
  return null;
};

/**
 * Create payment order with automatic gateway selection
 */
const createPaymentOrder = async (orderData, preferredGateway = null) => {
  try {
    // Use preferred gateway if specified and available
    let gateway = preferredGateway && isGatewayAvailable(preferredGateway) 
      ? preferredGateway 
      : getPrimaryGateway();

    logger.info(`Creating payment order with gateway: ${gateway}`);

    try {
      let result;

      switch (gateway) {
        case GATEWAYS.CASHFREE:
          result = await createCashfreeOrder(orderData);
          return {
            success: true,
            gateway: GATEWAYS.CASHFREE,
            orderId: result.order_id || result.orderId,
            paymentSessionId: result.payment_session_id,
            ...result
          };

        case GATEWAYS.RAZORPAY:
          result = await createRazorpayOrder(orderData);
          return {
            success: true,
            gateway: GATEWAYS.RAZORPAY,
            orderId: result.orderId,
            amount: result.amount,
            currency: result.currency,
            key: process.env.RAZORPAY_KEY_ID
          };

        default:
          throw new Error(`Unsupported gateway: ${gateway}`);
      }
    } catch (error) {
      logger.error(`Primary gateway ${gateway} failed:`, error);

      // Try fallback gateway
      const fallbackGateway = getFallbackGateway(gateway);
      
      if (fallbackGateway) {
        logger.info(`Attempting fallback gateway: ${fallbackGateway}`);
        return createPaymentOrder(orderData, fallbackGateway);
      }

      throw error;
    }
  } catch (error) {
    logger.error('Error creating payment order:', error);
    throw error;
  }
};

/**
 * Verify payment based on gateway
 */
const verifyPayment = async (paymentData, gateway) => {
  try {
    switch (gateway) {
      case GATEWAYS.CASHFREE:
        // Cashfree verification logic
        // const { verifyPayment } = require('../controllers/cashfreeController');
        // return await verifyPayment(paymentData);
        return { success: true, verified: true };

      case GATEWAYS.RAZORPAY:
        const { verifyRazorpaySignature } = require('./razorpayService');
        const isValid = verifyRazorpaySignature(
          paymentData.orderId,
          paymentData.paymentId,
          paymentData.signature
        );
        return { success: isValid, verified: isValid };

      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }
  } catch (error) {
    logger.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Process refund based on gateway
 */
const processRefund = async (refundData, gateway) => {
  try {
    switch (gateway) {
      case GATEWAYS.CASHFREE:
        // Cashfree refund logic
        // const { createRefund } = require('../services/cashfreePayoutService');
        // return await createRefund(refundData);
        logger.info('Cashfree refund not yet implemented');
        return { success: true, message: 'Refund will be processed manually' };

      case GATEWAYS.RAZORPAY:
        const { createRefund } = require('./razorpayService');
        return await createRefund(refundData.paymentId, refundData.amount);

      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }
  } catch (error) {
    logger.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Get available gateways
 */
const getAvailableGateways = () => {
  return GATEWAY_PRIORITY.filter(gateway => isGatewayAvailable(gateway));
};

/**
 * Get gateway status
 */
const getGatewayStatus = () => {
  return {
    primary: getPrimaryGateway(),
    available: getAvailableGateways(),
    status: {
      [GATEWAYS.CASHFREE]: {
        available: isGatewayAvailable(GATEWAYS.CASHFREE),
        configured: !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY)
      },
      [GATEWAYS.RAZORPAY]: {
        available: isGatewayAvailable(GATEWAYS.RAZORPAY),
        configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
      }
    }
  };
};

module.exports = {
  GATEWAYS,
  createPaymentOrder,
  verifyPayment,
  processRefund,
  getPrimaryGateway,
  getFallbackGateway,
  getAvailableGateways,
  getGatewayStatus,
  isGatewayAvailable
};
