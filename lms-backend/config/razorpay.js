const Razorpay = require('razorpay');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('Razorpay credentials not configured. Payment features will not work.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_key'
});

// Webhook signature verification
razorpay.utils.verifyWebhookSignature = (body, signature, secret) => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = razorpay;
