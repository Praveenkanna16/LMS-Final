const enhancedPaymentService = require('../services/enhancedPaymentService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Generate payment link
// @route   POST /api/payments/generate-link
// @access  Private
exports.generatePaymentLink = asyncHandler(async (req, res) => {
    const payment = await enhancedPaymentService.generatePaymentLink(req.body);
    res.status(201).json({
        success: true,
        data: payment
    });
});

// @desc    Process successful payment
// @route   POST /api/payments/success
// @access  Private
exports.processPayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.body;
    const result = await enhancedPaymentService.processSuccessfulPayment(paymentId);
    res.status(200).json({
        success: true,
        data: result
    });
});

// @desc    Get earnings dashboard
// @route   GET /api/payments/earnings
// @access  Private/Teacher
exports.getEarningsDashboard = asyncHandler(async (req, res) => {
    const earnings = await enhancedPaymentService.getEarningsDashboard(
        req.user._id,
        req.query
    );
    res.status(200).json({
        success: true,
        data: earnings
    });
});

// @desc    Request payout
// @route   POST /api/payments/request-payout
// @access  Private/Teacher
exports.requestPayout = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const payout = await enhancedPaymentService.requestPayout(req.user._id, amount);
    res.status(201).json({
        success: true,
        data: payout
    });
});

// @desc    Approve payout
// @route   POST /api/payments/approve-payout/:id
// @access  Private/Admin
exports.approvePayout = asyncHandler(async (req, res) => {
    const payout = await enhancedPaymentService.approvePayout(req.params.id);
    res.status(200).json({
        success: true,
        data: payout
    });
});

// @desc    Export earnings report
// @route   GET /api/payments/export-earnings
// @access  Private/Teacher
exports.exportEarningsReport = asyncHandler(async (req, res) => {
    const earnings = await enhancedPaymentService.getEarningsDashboard(
        req.user._id,
        req.query
    );
    
    // Format data for export
    const csvData = earnings.map(e => ({
        batch: e.batch[0]?.name || 'N/A',
        source: e._id.source,
        totalEarnings: e.totalEarnings,
        numberOfPayments: e.count
    }));

    res.status(200).json({
        success: true,
        data: csvData
    });
});