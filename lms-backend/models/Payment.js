const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Gateway specific fields
  razorpayOrderId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'razorpay_order_id' // Map to actual database column
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'razorpay_payment_id' // Map to actual database column
  },
  razorpaySignature: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'razorpay_signature' // Map to actual database column
  },
  cashfreeOrderId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'cashfree_order_id' // Map to actual database column
  },
  cashfreePaymentId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'cashfree_payment_id' // Map to actual database column
  },
  cashfreeSignature: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'cashfree_signature' // Map to actual database column
  },
  // Foreign keys
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'student_id' // Map to actual database column
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'teacher_id' // Map to actual database column
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'batches',
      key: 'id'
    },
    field: 'batch_id' // Map to actual database column
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    },
    field: 'course_id' // Map to actual database column
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'created_by_id' // Map to actual database column
  },
  updatedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'updated_by_id' // Map to actual database column
  },
  // Payment amounts
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 1
    }
  },
  currency: {
    type: DataTypes.ENUM('INR', 'USD', 'EUR'),
    defaultValue: 'INR'
  },
  originalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  // Payment method
  paymentMethod: {
    type: DataTypes.ENUM('card', 'netbanking', 'wallet', 'upi', 'emi', 'cashfree'),
    allowNull: false
  },
  paymentGateway: {
    type: DataTypes.ENUM('razorpay', 'stripe', 'cashfree'),
    defaultValue: 'cashfree'
  },
  // Revenue sharing
  source: {
    type: DataTypes.ENUM('platform', 'teacher'),
    allowNull: false
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    validate: {
      min: 0,
      max: 1
    }
  },
  // Calculated amounts
  platformFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  teacherEarnings: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  // Payment status
  status: {
    type: DataTypes.ENUM(
      'created',      // Order created
      'paid',         // Payment successful
      'failed',       // Payment failed
      'cancelled',    // Payment cancelled
      'refunded',     // Payment refunded
      'partial_refund' // Partial refund
    ),
    defaultValue: 'created'
  },
  // Refund information
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  refundReason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Gateway response
  gatewayResponse: {
    type: DataTypes.TEXT, // Store as JSON string for SQLite
    defaultValue: '{}'
  },
  // Metadata
  paymentLink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  receipt: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // Timestamps
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Failure information
  failureReason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      max: 3
    }
  },
  // Enrollment information
  enrollmentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  enrolledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Analytics
  utmSource: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  utmMedium: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  utmCampaign: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  referrer: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  // Audit trail - handled above (createdById, updatedById)
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['razorpay_order_id'] },
    { fields: ['cashfree_order_id'] },
    { fields: ['student_id'] },
    { fields: ['teacher_id'] },
    { fields: ['batch_id'] },
    { fields: ['course_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['source'] }
  ]
});

// Hooks
Payment.beforeCreate(async (payment) => {
  // Generate receipt if not provided
  if (!payment.receipt) {
    payment.receipt = `receipt_${Date.now()}`;
  }

  // Calculate platform fee and teacher earnings based on source
  if (payment.source === 'platform') {
    payment.commissionRate = 0.4; // 40% platform, 60% teacher
  } else {
    payment.commissionRate = 0.6; // 60% platform, 40% teacher
  }

  payment.platformFee = Math.round(payment.amount * payment.commissionRate * 100) / 100;
  payment.teacherEarnings = payment.amount - payment.platformFee;

  // Set paid timestamp
  if (payment.status === 'paid' && !payment.paidAt) {
    payment.paidAt = new Date();
  }
});

Payment.beforeUpdate(async (payment) => {
  // Update timestamps based on status
  if (payment.changed('status')) {
    if (payment.status === 'paid' && !payment.paidAt) {
      payment.paidAt = new Date();
    } else if (payment.status === 'failed' && !payment.failedAt) {
      payment.failedAt = new Date();
    } else if (payment.status === 'cancelled' && !payment.cancelledAt) {
      payment.cancelledAt = new Date();
    }
  }
});

// Static methods
Payment.getPaymentsByStudent = async function(studentId, options = {}) {
  const whereClause = { student_id: studentId };

  if (options.status) whereClause.status = options.status;

  return await this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.skip || 0
  });
};

Payment.getPaymentsByTeacher = async function(teacherId, options = {}) {
  const whereClause = { teacher_id: teacherId };

  if (options.status) whereClause.status = options.status;
  if (options.dateFrom) whereClause.created_at = { [Op.gte]: options.dateFrom };
  if (options.dateTo) whereClause.created_at = { ...whereClause.created_at, [Op.lte]: options.dateTo };

  return await this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']]
  });
};

Payment.getRevenueAnalytics = async function(options = {}) {
  const whereClause = { status: 'paid' };

  if (options.source) whereClause.source = options.source;
  if (options.dateFrom) whereClause.created_at = { [Op.gte]: options.dateFrom };
  if (options.dateTo) whereClause.created_at = { ...whereClause.created_at, [Op.lte]: options.dateTo };

  const payments = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('YEAR', sequelize.col('created_at')), 'year'],
      [sequelize.fn('MONTH', sequelize.col('created_at')), 'month'],
      'source',
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      [sequelize.fn('SUM', sequelize.col('platform_fee')), 'totalPlatformFee'],
      [sequelize.fn('SUM', sequelize.col('teacher_earnings')), 'totalTeacherEarnings'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['year', 'month', 'source'],
    order: [['year', 'DESC'], ['month', 'DESC']]
  });

  return payments;
};

Payment.getPaymentStats = async function(options = {}) {
  const whereClause = { status: 'paid' };

  if (options.dateFrom) whereClause.created_at = { [Op.gte]: options.dateFrom };
  if (options.dateTo) whereClause.created_at = { ...whereClause.created_at, [Op.lte]: options.dateTo };

  const result = await this.findOne({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayments'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      [sequelize.fn('SUM', sequelize.col('platform_fee')), 'totalPlatformFee'],
      [sequelize.fn('SUM', sequelize.col('teacher_earnings')), 'totalTeacherEarnings'],
      [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount']
    ]
  });

  return result;
};

// Instance methods
Payment.prototype.refund = async function(amount, reason) {
  if (this.status !== 'paid') {
    throw new Error('Only paid payments can be refunded');
  }

  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }

  this.status = amount === this.amount ? 'refunded' : 'partial_refund';
  this.refundAmount = amount;
  this.refundReason = reason;
  this.refundedAt = new Date();

  await this.save();

  // Update teacher's available payout
  const User = require('./User');
  await User.decrement('availableForPayout', {
    by: amount,
    where: { id: this.teacherId }
  });

  return this;
};

Payment.prototype.markAsPaid = async function(paymentId, signature) {
  // Handle both Razorpay and Cashfree
  if (this.paymentGateway === 'cashfree') {
    this.cashfreePaymentId = paymentId;
    this.cashfreeSignature = signature;
  } else {
    this.razorpayPaymentId = paymentId;
    this.razorpaySignature = signature;
  }

  this.status = 'paid';
  this.paidAt = new Date();

  await this.save();

  // Update teacher's earnings
  const User = require('./User');
  await User.increment(
    ['totalEarnings', 'availableForPayout'],
    {
      by: this.teacherEarnings,
      where: { id: this.teacherId }
    }
  );

  // Update course enrollment count
  const Course = require('./Course');
  await Course.increment('studentsEnrolled', { where: { id: this.courseId } });

  // Enroll student in batch
  const Batch = require('./Batch');
  await Batch.findByPk(this.batchId).then(async (batch) => {
    if (batch) {
      await batch.addStudent(this.studentId);
    }
  });

  return this;
};

Payment.prototype.markAsFailed = async function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failedAt = new Date();

  await this.save();
  return this;
};

Payment.prototype.retryPayment = async function() {
  if (this.retryCount >= 3) {
    throw new Error('Maximum retry attempts exceeded');
  }

  this.retryCount += 1;
  this.status = 'created';
  this.razorpayPaymentId = null;
  this.razorpaySignature = null;
  this.cashfreePaymentId = null;
  this.cashfreeSignature = null;

  await this.save();
  return this;
};

// Associations
Payment.associate = (models) => {
  Payment.belongsTo(models.User, { foreignKey: 'studentId', as: 'student' });
  Payment.belongsTo(models.User, { foreignKey: 'teacherId', as: 'teacher' });
  Payment.belongsTo(models.Batch, { foreignKey: 'batchId' });
  Payment.belongsTo(models.Course, { foreignKey: 'courseId' });
  Payment.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' });
  Payment.belongsTo(models.User, { foreignKey: 'updatedById', as: 'updatedBy' });
};

module.exports = Payment;
