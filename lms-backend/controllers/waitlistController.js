const Waitlist = require('../models/Waitlist');
const logger = require('../config/logger');

exports.addToWaitlist = async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.user.id;

    const existingEntry = await Waitlist.findOne({
      where: { batchId, studentId, status: 'waiting' }
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Already on waitlist'
      });
    }

    const position = await Waitlist.count({
      where: { batchId, status: 'waiting' }
    }) + 1;

    const waitlistEntry = await Waitlist.create({
      batchId,
      studentId,
      position
    });

    res.status(201).json({
      success: true,
      data: waitlistEntry
    });
  } catch (error) {
    logger.error('Error adding to waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to waitlist',
      error: error.message
    });
  }
};

exports.getWaitlist = async (req, res) => {
  try {
    const { batchId } = req.params;

    const waitlist = await Waitlist.findAll({
      where: { batchId, status: 'waiting' },
      order: [['position', 'ASC']]
    });

    res.json({
      success: true,
      data: waitlist
    });
  } catch (error) {
    logger.error('Error fetching waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waitlist',
      error: error.message
    });
  }
};

exports.removeFromWaitlist = async (req, res) => {
  try {
    const { batchId, studentId } = req.params;

    await Waitlist.update(
      { status: 'cancelled' },
      { where: { batchId, studentId, status: 'waiting' } }
    );

    res.json({
      success: true,
      message: 'Removed from waitlist'
    });
  } catch (error) {
    logger.error('Error removing from waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from waitlist',
      error: error.message
    });
  }
};

exports.promoteFromWaitlist = async (req, res) => {
  try {
    const { batchId } = req.params;

    const nextInLine = await Waitlist.findOne({
      where: { batchId, status: 'waiting' },
      order: [['position', 'ASC']]
    });

    if (!nextInLine) {
      return res.status(404).json({
        success: false,
        message: 'No one in waitlist'
      });
    }

    await Waitlist.update(
      { status: 'enrolled' },
      { where: { id: nextInLine.id } }
    );

    res.json({
      success: true,
      data: nextInLine
    });
  } catch (error) {
    logger.error('Error promoting from waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote from waitlist',
      error: error.message
    });
  }
};
