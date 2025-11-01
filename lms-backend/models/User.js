const { DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
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
      len: [1, 255]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
      len: [1, 255]
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [8, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin'),
    allowNull: false,
    defaultValue: 'student',
    validate: {
      isIn: [['student', 'teacher', 'admin']]
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'suspended']]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  loginIp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  // Teacher-specific fields
  approvalStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: true,
    comment: 'Teacher approval status'
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Teacher commission percentage'
  },
  maxStudentsPerBatch: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 50,
    comment: 'Maximum students allowed per batch'
  },
  // Suspension fields
  suspensionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for account suspension'
  },
  suspendedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  suspendedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Payout fields
  payoutStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    allowNull: true,
    comment: 'Current payout status for teachers'
  },
  pendingEarnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Earnings pending payout'
  },
  totalEarnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Total lifetime earnings'
  },
  availableForPayout: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Earnings available for payout'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateAuthToken = function() {
  return jwt.sign(
    {
      userId: this.id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

User.prototype.generateRefreshToken = function() {
  return jwt.sign(
    { userId: this.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
};

User.prototype.updateLevel = function() {
  // Simplified level calculation - just return basic info
  return {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    levelProgress: 0
  };
};

// Hooks
User.beforeCreate(async (user) => {
  if (user.password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
});

// Static methods
User.findByCredentials = async function(email, password) {
  const user = await this.findOne({
    where: { email }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.lastLogin = new Date();
  await user.save();

  return user;
};

User.getLeaderboard = async function(period = 'monthly') {
  const startDate = new Date();
  switch (period) {
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return await this.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
      role: { [Op.in]: ['student', 'teacher'] }
    },
    attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 50
  });
};

// Associations (to be defined after all models are created)
User.associate = (models) => {
  // User has many courses (as an instructor)
  User.hasMany(models.Course, {
    foreignKey: 'instructorId',
    as: 'instructedCourses'
  });

  // User has many enrollments
  User.hasMany(models.BatchEnrollment, {
    foreignKey: 'userId',
    as: 'enrollments'
  });

  // User has many progress records
  User.hasMany(models.Progress, {
    foreignKey: 'userId',
    as: 'progress'
  });

  // User has one profile
  User.hasOne(models.UserProfile, {
    foreignKey: 'userId',
    as: 'profile'
  });

  // User has many notifications
  User.hasMany(models.Notification, {
    foreignKey: 'userId',
    as: 'notifications'
  });

  // User has many payments
  User.hasMany(models.Payment, {
    foreignKey: 'userId',
    as: 'payments'
  });

  // User has many cart items
  User.hasMany(models.Cart, {
    foreignKey: 'userId',
    as: 'cartItems'
  });

  // User has many wishlist items
  User.hasMany(models.Wishlist, {
    foreignKey: 'userId',
    as: 'wishlistItems'
  });

  // User has many FCM tokens
  User.hasMany(models.FCMToken, {
    foreignKey: 'userId',
    as: 'fcmTokens'
  });

  // User has many notification preferences
  User.hasMany(models.NotificationPreference, {
    foreignKey: 'userId',
    as: 'notificationPreferences'
  });

  // User has many user achievements
  User.hasMany(models.UserAchievement, {
    foreignKey: 'userId',
    as: 'achievements'
  });

  // User has one gamification record
  User.hasOne(models.UserGamification, {
    foreignKey: 'userId',
    as: 'gamification'
  });

  // User has many session attendances
  User.hasMany(models.SessionAttendance, {
    foreignKey: 'userId',
    as: 'attendances'
  });

  // User has many revenues
  User.hasMany(models.Revenue, {
    foreignKey: 'userId',
    as: 'revenues'
  });

  // User has many payouts
  User.hasMany(models.Payout, {
    foreignKey: 'userId',
    as: 'payouts'
  });

  // User has many topic subscriptions
  User.hasMany(models.TopicSubscription, {
    foreignKey: 'userId',
    as: 'subscriptions'
  });

  // User has many notification logs
  User.hasMany(models.NotificationLog, {
    foreignKey: 'userId',
    as: 'notificationLogs'
  });

  // User has many teacher applications
  User.hasMany(models.TeacherApplication, {
    foreignKey: 'userId',
    as: 'teacherApplications'
  });

  // User has many application reviews (as a reviewer)
  User.hasMany(models.TeacherApplication, {
    foreignKey: 'reviewedBy',
    as: 'reviewedApplications'
  });

  // User has many notification templates created
  User.hasMany(models.NotificationTemplate, {
    foreignKey: 'createdBy',
    as: 'createdNotificationTemplates'
  });

  // User has many recorded content uploads
  User.hasMany(models.RecordedContent, {
    foreignKey: 'uploadedBy',
    as: 'uploadedContent'
  });

  // User has many generated reports
  User.hasMany(models.GeneratedReport, {
    foreignKey: 'generatedBy',
    as: 'generatedReports'
  });

  // Self-referencing association for suspension
  User.belongsTo(models.User, {
    foreignKey: 'suspendedBy',
    as: 'suspendedByUser'
  });

  User.hasMany(models.User, {
    foreignKey: 'suspendedBy',
    as: 'suspendedUsers'
  });
};

module.exports = User;
