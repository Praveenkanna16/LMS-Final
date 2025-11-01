const { Backup, User } = require('../models');
const logger = require('../config/logger');

const createSampleBackups = async () => {
  try {
    // Check if backups already exist
    const existingBackups = await Backup.count();
    if (existingBackups > 0) {
      console.log('Sample backups already exist');
      return;
    }

    // Find an admin user to associate backups with
    const adminUser = await User.findOne({
      where: { role: 'admin' }
    });

    if (!adminUser) {
      console.log('No admin user found, skipping sample backup creation');
      return;
    }

    // Create sample backups
    const sampleBackups = [
      {
        type: 'full',
        filename: 'backup_full_2025-10-27.sql',
        size: 5242880, // 5MB in bytes
        status: 'completed',
        description: 'Daily automated backup',
        recordsCount: 15420,
        createdBy: adminUser.id,
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        type: 'incremental',
        filename: 'backup_incremental_2025-10-28.sql',
        size: 1048576, // 1MB in bytes
        status: 'completed',
        description: 'Incremental backup',
        recordsCount: 3245,
        createdBy: adminUser.id,
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        type: 'manual',
        filename: 'backup_manual_2025-10-28.sql',
        size: 3145728, // 3MB in bytes
        status: 'completed',
        description: 'Manual backup before system update',
        recordsCount: 8934,
        createdBy: adminUser.id,
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];

    await Backup.bulkCreate(sampleBackups);
    console.log('Sample backups created successfully');
    logger.info('Sample backups created', { count: sampleBackups.length });

  } catch (error) {
    console.error('Error creating sample backups:', error);
    logger.error('Error creating sample backups:', error);
  }
};

module.exports = createSampleBackups;
