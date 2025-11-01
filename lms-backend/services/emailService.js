const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });
};

// Send notification email
const sendNotificationEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"GenZEd LMS" <${process.env.SMTP_USER || 'noreply@genzed.com'}>`,
      to,
      subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Welcome to GenZEd LMS!';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to GenZEd LMS, ${userName}!</h2>
      <p>Thank you for joining our learning management system. We're excited to have you on board!</p>
      <p>You can now:</p>
      <ul>
        <li>Browse and enroll in courses</li>
        <li>Track your learning progress</li>
        <li>Take assessments and earn certificates</li>
        <li>Join live classes and interact with instructors</li>
      </ul>
      <p>Get started by exploring our course catalog and finding courses that interest you.</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Browse Courses
        </a>
      </div>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Happy learning!</p>
      <hr style="margin: 30px 0; border: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        This email was sent by GenZEd LMS. If you didn't create an account, please ignore this email.
      </p>
    </div>
  `;

  return await sendNotificationEmail(userEmail, subject, htmlContent);
};

// Send course enrollment confirmation
const sendEnrollmentConfirmationEmail = async (userEmail, userName, courseName) => {
  const subject = `Enrollment Confirmed: ${courseName}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Enrollment Confirmed!</h2>
      <p>Hi ${userName},</p>
      <p>You have successfully enrolled in <strong>${courseName}</strong>.</p>
      <p>You can now access course materials, participate in discussions, and track your progress.</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Go to Dashboard
        </a>
      </div>
      <p>Happy learning!</p>
    </div>
  `;

  return await sendNotificationEmail(userEmail, subject, htmlContent);
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>You requested a password reset for your GenZEd LMS account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <hr style="margin: 30px 0; border: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        For security reasons, this link will expire in 1 hour.
      </p>
    </div>
  `;

  return await sendNotificationEmail(userEmail, subject, htmlContent);
};

// Send teacher application status email
const sendTeacherApplicationStatusEmail = async (userEmail, userName, status, reviewNotes = '') => {
  const subject = `Teacher Application ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  const statusColor = status === 'approved' ? '#28a745' : '#dc3545';
  const statusMessage = status === 'approved' 
    ? 'Congratulations! Your teacher application has been approved.' 
    : 'We regret to inform you that your teacher application has been rejected.';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${statusColor};">Teacher Application ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
      <p>Hi ${userName},</p>
      <p>${statusMessage}</p>
      ${reviewNotes ? `<p><strong>Review Notes:</strong> ${reviewNotes}</p>` : ''}
      ${status === 'approved' ? `
        <p>You can now start creating courses and teaching on our platform.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/dashboard" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Go to Teacher Dashboard
          </a>
        </div>
      ` : ''}
      <p>Thank you for your interest in teaching with GenZEd LMS.</p>
    </div>
  `;

  return await sendNotificationEmail(userEmail, subject, htmlContent);
};

module.exports = {
  sendNotificationEmail,
  sendWelcomeEmail,
  sendEnrollmentConfirmationEmail,
  sendPasswordResetEmail,
  sendTeacherApplicationStatusEmail
};
