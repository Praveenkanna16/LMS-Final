const logger = require('../config/logger');

// Initialize Twilio client only if credentials are available
let client = null;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    const twilio = require('twilio');
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    logger.info('Twilio SMS service initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize Twilio SMS service:', error.message);
  }
} else {
  logger.warn('Twilio credentials not found or invalid. SMS functionality will be disabled.');
}

// Send SMS
const sendSMS = async (to, message) => {
  try {
    if (!client) {
      throw new Error('SMS service not initialized. Check Twilio credentials.');
    }

    // Validate phone number format
    if (!to || !to.startsWith('+')) {
      throw new Error('Invalid phone number format. Must include country code (e.g., +1234567890).');
    }

    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: to
    });

    logger.info(`SMS sent successfully to ${to}`, { messageSid: result.sid });
    return result;
  } catch (error) {
    logger.error('Failed to send SMS:', error);
    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

// Send OTP SMS
const sendOTPSMS = async (phoneNumber, otp) => {
  const message = `Your GenZEd LMS verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
  return await sendSMS(phoneNumber, message);
};

// Send enrollment confirmation SMS
const sendEnrollmentConfirmationSMS = async (phoneNumber, userName, courseName) => {
  const message = `Hi ${userName}, you have successfully enrolled in "${courseName}" on GenZEd LMS. Start learning today!`;
  return await sendSMS(phoneNumber, message);
};

// Send class reminder SMS
const sendClassReminderSMS = async (phoneNumber, userName, className, startTime) => {
  const message = `Hi ${userName}, reminder: Your class "${className}" starts at ${startTime}. Join now on GenZEd LMS.`;
  return await sendSMS(phoneNumber, message);
};

// Send payment confirmation SMS
const sendPaymentConfirmationSMS = async (phoneNumber, userName, amount, courseName) => {
  const message = `Hi ${userName}, your payment of ₹${amount} for "${courseName}" has been confirmed. Happy learning!`;
  return await sendSMS(phoneNumber, message);
};

// Send teacher application status SMS
const sendTeacherApplicationStatusSMS = async (phoneNumber, userName, status) => {
  const statusMessage = status === 'approved' 
    ? 'Congratulations! Your teacher application has been approved.' 
    : 'Your teacher application has been rejected.';
  
  const message = `Hi ${userName}, ${statusMessage} Check your email for more details. - GenZEd LMS`;
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  sendEnrollmentConfirmationSMS,
  sendClassReminderSMS,
  sendPaymentConfirmationSMS,
  sendTeacherApplicationStatusSMS
};
