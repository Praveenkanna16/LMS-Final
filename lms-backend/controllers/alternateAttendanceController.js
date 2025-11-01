const AlternateAttendance = require('../models/AlternateAttendance');
const logger = require('../config/logger');

exports.requestAlternate = async (req, res) => {
  try {
    const { attendedBatchId, reason } = req.body;
    const { batchId: originalBatchId } = req.params;
    const studentId = req.user.id;

    const request = await AlternateAttendance.create({
      studentId,
      originalBatchId,
      attendedBatchId,
      date: new Date(),
      reason,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    logger.error('Error creating alternate attendance request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request',
      error: error.message
    });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await AlternateAttendance.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    logger.error('Error fetching alternate requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const teacherId = req.user.id;

    await AlternateAttendance.update(
      { 
        status: 'approved',
        approvedBy: teacherId 
      },
      { where: { id: requestId } }
    );

    res.json({
      success: true,
      message: 'Request approved'
    });
  } catch (error) {
    logger.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request',
      error: error.message
    });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const teacherId = req.user.id;

    await AlternateAttendance.update(
      { 
        status: 'rejected',
        approvedBy: teacherId 
      },
      { where: { id: requestId } }
    );

    res.json({
      success: true,
      message: 'Request rejected'
    });
  } catch (error) {
    logger.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request',
      error: error.message
    });
  }
};
