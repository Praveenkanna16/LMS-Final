const smsService = require('../services/smsService');
const logger = require('../config/logger');

exports.sendSMS = async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ message: 'Phone number and message are required' });
    }

    const result = await smsService.sendSMS(to, message);
    
    if (!result.success) {
      return res.status(503).json({ message: result.message });
    }

    res.json({ message: 'SMS sent successfully', sid: result.sid });
  } catch (error) {
    logger.error('Send SMS error:', error);
    res.status(500).json({ message: 'Failed to send SMS' });
  }
};

exports.sendBulkSMS = async (req, res) => {
  try {
    const { recipients, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients array is required' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const result = await smsService.sendBulkSMS(recipients, message);
    
    if (!result.success) {
      return res.status(503).json({ message: result.message });
    }

    res.json({ 
      message: 'Bulk SMS sent',
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    logger.error('Send bulk SMS error:', error);
    res.status(500).json({ message: 'Failed to send bulk SMS' });
  }
};

exports.sendTemplatedSMS = async (req, res) => {
  try {
    const { to, template, data } = req.body;

    if (!to || !template || !data) {
      return res.status(400).json({ message: 'Phone number, template, and data are required' });
    }

    const templateFn = smsService.templates[template];
    
    if (!templateFn) {
      return res.status(400).json({ message: 'Invalid template' });
    }

    const message = templateFn(...Object.values(data));
    const result = await smsService.sendSMS(to, message);
    
    if (!result.success) {
      return res.status(503).json({ message: result.message });
    }

    res.json({ message: 'Templated SMS sent successfully', sid: result.sid });
  } catch (error) {
    logger.error('Send templated SMS error:', error);
    res.status(500).json({ message: 'Failed to send templated SMS' });
  }
};
