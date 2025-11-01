const { sequelize, ActivityLog, Backup, User } = require('../models');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

// Helper function to log activity
const logActivity = async (userId, action, entityType, entityId, details) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      details: JSON.stringify(details),
      ipAddress: null, // Can be passed from req if needed
      userAgent: null, // Can be passed from req if needed
      status: 'success'
    });
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
};

// Get database statistics
const getDataStats = async (req, res) => {
  try {
    const user = req.user;

    // Get table counts
    const stats = await sequelize.query(`
      SELECT 
        'users' as table_name,
        COUNT(*) as count
      FROM Users
      UNION ALL
      SELECT 
        'courses' as table_name,
        COUNT(*) as count
      FROM courses
      UNION ALL
      SELECT 
        'batches' as table_name,
        COUNT(*) as count
      FROM batches
      UNION ALL
      SELECT 
        'payments' as table_name,
        COUNT(*) as count
      FROM payments
      UNION ALL
      SELECT 
        'notifications' as table_name,
        COUNT(*) as count
      FROM notifications
      UNION ALL
      SELECT 
        'activity_logs' as table_name,
        COUNT(*) as count
      FROM activity_logs
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // Get database size (SQLite specific)
    const dbPath = path.join(__dirname, '../database/genzed_lms_dev.db');
    let dbSize = 0;
    try {
      const stat = await fs.stat(dbPath);
      dbSize = stat.size;
    } catch (error) {
      logger.warn('Could not get database size:', error.message);
    }

    // Transform stats into object
    const tableStats = {};
    stats.forEach(row => {
      tableStats[row.table_name] = parseInt(row.count);
    });

    // Get real backup statistics
    const totalBackups = await Backup.count();
    const lastBackup = await Backup.findOne({
      where: { status: 'completed' },
      order: [['completedAt', 'DESC']]
    });

    // Get backup success rate (completed vs total backups in last 30 days)
    const backupStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM backups 
      WHERE createdAt >= datetime('now', '-30 days')
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const backupSuccessRate = backupStats[0]?.total > 0 
      ? Math.round((backupStats[0].completed / backupStats[0].total) * 100) 
      : 100;

    // Calculate data growth rate (users created in last 30 days vs previous 30 days)
    const growthStats = await sequelize.query(`
      WITH current_month AS (
        SELECT COUNT(*) as current_count FROM Users 
        WHERE created_at >= datetime('now', '-30 days')
      ),
      previous_month AS (
        SELECT COUNT(*) as previous_count FROM Users 
        WHERE created_at >= datetime('now', '-60 days') 
        AND created_at < datetime('now', '-30 days')
      )
      SELECT 
        current_month.current_count,
        previous_month.previous_count,
        CASE 
          WHEN previous_month.previous_count > 0 
          THEN ROUND((current_month.current_count - previous_month.previous_count) * 100.0 / previous_month.previous_count)
          ELSE 0
        END as growth_rate
      FROM current_month, previous_month
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const dataGrowthRate = growthStats[0]?.growth_rate || 0;

    // Get live sessions count
    const liveClassesCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM live_sessions
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const response = {
      success: true,
      data: {
        totalUsers: tableStats.users || 0,
        totalCourses: tableStats.courses || 0,
        totalBatches: tableStats.batches || 0,
        totalPayments: tableStats.payments || 0,
        totalLiveClasses: liveClassesCount[0]?.count || 0,
        totalStorageUsed: Math.round(dbSize / (1024 * 1024)), // Convert to MB
        totalBackups: totalBackups,
        lastBackupDate: lastBackup ? lastBackup.completedAt?.toISOString() : null,
        tables: tableStats,
        totalRecords: Object.values(tableStats).reduce((sum, count) => sum + count, 0),
        databaseSize: dbSize,
        lastUpdated: new Date(),
        // Analytics data
        analytics: {
          dataGrowthRate: dataGrowthRate,
          backupSuccessRate: backupSuccessRate,
          avgBackupTime: '12min' // This would need more complex calculation in real system
        },
        // Database info
        database: {
          totalTables: Object.keys(tableStats).length,
          responseTime: '45ms' // This would be measured in real system
        }
      }
    };

    // Log activity
    await logActivity(user.id, 'VIEW_DATA_STATS', 'system', null, {
      totalRecords: response.data.totalRecords,
      databaseSize: dbSize
    });

    res.json(response);
  } catch (error) {
    logger.error('Error getting data stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get data statistics',
      error: error.message
    });
  }
};

// Get backup history
const getBackupHistory = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 20, type = 'all', status = 'all' } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build where clause for filtering
    const whereClause = {};
    if (type !== 'all') {
      whereClause.type = type;
    }
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Get backups from database
    const { count, rows: backups } = await Backup.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform data to match frontend expectations
    const transformedBackups = backups.map(backup => ({
      id: backup.id.toString(),
      type: backup.type,
      status: backup.status,
      size: Math.round(backup.size / (1024 * 1024)), // Convert bytes to MB
      filename: backup.filename,
      createdAt: backup.createdAt.toISOString(),
      description: backup.description,
      recordsCount: backup.recordsCount,
      creator: backup.creator ? {
        id: backup.creator.id,
        name: backup.creator.name,
        email: backup.creator.email
      } : null
    }));

    // Log activity
    await logActivity(user.id, 'VIEW_BACKUP_HISTORY', 'system', null, {
      backupCount: count,
      filters: { type, status }
    });

    res.json({
      success: true,
      data: {
        backups: transformedBackups,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting backup history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup history',
      error: error.message
    });
  }
};

// Create backup
const createBackup = async (req, res) => {
  try {
    const user = req.user;
    const { type = 'manual', description = '' } = req.body;

    // Generate filename based on type and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${type}_${timestamp}.sql`;

    // Create backup record in database
    const backup = await Backup.create({
      type,
      filename,
      status: 'in_progress',
      size: 0, // Will be updated when backup completes
      description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} backup created by ${user.name}`,
      createdBy: user.id
    });

    // Log the backup creation attempt
    await logActivity(user.id, 'CREATE_BACKUP', 'system', backup.id, {
      type,
      filename,
      description
    });

    // Simulate backup process (in real system, this would be actual backup logic)
    // Using setTimeout to simulate async backup process
    setTimeout(async () => {
      try {
        // Get total records count for the backup
        const totalRecords = await sequelize.query(`
          SELECT 
            (SELECT COUNT(*) FROM Users) +
            (SELECT COUNT(*) FROM courses) +
            (SELECT COUNT(*) FROM batches) +
            (SELECT COUNT(*) FROM payments) +
            (SELECT COUNT(*) FROM notifications) +
            (SELECT COUNT(*) FROM activity_logs) as total
        `, {
          type: sequelize.QueryTypes.SELECT
        });

        const recordsCount = totalRecords[0]?.total || 0;
        
        // Simulate different backup sizes based on type
        let estimatedSize;
        switch (type) {
          case 'full':
            estimatedSize = Math.floor(Math.random() * 10 + 5) * 1024 * 1024; // 5-15MB
            break;
          case 'incremental':
            estimatedSize = Math.floor(Math.random() * 3 + 1) * 1024 * 1024; // 1-4MB
            break;
          default: // manual
            estimatedSize = Math.floor(Math.random() * 5 + 2) * 1024 * 1024; // 2-7MB
        }

        // Update backup record with completion data
        await backup.update({
          status: 'completed',
          size: estimatedSize,
          recordsCount: recordsCount,
          completedAt: new Date()
        });

        // Log backup completion
        await logActivity(user.id, 'BACKUP_COMPLETED', 'system', backup.id, {
          backupId: backup.id,
          type,
          size: estimatedSize,
          recordsCount
        });

        logger.info(`Backup ${backup.id} completed successfully`, {
          type,
          size: estimatedSize,
          recordsCount
        });
      } catch (error) {
        // Update backup record with error
        await backup.update({
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        });

        // Log backup failure
        await logActivity(user.id, 'BACKUP_FAILED', 'system', backup.id, {
          backupId: backup.id,
          error: error.message
        });

        logger.error(`Backup ${backup.id} failed:`, error);
      }
    }, 3000); // 3 second delay to simulate backup process

    res.json({
      success: true,
      message: 'Backup creation initiated',
      data: {
        id: backup.id.toString(),
        type: backup.type,
        filename: backup.filename,
        status: backup.status,
        size: backup.size,
        createdAt: backup.createdAt.toISOString(),
        description: backup.description
      }
    });
  } catch (error) {
    logger.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

// Delete backup
const deleteBackup = async (req, res) => {
  try {
    const user = req.user;
    const { backupId } = req.params;

    // Find the backup record
    const backup = await Backup.findByPk(backupId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    // Store backup info before deletion for logging
    const backupInfo = {
      id: backup.id,
      filename: backup.filename,
      type: backup.type,
      size: backup.size,
      creator: backup.creator?.name
    };

    // Delete the backup record
    await backup.destroy();

    // Log the backup deletion
    await logActivity(user.id, 'DELETE_BACKUP', 'system', backupId, {
      backupId,
      filename: backupInfo.filename,
      type: backupInfo.type,
      size: backupInfo.size,
      originalCreator: backupInfo.creator
    });

    logger.info(`Backup ${backupId} deleted by user ${user.name}`, backupInfo);

    res.json({
      success: true,
      message: 'Backup deleted successfully',
      data: {
        deletedBackup: backupInfo
      }
    });
  } catch (error) {
    logger.error('Error deleting backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
};

// Export database
const exportDatabase = async (req, res) => {
  try {
    const user = req.user;
    const { format = 'json', tables = [], collection } = req.query;

    // Log the export attempt
    await logActivity(user.id, 'EXPORT_DATABASE', 'system', null, {
      format,
      collection: collection || 'all',
      tables: tables.length > 0 ? tables : 'all'
    });

    // Determine what to export
    let tablesToExport = tables.length > 0 ? tables : [];
    
    // If specific collection requested
    if (collection) {
      switch(collection) {
        case 'users':
          tablesToExport = ['Users'];
          break;
        case 'payments':
          tablesToExport = ['payments'];
          break;
        case 'classes':
          tablesToExport = ['live_sessions', 'batches'];
          break;
        case 'courses':
          tablesToExport = ['courses'];
          break;
        case 'all':
          tablesToExport = ['Users', 'courses', 'batches', 'payments', 'live_sessions', 'notifications', 'activity_logs'];
          break;
        default:
          tablesToExport = [collection];
      }
    }

    // If no tables specified, export all major tables
    if (tablesToExport.length === 0) {
      tablesToExport = ['Users', 'courses', 'batches', 'payments', 'live_sessions'];
    }

    const exportData = {};
    
    // Fetch data from each table
    for (const tableName of tablesToExport) {
      try {
        const data = await sequelize.query(`SELECT * FROM ${tableName}`, {
          type: sequelize.QueryTypes.SELECT
        });
        exportData[tableName] = data;
      } catch (tableError) {
        logger.warn(`Could not export table ${tableName}:`, tableError.message);
        exportData[tableName] = [];
      }
    }

    // Add metadata
    const metadata = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      format: format,
      tables: Object.keys(exportData),
      totalRecords: Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0)
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = [];
      
      for (const [tableName, records] of Object.entries(exportData)) {
        if (records.length === 0) continue;
        
        csvData.push(`\n--- ${tableName} ---\n`);
        
        // Get headers from first record
        const headers = Object.keys(records[0]);
        csvData.push(headers.join(','));
        
        // Add rows
        records.forEach(record => {
          const row = headers.map(header => {
            const value = record[header];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvData.push(row.join(','));
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="database_export_${Date.now()}.csv"`);
      res.send(csvData.join('\n'));
      
    } else {
      // Return as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="database_export_${Date.now()}.json"`);
      res.json({
        metadata,
        data: exportData
      });
    }

  } catch (error) {
    logger.error('Error exporting database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export database',
      error: error.message
    });
  }
};

// Get table data with pagination
const getTableData = async (req, res) => {
  try {
    const user = req.user;
    const { tableName } = req.params;
    const { page = 1, limit = 20, search = '' } = req.query;

    const offset = (page - 1) * limit;

    // Validate table name (security measure)
    const allowedTables = ['Users', 'courses', 'batches', 'payments', 'notifications', 'activity_logs'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table name'
      });
    }

    // Get table data
    let whereClause = '';
    let replacements = {};
    
    if (search) {
      // Basic search implementation - in real system, customize per table
      whereClause = 'WHERE CAST(id AS TEXT) LIKE :search OR CAST(created_at AS TEXT) LIKE :search';
      replacements.search = `%${search}%`;
    }

    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
    const dataQuery = `SELECT * FROM ${tableName} ${whereClause} ORDER BY id DESC LIMIT :limit OFFSET :offset`;

    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const data = await sequelize.query(dataQuery, {
      replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
      type: sequelize.QueryTypes.SELECT
    });

    // Log activity
    await logActivity(user.id, 'VIEW_TABLE_DATA', 'system', null, {
      tableName,
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });

    res.json({
      success: true,
      data: {
        records: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting table data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table data',
      error: error.message
    });
  }
};

// Get all database tables with metadata
const getAllTables = async (req, res) => {
  try {
    const user = req.user;

    // Define all tables with metadata
    const tables = [
      { name: 'Users', displayName: 'Users', icon: 'Users', tableName: 'Users' },
      { name: 'courses', displayName: 'Courses', icon: 'BookOpen', tableName: 'courses' },
      { name: 'batches', displayName: 'Batches', icon: 'Calendar', tableName: 'batches' },
      { name: 'payments', displayName: 'Payments', icon: 'DollarSign', tableName: 'payments' },
      { name: 'live_sessions', displayName: 'Live Sessions', icon: 'Video', tableName: 'live_sessions' },
      { name: 'notifications', displayName: 'Notifications', icon: 'Bell', tableName: 'notifications' },
      { name: 'activity_logs', displayName: 'Activity Logs', icon: 'FileText', tableName: 'activity_logs' },
      { name: 'backups', displayName: 'Backups', icon: 'Database', tableName: 'backups' },
      { name: 'enrollments', displayName: 'Enrollments', icon: 'Users', tableName: 'enrollments' },
      { name: 'assessments', displayName: 'Assessments', icon: 'FileCheck', tableName: 'assessments' },
      { name: 'submissions', displayName: 'Submissions', icon: 'Mail', tableName: 'submissions' },
      { name: 'cart_items', displayName: 'Cart Items', icon: 'ShoppingCart', tableName: 'cart_items' },
      { name: 'wishlist_items', displayName: 'Wishlist', icon: 'Heart', tableName: 'wishlist_items' },
      { name: 'messages', displayName: 'Messages', icon: 'MessageSquare', tableName: 'messages' },
      { name: 'notification_preferences', displayName: 'Notification Preferences', icon: 'Settings', tableName: 'notification_preferences' },
    ];

    // Get record counts for each table
    const tablesWithCounts = await Promise.all(
      tables.map(async (table) => {
        try {
          const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.tableName}`);
          return {
            ...table,
            recordCount: results[0].count || 0
          };
        } catch (error) {
          logger.error(`Error counting records for table ${table.tableName}:`, error);
          return {
            ...table,
            recordCount: 0,
            error: 'Failed to count records'
          };
        }
      })
    );

    // Log activity
    await logActivity(
      user.id,
      'VIEW',
      'database_tables',
      null,
      { tablesCount: tablesWithCounts.length }
    );

    res.json({
      success: true,
      data: tablesWithCounts
    });
  } catch (error) {
    logger.error('Error getting tables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database tables',
      error: error.message
    });
  }
};

module.exports = {
  getDataStats,
  getBackupHistory,
  createBackup,
  deleteBackup,
  exportDatabase,
  getTableData,
  getAllTables
};
