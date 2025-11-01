const db = require('../models');
const axios = require('axios');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Cashfree Payout Configuration  
const cashfreePayoutConfig = {
  clientId: process.env.CASHFREE_APP_ID,
  clientSecret: process.env.CASHFREE_SECRET_KEY,
  environment: process.env.CASHFREE_ENVIRONMENT || 'SANDBOX',
  apiVersion: '2024-01-01',
};

const cashfreePayoutBaseURL = cashfreePayoutConfig.environment === 'PRODUCTION'
  ? 'https://payout-api.cashfree.com'
  : 'https://payout-gamma.cashfree.com';

const cashfreePayoutHeaders = {
  'X-Client-Id': cashfreePayoutConfig.clientId,
  'X-Client-Secret': cashfreePayoutConfig.clientSecret,
  'X-Api-Version': cashfreePayoutConfig.apiVersion,
  'Content-Type': 'application/json',
};

// Validate Cashfree configuration
if (!cashfreePayoutConfig.clientId || !cashfreePayoutConfig.clientSecret) {
  console.error('❌ Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env file');
  throw new Error('Cashfree payment gateway not configured');
}

console.log(`✅ Cashfree Payout configured in ${cashfreePayoutConfig.environment} mode`);
console.log(`📍 API Base URL: ${cashfreePayoutBaseURL}`);

/**
 * @desc    Get all teachers with their payment history
 * @route   GET /api/admin/teacher-salaries
 * @access  Private/Admin
 */
exports.getAllTeachersWithSalaryInfo = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { role: 'teacher' };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const teachers = await db.User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'status', 'created_at'],
      include: [
        {
          model: db.TeacherBankAccount,
          as: 'bankAccount',
          required: false,
          attributes: ['account_number', 'ifsc_code', 'account_holder_name', 'bank_name', 'is_default', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Get salary payment stats for each teacher
    const teachersWithStats = await Promise.all(teachers.map(async (teacher) => {
      const payments = await db.Payment.findAll({
        where: {
          student_id: teacher.id,
          notes: {
            [Op.like]: '%"isSalary":true%'
          }
        },
        attributes: ['amount', 'status', 'created_at'],
        order: [['created_at', 'DESC']]
      });

      const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const lastPayment = payments.length > 0 ? payments[0] : null;

      return {
        ...teacher.toJSON(),
        salaryStats: {
          totalPaid,
          totalPayments: payments.length,
          pendingPayments,
          lastPaymentDate: lastPayment?.created_at || null,
          lastPaymentAmount: lastPayment?.amount || 0
        }
      };
    }));

    const total = await db.User.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        teachers: teachersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
};

/**
 * @desc    Get teacher salary payment history
 * @route   GET /api/admin/teacher-salaries/:teacherId/history
 * @access  Private/Admin
 */
exports.getTeacherPaymentHistory = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const payments = await db.Payment.findAll({
      where: {
        student_id: teacherId,
        notes: {
          [Op.like]: '%"isSalary":true%'
        }
      },
      attributes: ['id', 'amount', 'currency', 'status', 'payment_method', 'cashfree_order_id', 'notes', 'paid_at', 'created_at', 'updated_at'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const total = await db.Payment.count({
      where: {
        student_id: teacherId,
        notes: {
          [Op.like]: '%"isSalary":true%'
        }
      }
    });

    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        payments,
        stats: {
          totalPaid,
          totalPayments: total,
          completedPayments: payments.filter(p => p.status === 'completed').length,
          pendingPayments: payments.filter(p => p.status === 'pending').length,
          failedPayments: payments.filter(p => p.status === 'failed').length
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

/**
 * @desc    Initiate salary payment for teacher
 * @route   POST /api/admin/teacher-salaries/initiate
 * @access  Private/Admin
 */
exports.initiateSalaryPayment = async (req, res) => {
  try {
    const { teacherId, amount, month, year, description, paymentMode = 'bank_transfer' } = req.body;

    // Validate input
    if (!teacherId || !amount || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID, amount, month, and year are required'
      });
    }

    // Check if teacher exists
    const teacher = await db.User.findOne({
      where: { id: teacherId, role: 'teacher' },
      include: [{
        model: db.TeacherBankAccount,
        as: 'bankAccount'
      }]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if bank account exists and is verified (only for bank transfer mode)
    if (paymentMode === 'online' || paymentMode === 'bank_transfer') {
      if (!teacher.bankAccount) {
        // Allow manual payment without bank account
        if (paymentMode === 'online') {
          return res.status(400).json({
            success: false,
            message: 'Teacher bank account not found. Please add bank details first or use manual payment mode.'
          });
        }
      } else if (!teacher.bankAccount.isVerified && paymentMode === 'online') {
        return res.status(400).json({
          success: false,
          message: 'Teacher bank account is not verified yet. Use manual payment mode instead.'
        });
      }
    }

    // Check for duplicate payment for same month/year
    const existingPayment = await db.Payment.findOne({
      where: {
        student_id: teacherId,
        source: 'salary',
        notes: {
          [Op.like]: `%"month":${month}%"year":${year}%`
        },
        status: { [Op.in]: ['pending', 'completed'] }
      }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `Salary payment for ${month}/${year} already exists for this teacher.`
      });
    }

    // Generate unique order ID
    const orderId = `SALARY_${teacherId}_${Date.now()}`;

    // Create payment record in database
    const payment = await db.Payment.create({
      student_id: teacherId,
      amount: amount,
      currency: 'INR',
      status: 'pending',
      payment_method: paymentMode,
      payment_gateway: 'cashfree',
      source: 'salary',
      razorpay_order_id: orderId,
      notes: JSON.stringify({
        month,
        year,
        description: description || `Salary for ${month}/${year}`,
        paymentMode,
        initiatedBy: req.user.id,
        initiatedByName: req.user.name,
        teacherName: teacher.name,
        teacherEmail: teacher.email
      })
    });

    // Handle different payment modes
    if (paymentMode === 'online') {
      // Create Cashfree Payment Link for online payment
      try {
        const cashfreeBaseURL = cashfreePayoutConfig.environment === 'PRODUCTION'
          ? 'https://api.cashfree.com'
          : 'https://sandbox.cashfree.com';

        const cashfreeHeaders = {
          'x-client-id': cashfreePayoutConfig.clientId,
          'x-client-secret': cashfreePayoutConfig.clientSecret,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        };

        const cashfreePaymentConfig = {
          order_id: orderId,
          order_amount: parseFloat(amount),
          order_currency: 'INR',
          customer_details: {
            customer_id: `TEACHER_${teacherId}`,
            customer_name: teacher.name,
            customer_email: teacher.email,
            customer_phone: teacher.phone || '9999999999'
          },
          order_meta: {
            return_url: `${process.env.FRONTEND_URL}/admin/teacher-salaries/payment-callback/${payment.id}`,
            notify_url: `${process.env.BACKEND_URL}/api/admin/teacher-salaries/payment-webhook`,
            payment_methods: 'upi,nb,card,wallet'
          },
          order_note: `Salary payment for ${teacher.name} - ${month}/${year}`
        };

        console.log('🔄 Creating Cashfree payment order...');
        const paymentResponse = await axios.post(
          `${cashfreeBaseURL}/pg/orders`,
          cashfreePaymentConfig,
          { headers: cashfreeHeaders }
        );

        console.log('✅ Cashfree payment order created:', paymentResponse.data.order_id);

        const paymentSessionId = paymentResponse.data.payment_session_id;
        const paymentUrl = `${cashfreeBaseURL}/pg/view/order/${orderId}`;

        await payment.update({
          status: 'created',
          cashfree_order_id: orderId,
          payment_link: paymentUrl,
          notes: JSON.stringify({
            ...JSON.parse(payment.notes || '{}'),
            paymentUrl: paymentUrl,
            paymentSessionId: paymentSessionId,
            cashfreeOrderId: orderId,
            cashfreeResponse: paymentResponse.data
          })
        });

        res.json({
          success: true,
          message: 'Payment link created successfully',
          data: {
            payment,
            paymentUrl: paymentUrl,
            paymentSessionId: paymentSessionId,
            orderId: orderId,
            paymentMode: 'online'
          }
        });
      } catch (paymentError) {
        console.error('❌ Cashfree payment error:', paymentError.response?.data || paymentError.message);
        await payment.update({ status: 'failed' });
        
        res.status(500).json({
          success: false,
          message: 'Failed to create payment link',
          error: paymentError.response?.data?.message || paymentError.message
        });
      }
    } else if (paymentMode === 'bank_transfer') {
      // Direct bank transfer via Cashfree Payout API
      try {
        const bankAccount = await db.TeacherBankAccount.findOne({
          where: { teacher_id: teacherId }
        });

        if (!bankAccount) {
          return res.status(400).json({
            success: false,
            message: 'Bank account not found. Please add bank details first.'
          });
        }

        if (bankAccount.status !== 'verified') {
          return res.status(400).json({
            success: false,
            message: 'Bank account not verified. Please verify bank details first.'
          });
        }

        // First, add beneficiary to Cashfree if not already added
        const beneficiaryId = `TEACHER_${teacherId}`;
        const payoutBaseURL = cashfreePayoutConfig.apiBaseURL;
        const payoutHeaders = {
          'X-Client-Id': cashfreePayoutConfig.clientId,
          'X-Client-Secret': cashfreePayoutConfig.clientSecret,
          'Content-Type': 'application/json'
        };

        console.log('🔄 Adding/Updating beneficiary in Cashfree...');
        try {
          await axios.post(
            `${payoutBaseURL}/payout/v1/addBeneficiary`,
            {
              beneId: beneficiaryId,
              name: teacher.name,
              email: teacher.email,
              phone: teacher.phone || '9999999999',
              bankAccount: bankAccount.account_number,
              ifsc: bankAccount.ifsc_code,
              address1: bankAccount.address || 'Default Address',
              city: 'Default City',
              state: 'Default State',
              pincode: '000000'
            },
            { headers: payoutHeaders }
          );
          console.log('✅ Beneficiary added/updated successfully');
        } catch (beneError) {
          // Beneficiary might already exist, continue with transfer
          if (beneError.response?.data?.subCode !== 'BENEFICIARY_ALREADY_EXIST') {
            console.error('❌ Beneficiary error:', beneError.response?.data || beneError.message);
            throw beneError;
          }
          console.log('ℹ️ Beneficiary already exists, proceeding with transfer');
        }

        // Initiate payout transfer
        console.log('🔄 Initiating Cashfree payout transfer...');
        const transferResponse = await axios.post(
          `${payoutBaseURL}/payout/v1/requestTransfer`,
          {
            transferId: orderId,
            amount: amount.toString(),
            beneId: beneficiaryId,
            transferMode: bankAccount.upi_id ? 'upi' : 'banktransfer',
            remarks: `Salary payment ${month}/${year}`
          },
          { headers: payoutHeaders }
        );

        console.log('✅ Cashfree payout initiated:', transferResponse.data);

        const transferStatus = transferResponse.data.status;
        const isTransferSuccess = transferStatus === 'SUCCESS';
        const isTransferPending = transferStatus === 'PENDING' || transferStatus === 'ACCEPTED';

        await payment.update({
          status: isTransferSuccess ? 'paid' : (isTransferPending ? 'pending' : 'failed'),
          paid_at: isTransferSuccess ? new Date() : null,
          transaction_id: transferResponse.data.referenceId || orderId,
          cashfree_order_id: orderId,
          notes: JSON.stringify({
            ...JSON.parse(payment.notes || '{}'),
            cashfreeTransferId: orderId,
            cashfreeReferenceId: transferResponse.data.referenceId,
            transferStatus: transferStatus,
            cashfreeResponse: transferResponse.data
          })
        });

        res.json({
          success: true,
          message: isTransferSuccess 
            ? 'Bank transfer completed successfully' 
            : isTransferPending 
              ? 'Bank transfer initiated and pending' 
              : 'Bank transfer failed',
          data: {
            payment,
            paymentMode: 'bank_transfer',
            transferStatus: transferStatus,
            referenceId: transferResponse.data.referenceId,
            transferId: orderId
          }
        });
      } catch (payoutError) {
        console.error('❌ Cashfree payout error:', payoutError.response?.data || payoutError.message);
        await payment.update({ status: 'failed' });
        
        res.status(500).json({
          success: false,
          message: 'Failed to process bank transfer',
          error: payoutError.response?.data?.message || payoutError.message,
          details: payoutError.response?.data
        });
      }
    } else {
      // Manual payment mode
      res.json({
        success: true,
        message: 'Salary payment record created for manual processing',
        data: {
          payment,
          paymentMode: 'manual'
        }
      });
    }
  } catch (error) {
    console.error('❌ Error initiating salary payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate salary payment',
      error: error.message
    });
  }
};

/**
 * @desc    Mark salary payment as completed (manual payment)
 * @route   PUT /api/admin/teacher-salaries/:paymentId/complete
 * @access  Private/Admin
 */
exports.markPaymentCompleted = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { transactionId, remarks } = req.body;

    const payment = await db.Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment is already completed'
      });
    }

    const notes = JSON.parse(payment.notes || '{}');
    notes.completedBy = req.user.id;
    notes.completedByName = req.user.name;
    notes.completedAt = new Date();
    notes.remarks = remarks;

    await payment.update({
      status: 'completed',
      transaction_id: transactionId || payment.transaction_id,
      notes: JSON.stringify(notes),
      paid_at: new Date()
    });

    res.json({
      success: true,
      message: 'Payment marked as completed',
      data: { payment }
    });
  } catch (error) {
    console.error('❌ Error completing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete payment',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel salary payment
 * @route   PUT /api/admin/teacher-salaries/:paymentId/cancel
 * @access  Private/Admin
 */
exports.cancelPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await db.Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed payment'
      });
    }

    const notes = JSON.parse(payment.notes || '{}');
    notes.cancelledBy = req.user.id;
    notes.cancelledByName = req.user.name;
    notes.cancelledAt = new Date();
    notes.cancellationReason = reason;

    await payment.update({
      status: 'cancelled',
      notes: JSON.stringify(notes)
    });

    res.json({
      success: true,
      message: 'Payment cancelled',
      data: { payment }
    });
  } catch (error) {
    console.error('❌ Error cancelling payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel payment',
      error: error.message
    });
  }
};

/**
 * @desc    Get salary payment statistics
 * @route   GET /api/admin/teacher-salaries/stats
 * @access  Private/Admin
 */
exports.getSalaryStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let whereClause = { 
      notes: {
        [Op.like]: '%"isSalary":true%'
      }
    };
    
    if (year && month) {
      whereClause.notes = {
        [Op.and]: [
          { [Op.like]: '%"isSalary":true%' },
          { [Op.like]: `%"month":${month}%"year":${year}%` }
        ]
      };
    }

    const payments = await db.Payment.findAll({
      where: whereClause,
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']
      ],
      group: ['status']
    });

    const stats = {
      totalPayments: 0,
      totalAmount: 0,
      completedPayments: 0,
      completedAmount: 0,
      pendingPayments: 0,
      pendingAmount: 0,
      failedPayments: 0,
      failedAmount: 0
    };

    payments.forEach(payment => {
      const count = parseInt(payment.dataValues.count);
      const total = parseFloat(payment.dataValues.total || 0);
      
      stats.totalPayments += count;
      stats.totalAmount += total;
      
      if (payment.status === 'completed') {
        stats.completedPayments = count;
        stats.completedAmount = total;
      } else if (payment.status === 'pending' || payment.status === 'processing') {
        stats.pendingPayments += count;
        stats.pendingAmount += total;
      } else if (payment.status === 'failed' || payment.status === 'cancelled') {
        stats.failedPayments += count;
        stats.failedAmount += total;
      }
    });

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('❌ Error fetching salary stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get or create teacher bank account
 * @route   POST /api/admin/teacher-salaries/:teacherId/bank-account
 * @access  Private/Admin
 */
exports.updateTeacherBankAccount = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { accountNumber, ifscCode, accountHolderName, bankName, branchName } = req.body;

    // Validate input
    if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'All bank details are required'
      });
    }

    // Check if teacher exists
    const teacher = await db.User.findOne({
      where: { id: teacherId, role: 'teacher' }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Create or update bank account
    const [bankAccount, created] = await db.TeacherBankAccount.findOrCreate({
      where: { teacherId },
      defaults: {
        accountNumber,
        ifscCode,
        accountHolderName,
        bankName,
        branchName,
        isVerified: false
      }
    });

    if (!created) {
      await bankAccount.update({
        accountNumber,
        ifscCode,
        accountHolderName,
        bankName,
        branchName,
        isVerified: false // Reset verification on update
      });
    }

    res.json({
      success: true,
      message: created ? 'Bank account added successfully' : 'Bank account updated successfully',
      data: { bankAccount }
    });
  } catch (error) {
    console.error('❌ Error updating bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank account',
      error: error.message
    });
  }
};

/**
 * @desc    Cashfree payment gateway webhook handler
 * @route   POST /api/admin/teacher-salaries/payment-webhook
 * @access  Public (Cashfree webhook)
 */
exports.handlePaymentWebhook = async (req, res) => {
  try {
    console.log('📥 Received Cashfree payment webhook:', req.body);
    
    const { orderId, orderAmount, orderStatus, paymentMode, signature } = req.body;
    
    // TODO: Verify signature for security
    // const isValid = verifyCashfreeSignature(req.body, signature);
    // if (!isValid) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature' });
    // }
    
    // Find payment by orderId
    const payment = await db.Payment.findOne({
      where: { cashfree_order_id: orderId }
    });
    
    if (!payment) {
      console.error('❌ Payment not found for orderId:', orderId);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Update payment status based on Cashfree status
    let newStatus = payment.status;
    let paidAt = payment.paid_at;
    
    if (orderStatus === 'PAID' || orderStatus === 'SUCCESS') {
      newStatus = 'paid';
      paidAt = new Date();
    } else if (orderStatus === 'ACTIVE' || orderStatus === 'PENDING') {
      newStatus = 'pending';
    } else if (orderStatus === 'EXPIRED' || orderStatus === 'CANCELLED') {
      newStatus = 'cancelled';
    } else if (orderStatus === 'FAILED') {
      newStatus = 'failed';
    }
    
    // Update payment record
    await payment.update({
      status: newStatus,
      paid_at: paidAt,
      notes: JSON.stringify({
        ...JSON.parse(payment.notes || '{}'),
        webhookData: req.body,
        webhookReceivedAt: new Date()
      })
    });
    
    console.log(`✅ Payment ${payment.id} updated to ${newStatus}`);
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Error processing payment webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
};

/**
 * @desc    Cashfree payout webhook handler
 * @route   POST /api/admin/teacher-salaries/payout-webhook
 * @access  Public (Cashfree webhook)
 */
exports.handlePayoutWebhook = async (req, res) => {
  try {
    console.log('📥 Received Cashfree payout webhook:', req.body);
    
    const { transferId, status, amount, utr, signature } = req.body;
    
    // TODO: Verify signature for security
    // const isValid = verifyCashfreeSignature(req.body, signature);
    // if (!isValid) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature' });
    // }
    
    // Find payment by transferId (orderId)
    const payment = await db.Payment.findOne({
      where: { cashfree_order_id: transferId }
    });
    
    if (!payment) {
      console.error('❌ Payment not found for transferId:', transferId);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Update payment status based on Cashfree payout status
    let newStatus = payment.status;
    let paidAt = payment.paid_at;
    let transactionId = payment.transaction_id;
    
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      newStatus = 'paid';
      paidAt = new Date();
      transactionId = utr || transactionId;
    } else if (status === 'PENDING' || status === 'ACCEPTED' || status === 'PROCESSING') {
      newStatus = 'pending';
    } else if (status === 'REVERSED' || status === 'CANCELLED') {
      newStatus = 'cancelled';
    } else if (status === 'FAILED' || status === 'REJECTED') {
      newStatus = 'failed';
    }
    
    // Update payment record
    await payment.update({
      status: newStatus,
      paid_at: paidAt,
      transaction_id: transactionId,
      notes: JSON.stringify({
        ...JSON.parse(payment.notes || '{}'),
        webhookData: req.body,
        webhookReceivedAt: new Date(),
        utr: utr
      })
    });
    
    console.log(`✅ Payout ${payment.id} updated to ${newStatus}, UTR: ${utr}`);
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Error processing payout webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
};
