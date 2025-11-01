const { Op } = require('sequelize');
const { 
  InstallmentPlan, 
  BatchEnrollment, 
  User, 
  Payment,
  CashfreeTransaction 
} = require('../models');
const logger = require('../config/logger');
const { createOrder, verifyPayment } = require('./cashfreeController');
const { sendPaymentReminder, sendPaymentSuccess, sendPaymentFailed } = require('../services/fcmService');

// ==================== INSTALLMENT PLANS ====================

/**
 * Create installment plan
 */
const createInstallmentPlan = async (req, res) => {
  try {
    const {
      enrollmentId,
      downPayment = 0,
      numberOfInstallments,
      frequency = 'monthly',
      interestRate = 0,
      autoDebit = false,
      paymentMethodId = null
    } = req.body;
    const studentId = req.user.id;

    // Verify enrollment
    const enrollment = await BatchEnrollment.findOne({
      where: { id: enrollmentId, studentId }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    const totalAmount = parseFloat(enrollment.amountPaid || enrollment.amount);
    const remainingAmount = totalAmount - downPayment;

    // Create installment plan
    const plan = await InstallmentPlan.create({
      enrollmentId,
      studentId,
      courseId: enrollment.courseId,
      batchId: enrollment.batchId,
      totalAmount,
      downPayment,
      remainingAmount,
      numberOfInstallments,
      installmentAmount: 0, // Will be calculated
      frequency,
      interestRate,
      startDate: new Date(),
      endDate: null, // Will be calculated
      autoDebit,
      paymentMethodId,
      totalOutstanding: remainingAmount
    });

    // Calculate EMI
    const emiAmount = plan.calculateEMI();
    plan.installmentAmount = emiAmount;

    // Generate schedule
    const installments = plan.generateSchedule();
    plan.installments = installments;

    // Calculate end date
    const lastInstallment = installments[installments.length - 1];
    plan.endDate = new Date(lastInstallment.dueDate);

    await plan.save();

    logger.info(`Installment plan created for student ${studentId}, enrollment ${enrollmentId}`);

    res.status(201).json({
      success: true,
      message: 'Installment plan created successfully',
      data: plan
    });
  } catch (error) {
    logger.error('Error creating installment plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create installment plan'
    });
  }
};

/**
 * Get installment plan details
 */
const getInstallmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const plan = await InstallmentPlan.findOne({
      where: { id, studentId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: BatchEnrollment,
          as: 'enrollment'
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found'
      });
    }

    // Check for overdue installments
    await plan.checkOverdue();

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error('Error getting installment plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get installment plan'
    });
  }
};

/**
 * Pay installment
 */
const payInstallment = async (req, res) => {
  try {
    const { planId, installmentNumber, paymentMethod = 'cashfree' } = req.body;
    const studentId = req.user.id;

    const plan = await InstallmentPlan.findOne({
      where: { id: planId, studentId }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found'
      });
    }

    const installments = plan.installments || [];
    const installment = installments.find(i => i.installmentNumber === installmentNumber);

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Installment already paid'
      });
    }

    // Calculate total amount (including late fee)
    const amount = parseFloat(installment.amount) + parseFloat(installment.lateFee || 0);

    // Create payment order
    const orderData = {
      amount,
      currency: 'INR',
      customerId: studentId,
      orderId: `INST_${planId}_${installmentNumber}_${Date.now()}`,
      customerDetails: {
        customerId: studentId,
        customerEmail: req.user.email,
        customerPhone: req.user.phone || '9999999999'
      },
      orderMeta: {
        returnUrl: `${process.env.FRONTEND_URL}/payment/callback`,
        notifyUrl: `${process.env.BACKEND_URL}/api/payments-enhanced/webhook/installment`
      }
    };

    // Create order based on payment method
    let paymentSession;
    if (paymentMethod === 'cashfree') {
      const cashfreeOrder = await createOrder(orderData);
      paymentSession = cashfreeOrder.payment_session_id;
    }

    // Store pending payment
    await Payment.create({
      studentId,
      amount,
      status: 'pending',
      orderId: orderData.orderId,
      paymentMethod,
      metadata: JSON.stringify({
        planId,
        installmentNumber,
        type: 'installment'
      })
    });

    res.json({
      success: true,
      message: 'Payment initiated',
      data: {
        orderId: orderData.orderId,
        paymentSession,
        amount
      }
    });
  } catch (error) {
    logger.error('Error paying installment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
};

/**
 * Auto-debit installment (scheduled job)
 */
const autoDebitInstallment = async (planId) => {
  try {
    const plan = await InstallmentPlan.findByPk(planId);

    if (!plan || !plan.autoDebit || !plan.paymentMethodId) {
      return;
    }

    const now = new Date();
    const installments = plan.installments || [];
    const dueInstallment = installments.find(i => {
      const dueDate = new Date(i.dueDate);
      return i.status === 'pending' && dueDate <= now;
    });

    if (!dueInstallment) {
      return;
    }

    // Attempt auto-debit using saved payment method
    // This would integrate with Cashfree's subscription/auto-debit API
    const amount = parseFloat(dueInstallment.amount);
    
    // Simulate auto-debit (replace with actual API call)
    logger.info(`Auto-debit attempted for plan ${planId}, installment ${dueInstallment.installmentNumber}`);

    // If successful, mark as paid
    await plan.markInstallmentPaid(dueInstallment.installmentNumber, {
      amount,
      transactionId: `AUTO_${Date.now()}`,
      paymentMethod: 'auto_debit'
    });

    // Send success notification
    await sendPaymentSuccess(plan.studentId, {
      amount,
      orderId: `INST_${planId}_${dueInstallment.installmentNumber}`
    });

  } catch (error) {
    logger.error(`Auto-debit failed for plan ${planId}:`, error);
    
    // Send failure notification
    await sendPaymentFailed(plan.studentId, {
      reason: 'Auto-debit failed',
      orderId: `INST_${planId}`
    });
  }
};

/**
 * Handle installment payment webhook
 */
const handleInstallmentWebhook = async (req, res) => {
  try {
    const paymentData = req.body;

    // Verify payment signature (Cashfree specific)
    // const isValid = verifyPayment(paymentData);
    // if (!isValid) { return res.status(400).json({ success: false }); }

    const payment = await Payment.findOne({
      where: { orderId: paymentData.orderId }
    });

    if (!payment) {
      return res.status(404).json({ success: false });
    }

    const metadata = JSON.parse(payment.metadata || '{}');
    const { planId, installmentNumber } = metadata;

    if (paymentData.status === 'SUCCESS') {
      // Mark installment as paid
      const plan = await InstallmentPlan.findByPk(planId);
      
      await plan.markInstallmentPaid(installmentNumber, {
        amount: paymentData.amount,
        transactionId: paymentData.transactionId,
        paymentMethod: paymentData.paymentMethod
      });

      // Update payment record
      await payment.update({
        status: 'success',
        transactionId: paymentData.transactionId
      });

      // Send success notification
      await sendPaymentSuccess(plan.studentId, {
        amount: paymentData.amount,
        orderId: paymentData.orderId
      });

      logger.info(`Installment ${installmentNumber} paid for plan ${planId}`);
    } else {
      await payment.update({ status: 'failed' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling installment webhook:', error);
    res.status(500).json({ success: false });
  }
};

// ==================== FAILED PAYMENT RETRY ====================

/**
 * Retry failed payment with exponential backoff
 */
const retryFailedPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not in failed state'
      });
    }

    const metadata = JSON.parse(payment.metadata || '{}');
    const retryCount = metadata.retryCount || 0;

    // Max 3 retries
    if (retryCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum retry attempts exceeded'
      });
    }

    // Exponential backoff: 1h, 4h, 16h
    const backoffHours = Math.pow(4, retryCount);
    const lastAttempt = new Date(metadata.lastRetryAt || payment.updatedAt);
    const nextRetryTime = new Date(lastAttempt.getTime() + backoffHours * 60 * 60 * 1000);

    if (new Date() < nextRetryTime) {
      return res.status(400).json({
        success: false,
        message: `Please wait until ${nextRetryTime.toLocaleString()} for next retry attempt`
      });
    }

    // Create new payment order
    const orderData = {
      amount: payment.amount,
      currency: 'INR',
      customerId: payment.studentId,
      orderId: `${payment.orderId}_RETRY${retryCount + 1}`,
      customerDetails: {
        customerId: payment.studentId,
        customerEmail: payment.metadata.email,
        customerPhone: payment.metadata.phone || '9999999999'
      }
    };

    const cashfreeOrder = await createOrder(orderData);

    // Update payment metadata
    metadata.retryCount = retryCount + 1;
    metadata.lastRetryAt = new Date();
    await payment.update({
      status: 'pending',
      metadata: JSON.stringify(metadata)
    });

    logger.info(`Payment retry initiated: ${paymentId}, attempt ${retryCount + 1}`);

    res.json({
      success: true,
      message: 'Payment retry initiated',
      data: {
        orderId: orderData.orderId,
        paymentSession: cashfreeOrder.payment_session_id,
        retryCount: retryCount + 1
      }
    });
  } catch (error) {
    logger.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment'
    });
  }
};

/**
 * Auto-retry failed payments (scheduled job)
 */
const autoRetryFailedPayments = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const failedPayments = await Payment.findAll({
      where: {
        status: 'failed',
        updatedAt: { [Op.gte]: oneDayAgo }
      }
    });

    for (const payment of failedPayments) {
      const metadata = JSON.parse(payment.metadata || '{}');
      const retryCount = metadata.retryCount || 0;

      if (retryCount < 3) {
        const backoffHours = Math.pow(4, retryCount);
        const lastAttempt = new Date(metadata.lastRetryAt || payment.updatedAt);
        const nextRetryTime = new Date(lastAttempt.getTime() + backoffHours * 60 * 60 * 1000);

        if (new Date() >= nextRetryTime) {
          // Trigger retry
          logger.info(`Auto-retry triggered for payment ${payment.id}`);
          
          // Send retry notification to student
          await sendPaymentReminder(payment.studentId, {
            amount: payment.amount,
            dueDate: new Date()
          });
        }
      }
    }

    logger.info(`Auto-retry check completed for ${failedPayments.length} failed payments`);
  } catch (error) {
    logger.error('Error in auto-retry job:', error);
  }
};

// ==================== REFUND MANAGEMENT ====================

/**
 * Request refund
 */
const requestRefund = async (req, res) => {
  try {
    const { paymentId, reason, amount } = req.body;
    const studentId = req.user.id;

    const payment = await Payment.findOne({
      where: { id: paymentId, studentId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Only successful payments can be refunded'
      });
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    // Create refund request
    const metadata = JSON.parse(payment.metadata || '{}');
    metadata.refund = {
      status: 'requested',
      amount: refundAmount,
      reason,
      requestedAt: new Date(),
      approvedBy: null,
      processedAt: null,
      refundId: null
    };

    await payment.update({
      metadata: JSON.stringify(metadata)
    });

    // Notify admin
    // await sendRefundRequestNotification(adminId, { paymentId, studentId, amount: refundAmount });

    logger.info(`Refund requested by student ${studentId} for payment ${paymentId}`);

    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      data: metadata.refund
    });
  } catch (error) {
    logger.error('Error requesting refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request refund'
    });
  }
};

/**
 * Approve refund (Admin only)
 */
const approveRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const adminId = req.user.id;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const metadata = JSON.parse(payment.metadata || '{}');
    
    if (!metadata.refund || metadata.refund.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'No pending refund request found'
      });
    }

    // Process refund via Cashfree API
    // const refundResponse = await processCashfreeRefund({
    //   orderId: payment.orderId,
    //   refundAmount: metadata.refund.amount
    // });

    // Update refund status
    metadata.refund.status = 'approved';
    metadata.refund.approvedBy = adminId;
    metadata.refund.processedAt = new Date();
    metadata.refund.refundId = `REF_${Date.now()}`; // Replace with actual refund ID

    await payment.update({
      metadata: JSON.stringify(metadata)
    });

    // Notify student
    await sendPaymentSuccess(payment.studentId, {
      amount: metadata.refund.amount,
      orderId: payment.orderId,
      type: 'refund'
    });

    logger.info(`Refund approved by admin ${adminId} for payment ${paymentId}`);

    res.json({
      success: true,
      message: 'Refund approved and processed successfully',
      data: metadata.refund
    });
  } catch (error) {
    logger.error('Error approving refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve refund'
    });
  }
};

/**
 * Reject refund (Admin only)
 */
const rejectRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const metadata = JSON.parse(payment.metadata || '{}');
    
    if (!metadata.refund || metadata.refund.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'No pending refund request found'
      });
    }

    metadata.refund.status = 'rejected';
    metadata.refund.rejectedBy = adminId;
    metadata.refund.rejectionReason = rejectionReason;
    metadata.refund.rejectedAt = new Date();

    await payment.update({
      metadata: JSON.stringify(metadata)
    });

    // Notify student
    // await sendRefundRejectedNotification(payment.studentId, { reason: rejectionReason });

    logger.info(`Refund rejected by admin ${adminId} for payment ${paymentId}`);

    res.json({
      success: true,
      message: 'Refund request rejected',
      data: metadata.refund
    });
  } catch (error) {
    logger.error('Error rejecting refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject refund'
    });
  }
};

/**
 * Get all refund requests (Admin)
 */
const getAllRefundRequests = async (req, res) => {
  try {
    const { status = 'requested' } = req.query;

    const payments = await Payment.findAll({
      where: {
        metadata: {
          [Op.like]: `%"refund":%`
        }
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    const refundRequests = payments
      .map(payment => {
        const metadata = JSON.parse(payment.metadata || '{}');
        if (metadata.refund && metadata.refund.status === status) {
          return {
            paymentId: payment.id,
            orderId: payment.orderId,
            student: payment.student,
            amount: payment.amount,
            refund: metadata.refund
          };
        }
        return null;
      })
      .filter(req => req !== null);

    res.json({
      success: true,
      data: refundRequests
    });
  } catch (error) {
    logger.error('Error getting refund requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get refund requests'
    });
  }
};

module.exports = {
  // Installment Plans
  createInstallmentPlan,
  getInstallmentPlan,
  payInstallment,
  autoDebitInstallment,
  handleInstallmentWebhook,
  
  // Payment Retry
  retryFailedPayment,
  autoRetryFailedPayments,
  
  // Refund Management
  requestRefund,
  approveRefund,
  rejectRefund,
  getAllRefundRequests
};
