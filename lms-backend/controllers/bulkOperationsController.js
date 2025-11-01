const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Assessment = require('../models/Assessment');
const Grade = require('../models/Grade');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { Op } = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');

// Email transporter commented out - configure if needed
// const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransporter({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: process.env.SMTP_PORT || 587,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// @desc    Bulk user actions (activate, deactivate, delete)
// @route   POST /api/admin/bulk/users
// @access  Private/Admin
const bulkUserActions = asyncHandler(async (req, res) => {
  const { userIds, action } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('User IDs array is required', 400);
  }

  if (!['activate', 'deactivate', 'delete'].includes(action)) {
    throw new AppError('Invalid action. Must be activate, deactivate, or delete', 400);
  }

  const results = {
    total: userIds.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (const userId of userIds) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        results.failed++;
        results.errors.push(`User ${userId} not found`);
        continue;
      }

      // Prevent admin from deleting themselves
      if (action === 'delete' && user.id === req.user.id) {
        results.failed++;
        results.errors.push('Cannot delete your own account');
        continue;
      }

      switch (action) {
        case 'activate':
          await user.update({ status: 'active' });
          await Notification.create({
            user_id: user.id,
            title: 'Account Activated',
            message: 'Your account has been activated by an administrator.',
            type: 'account',
            priority: 'high',
          });
          break;

        case 'deactivate':
          await user.update({ status: 'inactive' });
          await Notification.create({
            user_id: user.id,
            title: 'Account Deactivated',
            message: 'Your account has been deactivated. Contact support for assistance.',
            type: 'account',
            priority: 'high',
          });
          break;

        case 'delete':
          // Soft delete - just mark as deleted
          await user.update({ status: 'deleted', deleted_at: new Date() });
          break;
      }

      results.succeeded++;
      logger.info(`Bulk action ${action} performed on user ${userId} by admin ${req.user.id}`);
    } catch (error) {
      results.failed++;
      results.errors.push(`Error processing user ${userId}: ${error.message}`);
      logger.error(`Bulk action error for user ${userId}:`, error);
    }
  }

  res.status(200).json({
    success: true,
    message: `Bulk ${action} operation completed`,
    ...results,
  });
});

// @desc    Send bulk emails
// @route   POST /api/admin/bulk/emails
// @access  Private/Admin
const sendBulkEmails = asyncHandler(async (req, res) => {
  const { subject, body, recipientType, userIds } = req.body;

  if (!subject || !body) {
    throw new AppError('Subject and body are required', 400);
  }

  if (!['all', 'students', 'teachers', 'selected'].includes(recipientType)) {
    throw new AppError('Invalid recipient type', 400);
  }

  let recipients = [];

  // Get recipients based on type
  switch (recipientType) {
    case 'all':
      recipients = await User.findAll({
        where: { status: 'active' },
        attributes: ['id', 'name', 'email'],
      });
      break;

    case 'students':
      recipients = await User.findAll({
        where: { role: 'student', status: 'active' },
        attributes: ['id', 'name', 'email'],
      });
      break;

    case 'teachers':
      recipients = await User.findAll({
        where: { role: 'teacher', status: 'active' },
        attributes: ['id', 'name', 'email'],
      });
      break;

    case 'selected':
      if (!userIds || userIds.length === 0) {
        throw new AppError('User IDs required for selected recipient type', 400);
      }
      recipients = await User.findAll({
        where: { id: { [Op.in]: userIds }, status: 'active' },
        attributes: ['id', 'name', 'email'],
      });
      break;
  }

  const results = {
    total: recipients.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  // Send emails
  for (const recipient of recipients) {
    try {
      // Personalize email body
      const personalizedBody = body
        .replace(/{name}/g, recipient.name)
        .replace(/{email}/g, recipient.email);

      await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'GenZEd LMS'}" <${process.env.SMTP_USER}>`,
        to: recipient.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">${process.env.APP_NAME || 'GenZEd LMS'}</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #374151; white-space: pre-wrap;">${personalizedBody}</p>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                © ${new Date().getFullYear()} ${process.env.APP_NAME || 'GenZEd LMS'}. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      // Create notification
      await Notification.create({
        user_id: recipient.id,
        title: subject,
        message: body.substring(0, 200),
        type: 'announcement',
        priority: 'medium',
      });

      results.succeeded++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to send to ${recipient.email}: ${error.message}`);
      logger.error(`Email send error for ${recipient.email}:`, error);
    }
  }

  logger.info(`Bulk email sent by admin ${req.user.id}: ${results.succeeded}/${results.total} succeeded`);

  res.status(200).json({
    success: true,
    message: 'Bulk email operation completed',
    ...results,
  });
});

// @desc    Import data from CSV
// @route   POST /api/admin/bulk/import
// @access  Private/Admin
const importCSV = asyncHandler(async (req, res) => {
  const { type } = req.body;
  const file = req.file;

  if (!file) {
    throw new AppError('CSV file is required', 400);
  }

  if (!['enrollments', 'users', 'grades'].includes(type)) {
    throw new AppError('Invalid import type', 400);
  }

  const results = {
    total: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  const records = [];

  // Parse CSV file
  await new Promise((resolve, reject) => {
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        records.push(row);
        results.total++;
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Process records based on type
  switch (type) {
    case 'enrollments':
      for (const record of records) {
        try {
          const { student_email, course_id, batch_id } = record;

          // Find student
          const student = await User.findOne({
            where: { email: student_email, role: 'student' },
          });

          if (!student) {
            results.failed++;
            results.errors.push(`Student not found: ${student_email}`);
            continue;
          }

          // Check if enrollment exists
          const existingEnrollment = await Enrollment.findOne({
            where: {
              student_id: student.id,
              course_id: parseInt(course_id),
            },
          });

          if (existingEnrollment) {
            results.failed++;
            results.errors.push(`Student ${student_email} already enrolled in course ${course_id}`);
            continue;
          }

          // Create enrollment
          await Enrollment.create({
            student_id: student.id,
            course_id: parseInt(course_id),
            batch_id: batch_id ? parseInt(batch_id) : null,
            status: 'active',
            enrolled_at: new Date(),
          });

          // Send notification
          await Notification.create({
            user_id: student.id,
            title: 'Course Enrollment',
            message: 'You have been enrolled in a new course.',
            type: 'enrollment',
            priority: 'high',
          });

          results.succeeded++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error enrolling ${record.student_email}: ${error.message}`);
        }
      }
      break;

    case 'users':
      for (const record of records) {
        try {
          const { name, email, role, phone } = record;

          // Check if user exists
          const existingUser = await User.findOne({ where: { email } });

          if (existingUser) {
            results.failed++;
            results.errors.push(`User already exists: ${email}`);
            continue;
          }

          // Create user with default password
          const defaultPassword = 'Password123!';
          await User.create({
            name,
            email,
            password: defaultPassword, // Should be hashed in model
            role: role || 'student',
            phone: phone || null,
            status: 'active',
          });

          results.succeeded++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error creating user ${record.email}: ${error.message}`);
        }
      }
      break;

    case 'grades':
      for (const record of records) {
        try {
          const { student_email, assessment_id, score, remarks } = record;

          // Find student
          const student = await User.findOne({
            where: { email: student_email, role: 'student' },
          });

          if (!student) {
            results.failed++;
            results.errors.push(`Student not found: ${student_email}`);
            continue;
          }

          // Create or update grade
          const [grade] = await Grade.findOrCreate({
            where: {
              student_id: student.id,
              assessment_id: parseInt(assessment_id),
            },
            defaults: {
              score: parseFloat(score),
              remarks: remarks || '',
              graded_at: new Date(),
              graded_by: req.user.id,
            },
          });

          if (!grade) {
            // Update existing grade
            await Grade.update(
              {
                score: parseFloat(score),
                remarks: remarks || '',
                graded_at: new Date(),
                graded_by: req.user.id,
              },
              {
                where: {
                  student_id: student.id,
                  assessment_id: parseInt(assessment_id),
                },
              }
            );
          }

          results.succeeded++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error grading ${record.student_email}: ${error.message}`);
        }
      }
      break;
  }

  // Clean up uploaded file
  fs.unlinkSync(file.path);

  logger.info(`CSV import (${type}) by admin ${req.user.id}: ${results.succeeded}/${results.total} succeeded`);

  res.status(200).json({
    success: true,
    message: `CSV import completed`,
    ...results,
  });
});

module.exports = {
  bulkUserActions,
  sendBulkEmails,
  importCSV,
};
