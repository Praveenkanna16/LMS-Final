const nodemailer = require('nodemailer');
const logger = require('../../config/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  generateProgressTemplate(title, message, metadata) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">${title}</h2>
        <p style="color: #34495e; font-size: 16px;">${message}</p>
        ${metadata.progressPercentage ? `
          <div style="background-color: #f5f6fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <div style="background-color: #dfe6e9; height: 20px; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #00b894; width: ${metadata.progressPercentage}%; height: 100%;"></div>
            </div>
            <p style="text-align: center; margin-top: 10px;">${Math.floor(metadata.progressPercentage)}% Complete</p>
          </div>
        ` : ''}
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dfe6e9;">
          <p style="color: #7f8c8d; font-size: 14px;">Keep up the great work!</p>
        </div>
      </div>
    `;
  }
}

module.exports = new EmailService();
