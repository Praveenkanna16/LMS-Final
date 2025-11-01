const { Progress, User } = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('./notificationService');

class LearningStreakService {
  static async updateStreak(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get user's progress from today
      const todayProgress = await Progress.findOne({
        where: {
          userId,
          updatedAt: {
            [Op.gte]: today
          }
        }
      });

      // Get user's last progress before today
      const lastProgress = await Progress.findOne({
        where: {
          userId,
          updatedAt: {
            [Op.lt]: today,
            [Op.gte]: yesterday
          }
        },
        order: [['updatedAt', 'DESC']]
      });

      // Get user's current streak from UserGamification
      const user = await User.findByPk(userId, {
        include: ['gamification']
      });

      if (!user.gamification) {
        await user.createGamification({
          totalPoints: 0,
          level: 1,
          experience: 0,
          streak: {
            current: 0,
            longest: 0,
            lastActivity: null
          }
        });
      }

      const streak = user.gamification.streak || {
        current: 0,
        longest: 0,
        lastActivity: null
      };

      if (todayProgress) {
        // If there's progress today, check if we should continue or start a new streak
        if (lastProgress) {
          // Continue streak
          streak.current += 1;
        } else {
          // Start new streak
          streak.current = 1;
        }
        streak.lastActivity = new Date();
      } else if (lastProgress) {
        // No progress today but had progress yesterday - maintain streak
        // Do nothing
      } else {
        // No progress today or yesterday - reset streak
        streak.current = 0;
      }

      // Update longest streak if current is higher
      if (streak.current > streak.longest) {
        streak.longest = streak.current;
      }

      // Update user's gamification record
      await user.gamification.update({
        streak
      });

      // Send streak notification if milestone reached
      if (streak.current > 0) {
        await NotificationService.sendLearningStreakNotification(userId, streak.current);
      }

      return streak;
    } catch (error) {
      console.error('Error updating learning streak:', error);
      throw error;
    }
  }

  static async getStreakStats(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: ['gamification']
      });

      if (!user.gamification) {
        return {
          current: 0,
          longest: 0,
          lastActivity: null
        };
      }

      return user.gamification.streak;
    } catch (error) {
      console.error('Error getting streak stats:', error);
      throw error;
    }
  }

  static async getLeaderboard(limit = 10) {
    try {
      const users = await User.findAll({
        include: ['gamification'],
        where: {
          '$gamification.streak.current$': {
            [Op.gt]: 0
          }
        },
        order: [
          [{ model: 'gamification' }, 'streak.current', 'DESC'],
          [{ model: 'gamification' }, 'streak.longest', 'DESC']
        ],
        limit
      });

      return users.map(user => ({
        userId: user.id,
        name: user.name,
        currentStreak: user.gamification.streak.current,
        longestStreak: user.gamification.streak.longest,
        lastActivity: user.gamification.streak.lastActivity
      }));
    } catch (error) {
      console.error('Error getting streak leaderboard:', error);
      throw error;
    }
  }
}

module.exports = LearningStreakService;
