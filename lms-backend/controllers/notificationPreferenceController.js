const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * Get user notification preferences
 */
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'notificationPreferences']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Default preferences if not set
    const preferences = user.notificationPreferences || {
      email: {
        classReminders: true,
        assessmentNotifications: true,
        paymentReminders: true,
        announcements: true,
        gradeUpdates: true
      },
      push: {
        classReminders: true,
        assessmentNotifications: true,
        paymentReminders: true,
        announcements: true,
        gradeUpdates: true
      },
      sms: {
        classReminders: false,
        assessmentNotifications: false,
        paymentReminders: true,
        announcements: false,
        gradeUpdates: false
      }
    };

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences'
    });
  }
};

/**
 * Update user notification preferences
 */
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Merge with existing preferences
    const currentPreferences = user.notificationPreferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences
    };

    await user.update({
      notificationPreferences: updatedPreferences
    });

    logger.info(`Notification preferences updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedPreferences
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
};

/**
 * Get all users' notification preferences (Admin only)
 */
const getAllUsersPreferences = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { role, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (role) whereClause.role = role;

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'notificationPreferences'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(users.count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting all users preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences'
    });
  }
};

/**
 * Bulk update notification preferences (Admin only)
 */
const bulkUpdatePreferences = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userIds, preferences } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } }
    });

    for (const user of users) {
      const currentPreferences = user.notificationPreferences || {};
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };
      await user.update({ notificationPreferences: updatedPreferences });
    }

    logger.info(`Bulk preference update: ${users.length} users updated`);

    res.json({
      success: true,
      message: `Updated preferences for ${users.length} users`,
      data: { updatedCount: users.length }
    });
  } catch (error) {
    logger.error('Error in bulk preference update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update preferences'
    });
  }
};

/**
 * Reset to default preferences
 */
const resetToDefault = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultPreferences = {
      email: {
        classReminders: true,
        assessmentNotifications: true,
        paymentReminders: true,
        announcements: true,
        gradeUpdates: true
      },
      push: {
        classReminders: true,
        assessmentNotifications: true,
        paymentReminders: true,
        announcements: true,
        gradeUpdates: true
      },
      sms: {
        classReminders: false,
        assessmentNotifications: false,
        paymentReminders: true,
        announcements: false,
        gradeUpdates: false
      }
    };

    await User.update(
      { notificationPreferences: defaultPreferences },
      { where: { id: userId } }
    );

    res.json({
      success: true,
      message: 'Preferences reset to default',
      data: defaultPreferences
    });
  } catch (error) {
    logger.error('Error resetting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset preferences'
    });
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  getAllUsersPreferences,
  bulkUpdatePreferences,
  resetToDefault
};
