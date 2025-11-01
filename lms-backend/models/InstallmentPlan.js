const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InstallmentPlan = sequelize.define('InstallmentPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  enrollmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'BatchEnrollments',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  downPayment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  numberOfInstallments: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2,
      max: 24
    }
  },
  installmentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  frequency: {
    type: DataTypes.ENUM('weekly', 'biweekly', 'monthly'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Annual interest rate percentage'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'defaulted', 'cancelled'),
    defaultValue: 'active'
  },
  autoDebit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether automatic payment deduction is enabled'
  },
  paymentMethodId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment method token for auto-debit'
  },
  installments: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of installment details with due dates and payment status'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata like payment gateway details, receipts, etc.'
  },
  paidInstallments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  missedInstallments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  nextDueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextDueAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  totalPaid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalOutstanding: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  gracePeriodDays: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    comment: 'Days after due date before marking as missed'
  },
  lateFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Late payment fee'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'installment_plans',
  timestamps: true,
  hooks: {
    beforeSave: (plan) => {
      // Calculate next due date and amount
      const installments = plan.installments || [];
      const unpaidInstallment = installments.find(i => i.status === 'pending' || i.status === 'overdue');
      
      if (unpaidInstallment) {
        plan.nextDueDate = unpaidInstallment.dueDate;
        plan.nextDueAmount = unpaidInstallment.amount;
      } else {
        plan.nextDueDate = null;
        plan.nextDueAmount = null;
      }

      // Calculate total paid and outstanding
      plan.totalPaid = installments
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.amount), 0);
      
      plan.totalOutstanding = parseFloat(plan.remainingAmount) - plan.totalPaid;

      // Update status
      if (plan.paidInstallments >= plan.numberOfInstallments) {
        plan.status = 'completed';
      } else if (plan.missedInstallments >= 3) {
        plan.status = 'defaulted';
      }
    }
  }
});

/**
 * Calculate EMI amount using reducing balance method
 */
InstallmentPlan.prototype.calculateEMI = function() {
  const principal = parseFloat(this.remainingAmount);
  const rate = parseFloat(this.interestRate) / 100 / 12; // Monthly rate
  const n = this.numberOfInstallments;

  if (rate === 0) {
    return (principal / n).toFixed(2);
  }

  const emi = (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  return emi.toFixed(2);
};

/**
 * Generate installment schedule
 */
InstallmentPlan.prototype.generateSchedule = function() {
  const installments = [];
  const startDate = new Date(this.startDate);
  const emiAmount = parseFloat(this.installmentAmount);

  for (let i = 0; i < this.numberOfInstallments; i++) {
    const dueDate = new Date(startDate);
    
    if (this.frequency === 'weekly') {
      dueDate.setDate(startDate.getDate() + (i * 7));
    } else if (this.frequency === 'biweekly') {
      dueDate.setDate(startDate.getDate() + (i * 14));
    } else { // monthly
      dueDate.setMonth(startDate.getMonth() + i);
    }

    installments.push({
      installmentNumber: i + 1,
      amount: emiAmount,
      dueDate: dueDate.toISOString(),
      status: 'pending',
      paidDate: null,
      paidAmount: 0,
      transactionId: null,
      paymentMethod: null,
      lateFee: 0
    });
  }

  return installments;
};

/**
 * Mark installment as paid
 */
InstallmentPlan.prototype.markInstallmentPaid = async function(installmentNumber, paymentDetails) {
  const installments = this.installments || [];
  const installment = installments.find(i => i.installmentNumber === installmentNumber);

  if (!installment) {
    throw new Error('Installment not found');
  }

  if (installment.status === 'paid') {
    throw new Error('Installment already paid');
  }

  installment.status = 'paid';
  installment.paidDate = new Date().toISOString();
  installment.paidAmount = paymentDetails.amount;
  installment.transactionId = paymentDetails.transactionId;
  installment.paymentMethod = paymentDetails.paymentMethod;

  this.paidInstallments += 1;
  this.installments = installments;

  await this.save();
};

/**
 * Check for overdue installments
 */
InstallmentPlan.prototype.checkOverdue = async function() {
  const installments = this.installments || [];
  const now = new Date();
  let hasOverdue = false;

  installments.forEach(installment => {
    if (installment.status === 'pending') {
      const dueDate = new Date(installment.dueDate);
      const gracePeriod = new Date(dueDate);
      gracePeriod.setDate(dueDate.getDate() + this.gracePeriodDays);

      if (now > gracePeriod) {
        installment.status = 'overdue';
        installment.lateFee = parseFloat(this.lateFee);
        this.missedInstallments += 1;
        hasOverdue = true;
      }
    }
  });

  if (hasOverdue) {
    this.installments = installments;
    await this.save();
  }

  return hasOverdue;
};

module.exports = InstallmentPlan;
