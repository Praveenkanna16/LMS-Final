const Payment = require('../models/Payment');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const User = require('../models/User');
const cashfree = require('../config/cashfree');
const crypto = require('crypto');

// ✅ Create Payment Order (Student pays for course/batch)
exports.createPayment = async (req, res) => {
  try {
    const { batchId, courseId, amount } = req.body;
    const studentId = req.user.id;

    console.log('📤 Payment creation request:', { batchId, courseId, amount, studentId });

    // Validate inputs
    if (!amount || amount < 1) {
      console.error('❌ Invalid amount:', amount);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    if (!batchId && !courseId) {
      console.error('❌ Neither batchId nor courseId provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Either batchId or courseId is required' 
      });
    }

    // Get student details
    const student = await User.findByPk(studentId);
    if (!student) {
      console.error('❌ Student not found:', studentId);
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    console.log('✅ Student found:', { id: student.id, name: student.name, email: student.email });

    // Get batch or course details
    let batch, course, teacherId;
    
    if (batchId) {
      batch = await Batch.findByPk(batchId, {
        include: [{ model: Course, as: 'course', include: [{ model: User, as: 'teacher' }] }]
      });
      
      if (!batch) {
        console.error('❌ Batch not found:', batchId);
        return res.status(404).json({ 
          success: false, 
          message: 'Batch not found' 
        });
      }
      
      course = batch.course;
      teacherId = course.teacher.id;
      console.log('✅ Batch found:', { id: batch.id, name: batch.name, courseId: course.id });
    } else {
      course = await Course.findByPk(courseId, {
        include: [{ model: User, as: 'teacher' }]
      });
      
      if (!course) {
        return res.status(404).json({ 
          success: false, 
          message: 'Course not found' 
        });
      }
      
      teacherId = course.teacher.id;
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${studentId}`;
    
    console.log('📋 Generated order ID:', orderId);
    
    // Create Cashfree order
    const cashfreeOrderData = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `student_${studentId}`,
        customer_email: student.email,
        customer_phone: student.phone || '9999999999',
        customer_name: student.name
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/student/payment-success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/api/student/payments/webhook`
      },
      order_note: batchId 
        ? `Payment for batch: ${batch.name}` 
        : `Payment for course: ${course.title}`
    };

    console.log('🔗 Calling Cashfree API with order:', { orderId, amount, customerId: cashfreeOrderData.customer_details.customer_id });

    // Call Cashfree API to create order
    let cashfreeResponse;
    try {
      console.log('📨 Request payload to Cashfree:', JSON.stringify(cashfreeOrderData, null, 2));
      cashfreeResponse = await cashfree.createOrder(cashfreeOrderData);
      console.log('✅ Cashfree response received:', { 
        order_id: cashfreeResponse.order_id,
        payment_session_id: cashfreeResponse.payment_session_id,
        payment_link: cashfreeResponse.payment_link?.substring(0, 50) + '...'
      });
    } catch (cashfreeError) {
      console.error('❌ Cashfree API error:', { 
        message: cashfreeError.message,
        fullError: cashfreeError,
        response: cashfreeError.response?.data,
        status: cashfreeError.response?.status
      });
      throw cashfreeError;
    }

    // Save payment record in database
    const payment = await Payment.create({
      studentId,
      teacherId,
      batchId: batchId || null,
      courseId: courseId || course.id,
      amount: parseFloat(amount),
      originalAmount: parseFloat(amount),
      currency: 'INR',
      cashfreeOrderId: orderId,
      paymentMethod: 'cashfree',
      paymentGateway: 'cashfree',
      paymentLink: cashfreeResponse.payment_session_id 
        ? `https://payments${process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? '' : '-test'}.cashfree.com/forms/${cashfreeResponse.payment_session_id}` 
        : cashfreeResponse.payment_link,
      status: 'created',
      source: 'platform',
      commissionRate: 0.4,
      platformFee: Math.round(parseFloat(amount) * 0.4 * 100) / 100,
      teacherEarnings: parseFloat(amount) - Math.round(parseFloat(amount) * 0.4 * 100) / 100,
      receipt: `receipt_${Date.now()}`,
      gatewayResponse: JSON.stringify(cashfreeResponse),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: payment.cashfreeOrderId,
        paymentLink: payment.paymentLink,
        paymentSessionId: cashfreeResponse.payment_session_id,
        amount: payment.amount,
        currency: payment.currency
      }
    });

  } catch (error) {
    console.error('❌ Create payment error - Full Stack:', {
      message: error.message,
      stack: error.stack,
      errorCode: error.code,
      fullError: error.toString()
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
      details: error.response?.data || error.toString()
    });
  }
};

// ✅ Webhook - Cashfree sends payment status here
exports.handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    const signature = req.headers['x-webhook-signature'];
    
    console.log('📥 Webhook received:', JSON.stringify(webhookData, null, 2));

    // Verify webhook signature for security
    const isValid = cashfree.verifyWebhookSignature(
      webhookData,
      signature,
      process.env.CASHFREE_SECRET_KEY
    );

    if (!isValid && process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION') {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }

    const { type, data } = webhookData;
    const orderId = data?.order?.order_id;
    const paymentId = data?.payment?.cf_payment_id;
    const orderStatus = data?.order?.order_status;

    // Find payment in database
    const payment = await Payment.findOne({
      where: { cashfreeOrderId: orderId }
    });

    if (!payment) {
      console.error('❌ Payment not found for order:', orderId);
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // Handle payment status
    if (orderStatus === 'PAID') {
      console.log('✅ Payment successful:', orderId);
      
      // Update payment status
      payment.cashfreePaymentId = paymentId;
      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.gatewayResponse = JSON.stringify(data);
      
      await payment.save();

      // Grant course access / Enroll student in batch
      if (payment.batchId) {
        const batch = await Batch.findByPk(payment.batchId);
        if (batch) {
          // Add student to batch
          const BatchStudent = require('../models/BatchStudent');
          await BatchStudent.findOrCreate({
            where: {
              batchId: payment.batchId,
              studentId: payment.studentId
            },
            defaults: {
              enrolledAt: new Date(),
              status: 'active'
            }
          });
          
          // Increment batch students count
          await batch.increment('currentStudents');
        }
      }

      if (payment.courseId) {
        // Enroll student in course
        const CourseEnrollment = require('../models/CourseEnrollment');
        await CourseEnrollment.findOrCreate({
          where: {
            courseId: payment.courseId,
            studentId: payment.studentId
          },
          defaults: {
            enrolledAt: new Date(),
            progress: 0,
            status: 'active'
          }
        });
        
        // Increment course enrollment count
        const course = await Course.findByPk(payment.courseId);
        if (course) {
          await course.increment('studentsEnrolled');
        }
      }

      // Update teacher earnings
      const teacher = await User.findByPk(payment.teacherId);
      if (teacher) {
        await teacher.increment('totalEarnings', { by: payment.teacherEarnings });
        await teacher.increment('availableForPayout', { by: payment.teacherEarnings });
      }

      // TODO: Send email notification to student
      console.log('📧 Email notification should be sent to:', payment.studentId);

    } else if (orderStatus === 'FAILED') {
      console.log('❌ Payment failed:', orderId);
      
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = data?.payment?.payment_message || 'Payment failed';
      payment.gatewayResponse = JSON.stringify(data);
      
      await payment.save();

    } else if (orderStatus === 'CANCELLED') {
      console.log('🚫 Payment cancelled:', orderId);
      
      payment.status = 'cancelled';
      payment.cancelledAt = new Date();
      payment.gatewayResponse = JSON.stringify(data);
      
      await payment.save();
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

// ✅ Get payment status (check order status)
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const studentId = req.user.id;

    // Find payment in database
    const payment = await Payment.findOne({
      where: { 
        cashfreeOrderId: orderId,
        studentId 
      },
      include: [
        { model: Batch, attributes: ['id', 'name', 'startDate', 'endDate'] },
        { model: Course, attributes: ['id', 'title', 'description', 'thumbnail'] }
      ]
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // Optionally fetch latest status from Cashfree
    let cashfreeStatus = null;
    try {
      cashfreeStatus = await cashfree.getOrder(orderId);
    } catch (err) {
      console.error('Failed to fetch Cashfree status:', err.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: payment.cashfreeOrderId,
        paymentId: payment.cashfreePaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt,
        failureReason: payment.failureReason,
        batch: payment.Batch,
        course: payment.Course,
        cashfreeStatus: cashfreeStatus?.order_status || null
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
};

// ✅ Get all payments for logged-in student
exports.getMyPayments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, limit = 20, page = 1 } = req.query;

    const whereClause = { studentId };
    if (status) whereClause.status = status;

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        { model: Batch, attributes: ['id', 'name', 'startDate', 'endDate'] },
        { model: Course, attributes: ['id', 'title', 'thumbnail'] },
        { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return res.status(200).json({
      success: true,
      data: {
        payments: payments.rows,
        totalCount: payments.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(payments.count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get my payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

// ✅ Retry failed payment
exports.retryPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Find failed payment
    const payment = await Payment.findOne({
      where: { 
        id,
        studentId,
        status: 'failed'
      }
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found or cannot be retried' 
      });
    }

    if (payment.retryCount >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum retry attempts exceeded. Please create a new payment.' 
      });
    }

    // Generate new order ID
    const newOrderId = `order_${Date.now()}_${studentId}_retry${payment.retryCount + 1}`;
    
    // Get student details
    const student = await User.findByPk(studentId);
    
    // Create new Cashfree order
    const cashfreeOrderData = {
      order_id: newOrderId,
      order_amount: parseFloat(payment.amount),
      order_currency: payment.currency,
      customer_details: {
        customer_id: `student_${studentId}`,
        customer_email: student.email,
        customer_phone: student.phone || '9999999999',
        customer_name: student.name
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/student/payment-success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/api/student/payments/webhook`
      }
    };

    const cashfreeResponse = await cashfree.createOrder(cashfreeOrderData);

    // Update payment record
    payment.cashfreeOrderId = newOrderId;
    payment.cashfreePaymentId = null;
    payment.status = 'created';
    payment.paymentLink = cashfreeResponse.payment_session_id 
      ? `https://payments${process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? '' : '-test'}.cashfree.com/forms/${cashfreeResponse.payment_session_id}` 
      : cashfreeResponse.payment_link;
    payment.retryCount += 1;
    payment.gatewayResponse = JSON.stringify(cashfreeResponse);

    await payment.save();

    return res.status(200).json({
      success: true,
      message: 'Payment retry initiated',
      data: {
        orderId: newOrderId,
        paymentLink: payment.paymentLink,
        paymentSessionId: cashfreeResponse.payment_session_id
      }
    });

  } catch (error) {
    console.error('Retry payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retry payment',
      error: error.message
    });
  }
};

// ✅ Verify Payment - Called after student completes Cashfree payment
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const studentId = req.user.id;

    if (!orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Payment ID are required'
      });
    }

    // Find payment in database
    const payment = await Payment.findOne({
      where: { cashfreeOrderId: orderId, studentId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // If already verified, return success
    if (payment.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: { payment }
      });
    }

    // Get payment details from Cashfree
    const paymentDetails = await cashfree.getPayment(paymentId);

    if (paymentDetails.payment_status === 'SUCCESS') {
      // Mark payment as paid (this also handles auto-enrollment)
      await payment.markAsPaid(paymentId, signature);

      // Get batch and enroll student
      if (payment.batchId) {
        const batch = await Batch.findByPk(payment.batchId);
        if (batch) {
          try {
            await batch.addStudent(studentId, studentId);
            console.log(`✅ Student ${studentId} auto-enrolled in batch ${payment.batchId}`);
          } catch (enrollError) {
            console.warn(`Auto-enrollment info: ${enrollError.message}`);
            // Continue even if student already enrolled
          }
        }
      }

      // Create notifications
      const Notification = require('../models').Notification;
      const User = require('../models').User;
      
      const student = await User.findByPk(studentId);
      const teacher = await User.findByPk(payment.teacherId);
      const batch = await Batch.findByPk(payment.batchId);

      if (Notification && student) {
        try {
          // Notification to student
          await Notification.create({
            title: 'Payment Successful',
            message: `Your payment of ₹${payment.amount} for "${batch?.name || 'course'}" has been verified. You are now enrolled!`,
            recipientId: studentId,
            type: 'payment_success',
            category: 'financial',
            priority: 'high'
          }).catch(err => console.warn(`Notification creation: ${err.message}`));

          // Notification to teacher
          if (teacher) {
            await Notification.create({
              title: 'New Enrollment',
              message: `${student.name} has enrolled in your batch "${batch?.name}" and paid ₹${payment.amount}.`,
              recipientId: payment.teacherId,
              type: 'enrollment_notification',
              category: 'financial',
              priority: 'medium'
            }).catch(err => console.warn(`Teacher notification: ${err.message}`));
          }
        } catch (notifErr) {
          console.warn(`Notification creation failed: ${notifErr.message}`);
        }
      }

      console.log(`✅ Payment verified: ${orderId} for student ${studentId}`);

      return res.status(200).json({
        success: true,
        message: 'Payment verified and student enrolled successfully',
        data: {
          payment,
          batchId: payment.batchId,
          courseId: payment.courseId,
          studentEnrolled: true
        }
      });
    } else if (paymentDetails.payment_status === 'FAILED') {
      payment.status = 'failed';
      payment.failureReason = paymentDetails.failure_reason || 'Payment failed';
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        data: { payment }
      });
    } else {
      // Payment is still pending
      return res.status(202).json({
        success: true,
        message: 'Payment is still being processed',
        data: { payment, status: paymentDetails.payment_status }
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

module.exports = exports;
