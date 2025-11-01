const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 300]
    }
  },
  icon: {
    type: DataTypes.STRING(100),
    defaultValue: 'trophy'
  },
  category: {
    type: DataTypes.ENUM(
      'learning',
      'social',
      'progress',
      'skill',
      'participation',
      'special',
      'streak',
      'perfection'
    ),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  criteria: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{}'
  },
  rewards: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{"points":10,"badge":{},"title":"","unlockables":[]}'
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'),
    defaultValue: 'medium'
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 0
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isSecret: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRepeatable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stats: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{"totalUnlocked":0,"averageTimeToUnlock":0,"rarity":0}'
  },
  prerequisites: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '[]'
  },
  design: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{"backgroundColor":"#4F46E5","textColor":"#FFFFFF","borderColor":"#7C3AED","animation":"fadeIn"}'
  }
}, {
  tableName: 'achievements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['category'] },
    { fields: ['is_active'] },
    { fields: ['points'] },
    { fields: ['created_at'] }
  ]
});

// Hooks
Achievement.beforeCreate(async (achievement) => {
  // Calculate points based on difficulty if not set
  if (!achievement.points) {
    const difficultyPoints = {
      'easy': 10,
      'medium': 25,
      'hard': 50,
      'expert': 100
    };
    achievement.points = difficultyPoints[achievement.difficulty] || 25;
  }

  // Set reward points to match achievement points if not set
  const rewards = JSON.parse(achievement.rewards || '{}');
  if (!rewards.points) {
    rewards.points = achievement.points;
    achievement.rewards = JSON.stringify(rewards);
  }
});

// Static methods
Achievement.getAchievementsByCategory = async function(category, filters = {}) {
  const whereClause = {
    category,
    isActive: true
  };

  if (filters.difficulty) whereClause.difficulty = filters.difficulty;

  return await this.findAll({
    where: whereClause,
    order: [['points', 'DESC']],
    limit: filters.limit
  });
};

Achievement.getRareAchievements = async function(limit = 10) {
  return await this.findAll({
    where: { isActive: true },
    order: [['points', 'DESC']],
    limit
  });
};

// Instance methods
Achievement.prototype.checkCriteria = async function(userId, context = {}) {
  try {
    const UserAchievement = require('./UserAchievement');

    // Check if user already has this achievement
    const existing = await UserAchievement.findOne({
      where: {
        userId,
        achievementId: this.id
      }
    });

    if (existing && !this.isRepeatable) {
      return false;
    }

    const criteria = JSON.parse(this.criteria || '{}');
    let meetsCriteria = false;

    switch (criteria.type) {
      case 'courses_completed':
        // This would need to check user's completed courses
        meetsCriteria = (context.completedCourses || 0) >= criteria.target;
        break;

      case 'score_threshold':
        // Check user's average scores
        meetsCriteria = (context.averageScore || 0) >= criteria.target;
        break;

      case 'streak_days':
        // Check user's login streak
        meetsCriteria = (context.streak || 0) >= criteria.target;
        break;

      case 'time_spent':
        // Check total study time
        meetsCriteria = (context.totalTime || 0) >= criteria.target;
        break;

      default:
        meetsCriteria = false;
    }

    return meetsCriteria;
  } catch (error) {
    console.error('Error checking achievement criteria:', error);
    return false;
  }
};

Achievement.prototype.unlockForUser = async function(userId, context = {}) {
  try {
    const UserAchievement = require('./UserAchievement');

    // Create user achievement record
    const userAchievement = await UserAchievement.create({
      userId,
      achievementId: this.id,
      context: JSON.stringify(context),
      pointsEarned: this.points
    });

    // Update user points
    const User = require('./User');
    await User.increment('totalPoints', {
      by: this.points,
      where: { id: userId }
    });

    return userAchievement;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw error;
  }
};

// Associations
Achievement.associate = (models) => {
  Achievement.hasMany(models.UserAchievement, { foreignKey: 'achievement_id' });
  Achievement.hasMany(models.Achievement, { foreignKey: 'prerequisite_id', as: 'prerequisites' });
};

module.exports = Achievement;
