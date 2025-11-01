const { 
  Notification, 
  User, 
  Course, 
  Batch, 
  FCMToken, 
  NotificationPreference,
  NotificationTopic,
  TopicSubscription 
} = require('../models');
const { Op } = require('sequelize');
const emailService = require('./notificationChannels/emailService');
const pushService = require('./notificationChannels/pushService');
const logger = require('../config/logger');

class NotificationService {
  static async createTopic(name, displayName, type, description = null, metadata = {}, isPublic = true) {
    try {
      return await NotificationTopic.create({
        name,
        displayName,
        type,
        description,
        metadata,
        isPublic
      });
    } catch (error) {
      logger.error('Error creating notification topic:', error);
      throw error;
    }
  }

  static async subscribeTopic(userId, topicName, channels = ['database', 'push', 'email']) {
    try {
      const topic = await NotificationTopic.findOne({ where: { name: topicName } });
      if (!topic) {
        throw new Error(`Topic ${topicName} not found`);
      }

      const [subscription, created] = await TopicSubscription.findOrCreate({
        where: { userId, topicId: topic.id },
        defaults: { channels, isActive: true }
      });

      if (!created && !subscription.isActive) {
        await subscription.update({ isActive: true, channels });
      }

      // Subscribe to Firebase topic for push notifications
      if (channels.includes('push')) {
        const userTokens = await FCMToken.findAll({
          where: { userId, isActive: true },
          attributes: ['token']
        });
        
        const tokens = userTokens.map(t => t.token);
        if (tokens.length > 0) {
          await pushService.subscribeToTopic(tokens, topicName);
        }
      }

      return subscription;
    } catch (error) {
      logger.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  static async unsubscribeTopic(userId, topicName) {
    try {
      const topic = await NotificationTopic.findOne({ where: { name: topicName } });
      if (!topic) {
        throw new Error(`Topic ${topicName} not found`);
      }

      const subscription = await TopicSubscription.findOne({
        where: { userId, topicId: topic.id, isActive: true }
      });

      if (subscription) {
        await subscription.update({ isActive: false });

        // Unsubscribe from Firebase topic
        const userTokens = await FCMToken.findAll({
          where: { userId, isActive: true },
          attributes: ['token']
        });
        
        const tokens = userTokens.map(t => t.token);
        if (tokens.length > 0) {
          await pushService.unsubscribeFromTopic(tokens, topicName);
        }
      }

      return true;
    } catch (error) {
      logger.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  static async sendTopicNotification(topicName, title, message, metadata = {}) {
    try {
      const topic = await NotificationTopic.findOne({ 
        where: { name: topicName },
        include: [{
          model: TopicSubscription,
          where: { isActive: true },
          include: [User]
        }]
      });

      if (!topic) {
        throw new Error(`Topic ${topicName} not found`);
      }

      // Batch notifications by channel
      const pushTokens = [];
      const emailNotifications = [];
      const dbNotifications = [];

      for (const subscription of topic.TopicSubscriptions) {
        const { userId, channels } = subscription;

        if (channels.includes('database')) {
          dbNotifications.push({
            userId,
            type: `topic_${topic.type}`,
            title,
            message,
            metadata: { ...metadata, topicId: topic.id }
          });
        }

        if (channels.includes('push')) {
          const userTokens = await FCMToken.findAll({
            where: { userId, isActive: true },
            attributes: ['token']
          });
          pushTokens.push(...userTokens.map(t => t.token));
        }

        if (channels.includes('email')) {
          emailNotifications.push({
            userId,
            subject: title,
            template: 'notification',
            context: {
              title,
              message,
              ...metadata
            }
          });
        }
      }

      // Send notifications in parallel for each channel
      const notifications = [];

      if (dbNotifications.length > 0) {
        notifications.push(Notification.bulkCreate(dbNotifications));
      }

      if (pushTokens.length > 0) {
        notifications.push(
          pushService.sendPushNotification(pushTokens, title, message, {
            ...metadata,
            topicId: topic.id,
            topicName: topic.name
          })
        );
      }

      if (emailNotifications.length > 0) {
        notifications.push(
          Promise.all(emailNotifications.map(notification => 
            emailService.sendEmail(notification.userId, notification)
          ))
        );
      }

      await Promise.all(notifications);

      return { success: true };
    } catch (error) {
      logger.error('Error sending topic notification:', error);
      throw error;
    }
  }

  static async getUserNotificationPreferences(userId, type) {
    try {
      const preferences = await NotificationPreference.findOne({
        where: {
          userId,
          type,
          isEnabled: true
        }
      });

      // Return default preferences if none are set
      return preferences || {
        channels: ['database', 'push', 'email'],
        isEnabled: true,
        schedule: null
      };
    } catch (error) {
      logger.error('Error getting user notification preferences:', error);
      throw error;
    }
  }
  static async sendMultiChannelNotification(userId, title, message, metadata = {}, channels = null) {
    try {
      // Get user's preferences for this notification type
      const preferences = await this.getUserNotificationPreferences(userId, metadata.type || 'general');
      
      // Use specified channels or fall back to user preferences
      const selectedChannels = channels || preferences.channels;
      
      // Don't send notification if type is disabled for user
      if (!preferences.isEnabled) {
        logger.info(`Notification type ${metadata.type} is disabled for user ${userId}`);
        return { success: false, reason: 'notification_type_disabled' };
      }

      // Check schedule restrictions if any
      if (preferences.schedule) {
        const canSend = this.checkNotificationSchedule(preferences.schedule);
        if (!canSend) {
          logger.info(`Outside of scheduled time for notification type ${metadata.type} for user ${userId}`);
          return { success: false, reason: 'outside_schedule' };
        }
      }

      const notifications = [];

      // Database notification
      if (selectedChannels.includes('database')) {
        notifications.push(
          this.createNotification(userId, metadata.type || 'general', title, message, metadata)
        );
      }

      // Push notification
      if (selectedChannels.includes('push')) {
        const userTokens = await FCMToken.findAll({
          where: {
            userId,
            isActive: true
          },
          attributes: ['token']
        });

        const tokens = userTokens.map(t => t.token);
        if (tokens.length > 0) {
          notifications.push(
            pushService.sendPushNotification(tokens, title, message, metadata)
          );
        }
      }

      // Email notification
      if (selectedChannels.includes('email')) {
        notifications.push(
          emailService.sendEmail(userId, {
            subject: title,
            template: 'notification',
            context: {
              title,
              message,
              ...metadata
            }
          })
        );
      }

      // Wait for all notifications to be sent
      await Promise.all(notifications);

      return { success: true };
    } catch (error) {
      logger.error('Error sending multi-channel notification:', error);
      throw error;
    }
  }

  static checkNotificationSchedule(schedule) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Check if current time is within allowed hours
    if (schedule.hours) {
      const { start, end } = schedule.hours;
      if (currentHour < start || currentHour >= end) {
        return false;
      }
    }

    // Check if current day is allowed
    if (schedule.days && !schedule.days.includes(currentDay)) {
      return false;
    }

    return true;
  }
  static async createNotification(userId, type, title, message, metadata = {}) {
    try {
      return await Notification.create({
        userId,
        type,
        title,
        message,
        metadata,
        isRead: false
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async sendProgressMilestoneNotification(userId, courseId, progressPercentage) {
    try {
      const milestones = [25, 50, 75, 100];
      const milestone = milestones.find(m => Math.floor(progressPercentage) === m);
      
      if (milestone) {
        const course = await Course.findByPk(courseId);
        const title = `${milestone}% Course Progress Achievement!`;
        const message = `Congratulations! You've completed ${milestone}% of ${course.title}. Keep up the great work!`;
        
        const metadata = {
          type: 'progress_milestone',
          courseId,
          milestone,
          progressPercentage
        };
        
        await this.sendMultiChannelNotification(userId, title, message, metadata);
      }
    } catch (error) {
      logger.error('Error sending progress milestone notification:', error);
      throw error;
    }
  }

  static async sendInactivityReminder(userId, courseId, lastAccessedAt) {
    try {
      const daysInactive = Math.floor((Date.now() - new Date(lastAccessedAt)) / (1000 * 60 * 60 * 24));
      
      if (daysInactive >= 7) {
        const course = await Course.findByPk(courseId);
        const title = 'Course Inactivity Reminder';
        const message = `We noticed you haven't accessed ${course.title} for ${daysInactive} days. Don't lose your momentum!`;
        
        const metadata = {
          type: 'inactivity_reminder',
          courseId,
          daysInactive,
          lastAccessedAt
        };
        
        await this.sendMultiChannelNotification(userId, title, message, metadata);
      }
    } catch (error) {
      logger.error('Error sending inactivity reminder:', error);
      throw error;
    }
  }

  static async sendBatchProgressUpdate(batchId, progressStats) {
    try {
      const batch = await Batch.findByPk(batchId, {
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id']
          }
        ]
      });

      if (batch && batch.teacher) {
        const title = 'Batch Progress Update';
        const message = `Your batch "${batch.name}" has an average completion rate of ${Math.floor(progressStats.averageProgress)}%.`;
        
        const metadata = {
          type: 'batch_progress_update',
          batchId,
          ...progressStats
        };
        
        await this.sendMultiChannelNotification(batch.teacher.id, title, message, metadata);
      }
    } catch (error) {
      logger.error('Error sending batch progress update:', error);
      throw error;
    }
  }

  static async sendCompletionPredictionUpdate(userId, courseId, estimatedCompletionDate) {
    try {
      const course = await Course.findByPk(courseId);
      const daysToCompletion = Math.ceil((new Date(estimatedCompletionDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      const title = 'Course Completion Prediction Update';
      const message = `Based on your current progress, you're estimated to complete ${course.title} in ${daysToCompletion} days.`;
      
      const metadata = {
        type: 'completion_prediction',
        courseId,
        estimatedCompletionDate,
        daysToCompletion
      };
      
      await this.sendMultiChannelNotification(userId, title, message, metadata);
    } catch (error) {
      logger.error('Error sending completion prediction update:', error);
      throw error;
    }
  }

  static async sendLearningStreakNotification(userId, currentStreak) {
    try {
      const streakMilestones = [7, 14, 30, 60, 90];
      const milestone = streakMilestones.find(m => currentStreak === m);
      
      if (milestone) {
        const title = `${milestone}-Day Learning Streak!`;
        const message = `Amazing! You've maintained your learning streak for ${milestone} days. Keep the momentum going!`;
        
        const metadata = {
          type: 'learning_streak',
          currentStreak,
          milestone
        };
        
        await this.sendMultiChannelNotification(userId, title, message, metadata);
      }
    } catch (error) {
      logger.error('Error sending learning streak notification:', error);
      throw error;
    }
  }

  static async sendPeerProgressComparison(userId, courseId, userProgress, averageProgress) {
    try {
      const course = await Course.findByPk(courseId);
      const progressDiff = userProgress - averageProgress;
      const isAhead = progressDiff > 0;
      
      const title = 'Progress Comparison Update';
      const message = isAhead
        ? `Great work! You're ${Math.abs(Math.floor(progressDiff))}% ahead of the average in ${course.title}.`
        : `You're ${Math.abs(Math.floor(progressDiff))}% behind the average in ${course.title}. Let's catch up!`;
      
      const metadata = {
        type: 'peer_comparison',
        courseId,
        userProgress,
        averageProgress,
        progressDiff
      };
      
      await this.sendMultiChannelNotification(userId, title, message, metadata);
    } catch (error) {
      logger.error('Error sending peer progress comparison:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
