const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const UserAchievement = sequelize.define('UserAchievement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id' // Map to actual database column
  },
  achievementId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'achievement_id' // Map to actual database column
  },
  earnedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'earned_at' // Map to actual database column
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100,
    validate: {
      min: 0,
      max: 100
    }
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  context: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{}'
  },
  rewardsClaimed: {
    type: DataTypes.TEXT, // JSON string for SQLite
    defaultValue: '{"points":false,"badge":false,"title":false,"unlockables":[]}'
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'points_earned' // Map to actual database column
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_featured' // Map to actual database column
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'user_achievements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['achievement_id'] },
    { fields: ['user_id', 'achievement_id'], unique: true },
    { fields: ['earned_at'] }
  ]
});

// Hooks
UserAchievement.beforeCreate(async (userAchievement) => {
  // Set points earned from achievement if not set
  if (userAchievement.pointsEarned === 0) {
    // This would need to fetch the achievement points
    // For now, set a default value
    userAchievement.pointsEarned = 10;
  }
});

// Static methods
UserAchievement.getUserAchievements = async function(userId, filters = {}) {
  const whereClause = { user_id: userId };

  return await this.findAll({
    where: whereClause,
    order: [['earned_at', 'DESC']],
    limit: filters.limit,
    offset: filters.skip || 0
  });
};

UserAchievement.getRecentAchievements = async function(userId, limit = 10) {
  return await this.findAll({
    where: { user_id: userId },
    order: [['earned_at', 'DESC']],
    limit
  });
};

UserAchievement.getAchievementStats = async function(userId) {
  const achievements = await this.findAll({
    where: { user_id: userId },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalAchievements'],
      [sequelize.fn('SUM', sequelize.col('points_earned')), 'totalPoints'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('context'))), 'categories']
    ]
  });

  const result = achievements[0] || { totalAchievements: 0, totalPoints: 0, categories: 0 };

  // Count recent unlocks (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentUnlocks = await this.count({
    where: {
      user_id: userId,
      earned_at: { [Op.gte]: thirtyDaysAgo }
    }
  });

  return {
    totalAchievements: parseInt(result.get('totalAchievements')) || 0,
    totalPoints: parseInt(result.get('totalPoints')) || 0,
    categories: parseInt(result.get('categories')) || 0,
    recentUnlocks
  };
};

// Instance methods
UserAchievement.prototype.claimRewards = async function(rewardType) {
  try {
    const rewardsClaimed = JSON.parse(this.rewardsClaimed || '{}');

    if (rewardsClaimed[rewardType]) {
      throw new Error(`${rewardType} already claimed`);
    }

    rewardsClaimed[rewardType] = true;
    this.rewardsClaimed = JSON.stringify(rewardsClaimed);

    // Add reward-specific logic here
    if (rewardType === 'points') {
      const User = require('./User');
      await User.increment('totalPoints', {
        by: this.pointsEarned,
        where: { id: this.userId }
      });
    }

    await this.save();
    return this;
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
};

UserAchievement.prototype.markAsFeatured = async function() {
  this.isFeatured = true;
  await this.save();
  return this;
};

// Associations
UserAchievement.associate = (models) => {
  UserAchievement.belongsTo(models.User, { foreignKey: 'userId' });
  UserAchievement.belongsTo(models.Achievement, { foreignKey: 'achievementId' });
};

module.exports = UserAchievement;
