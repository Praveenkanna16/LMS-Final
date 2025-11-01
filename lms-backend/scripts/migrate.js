const { sequelize } = require('../models');
const logger = require('../config/logger');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Get all models
    const models = sequelize.models;
    const newModels = [
      'TeacherApplication',
      'NotificationTemplate', 
      'RecordedContent',
      'GeneratedReport',
      'NotificationLog',
      'CashfreeTransaction'
    ];
    
    // Sync new models first (these can be created fresh)
    for (const modelName of newModels) {
      if (models[modelName]) {
        console.log(`Creating table for ${modelName}...`);
        await models[modelName].sync({ force: false });
        console.log(`✅ ${modelName} table created/updated`);
      }
    }
    
    // For existing models, use alter: false to avoid issues
    console.log('Syncing existing models...');
    await sequelize.sync({ alter: false });
    
    console.log('✅ Database migrations completed successfully');
    console.log('✅ All models synchronized with database');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Log model synchronization details
    const allModels = Object.keys(sequelize.models);
    console.log(`✅ Synchronized ${allModels.length} models:`, allModels.join(', '));
    
    console.log('\n⚠️  Note: User model fields may need manual database update.');
    console.log('   New fields added: approvalStatus, commissionRate, maxStudentsPerBatch,');
    console.log('   suspensionReason, suspendedBy, suspendedAt, payoutStatus, pendingEarnings, totalEarnings');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    logger.error('Database migration error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('Database connection closed');
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
