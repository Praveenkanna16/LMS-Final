enhancedPaymentServices.js

const Payment = require('../models/Payment');
const Revenue = require('../models/Revenue');
const Notification = require('../models/Notification');
const Payout = require('../models/Payout');
const User = require('../models/User');
const razorpay = require('../config/razorpay');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const fcmService = require('./fcmService');

class EnhancedPaymentService {
    // Generate payment link with automatic retries
    async generatePaymentLink(data) {
        try {
            const order = await razorpay.orders.create({
                amount: data.amount * 100, // Convert to paisa
                currency: 'INR',
                receipt: rcpt_${Date.now()},
                payment_capture: 1
            });

            const payment = await Payment.create({
                amount: data.amount,
                studentId: data.studentId,
                teacherId: data.teacherId,
                batchId: data.batchId,
                source: data.source,
                orderId: order.id,
                paymentLink: ${process.env.FRONTEND_URL}/pay/${order.id}
            });

            return payment;
        } catch (error) {
            logger.error('Payment link generation failed:', error);
            throw new AppError('Failed to generate payment link', 500);
        }
    }

    // Process successful payment and create revenue record
    async processSuccessfulPayment(paymentId) {
        const payment = await Payment.findById(paymentId);
        if (!payment) throw new AppError('Payment not found', 404);

        // Create revenue record with automatic split
        const revenue = await Revenue.create({
            paymentId: payment._id,
            teacherId: payment.teacherId,
            batchId: payment.batchId,
            source: payment.source,
            totalAmount: payment.amount
        });

        // Send notification to teacher
        await this.notifyTeacher(payment.teacherId, {
            title: 'New Payment Received',
            body: You received a new payment of ₹${payment.amount},
            data: {
                type: 'payment',
                paymentId: payment._id.toString(),
                amount: payment.amount
            }
        });

        return { payment, revenue };
    }

    // Get earnings dashboard data
    async getEarningsDashboard(teacherId, filters = {}) {
        const match = { teacherId };
        if (filters.startDate) match.createdAt = { $gte: new Date(filters.startDate) };
        if (filters.endDate) match.createdAt = { $lte: new Date(filters.endDate) };
        if (filters.batchId) match.batchId = filters.batchId;

        const earnings = await Revenue.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        batchId: '$batchId',
                        source: '$source'
                    },
                    totalEarnings: { $sum: '$teacherShare' },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'batches',
                    localField: '_id.batchId',
                    foreignField: '_id',
                    as: 'batch'
                }
            }
        ]);

        return earnings;
    }

    // Request payout
    async requestPayout(teacherId, amount) {
        // Check available balance
        const totalEarnings = await Revenue.aggregate([
            {
                $match: {
                    teacherId,
                    status: 'processed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$teacherShare' }
                }
            }
        ]);

        const availableBalance = totalEarnings[0]?.total || 0;
        if (amount > availableBalance) {
            throw new AppError('Insufficient balance', 400);
        }

        const payout = await Payout.create({
            teacherId,
            amount,
            status: 'requested'
        });

        // Notify admin about payout request
        await this.notifyAdmin({
            title: 'New Payout Request',
            body: Teacher has requested a payout of ₹${amount},
            data: {
                type: 'payout_request',
                payoutId: payout._id.toString(),
                amount
            }
        });

        return payout;
    }

    // Process payout approval
    async approvePayout(payoutId) {
        const payout = await Payout.findById(payoutId);
        if (!payout) throw new AppError('Payout not found', 404);

        payout.status = 'completed';
        await payout.save();

        // Update related revenue records
        await Revenue.updateMany(
            { teacherId: payout.teacherId, status: 'processed' },
            { $set: { status: 'paid' } }
        );

        // Notify teacher
        await this.notifyTeacher(payout.teacherId, {
            title: 'Payout Approved',
            body: Your payout request of ₹${payout.amount} has been approved,
            data: {
                type: 'payout_approved',
                payoutId: payout._id.toString(),
                amount: payout.amount
            }
        });

        return payout;
    }

    // Helper method for teacher notifications
    async notifyTeacher(teacherId, notification) {
        const teacher = await User.findById(teacherId);
        if (teacher?.fcmToken) {
            await fcmService.sendNotification(teacher.fcmToken, notification);
        }
        await Notification.create({
            userId: teacherId,
            ...notification
        });
    }

    // Helper method for admin notifications
    async notifyAdmin(notification) {
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            if (admin.fcmToken) {
                await fcmService.sendNotification(admin.fcmToken, notification);
            }
            await Notification.create({
                userId: admin._id,
                ...notification
            });
        }
    }
}

module.exports = new EnhancedPaymentService();