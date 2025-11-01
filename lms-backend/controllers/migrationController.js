const Migration = require('../models/Migration');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

exports.getAllMigrations = async (req, res) => {
  try {
    const migrations = await Migration.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({ migrations });
  } catch (error) {
    logger.error('Get migrations error:', error);
    res.status(500).json({ message: 'Failed to get migrations' });
  }
};

exports.runMigration = async (req, res) => {
  try {
    const { migrationName } = req.body;
    const userId = req.user.id;

    // Check if migration exists
    let migration = await Migration.findOne({ where: { name: migrationName } });

    if (!migration) {
      migration = await Migration.create({
        name: migrationName,
        status: 'pending',
        executedBy: userId
      });
    }

    if (migration.status === 'completed') {
      return res.status(400).json({ message: 'Migration already completed' });
    }

    // Update status to running
    migration.status = 'running';
    await migration.save();

    try {
      // Load migration file
      const migrationPath = path.join(MIGRATIONS_DIR, `${migrationName}.js`);
      const migrationModule = require(migrationPath);

      // Execute up function
      if (typeof migrationModule.up !== 'function') {
        throw new Error('Migration file must export an "up" function');
      }

      await migrationModule.up();

      // Mark as completed
      migration.status = 'completed';
      migration.executedAt = new Date();
      await migration.save();

      logger.info(`Migration completed: ${migrationName}`);
      res.json({ message: 'Migration completed successfully', migration });

    } catch (error) {
      // Mark as failed
      migration.status = 'failed';
      migration.error = error.message;
      await migration.save();

      logger.error(`Migration failed: ${migrationName}`, error);
      res.status(500).json({ message: 'Migration failed', error: error.message });
    }
  } catch (error) {
    logger.error('Run migration error:', error);
    res.status(500).json({ message: 'Failed to run migration' });
  }
};

exports.rollbackMigration = async (req, res) => {
  try {
    const { migrationName } = req.body;
    const userId = req.user.id;

    const migration = await Migration.findOne({ where: { name: migrationName } });

    if (!migration) {
      return res.status(404).json({ message: 'Migration not found' });
    }

    if (migration.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed migrations can be rolled back' });
    }

    try {
      // Load migration file
      const migrationPath = path.join(MIGRATIONS_DIR, `${migrationName}.js`);
      const migrationModule = require(migrationPath);

      // Execute down function
      if (typeof migrationModule.down !== 'function') {
        throw new Error('Migration file must export a "down" function');
      }

      await migrationModule.down();

      // Mark as rolled back
      migration.status = 'rolled_back';
      migration.rolledBackAt = new Date();
      migration.executedBy = userId;
      await migration.save();

      logger.info(`Migration rolled back: ${migrationName}`);
      res.json({ message: 'Migration rolled back successfully', migration });

    } catch (error) {
      migration.error = error.message;
      await migration.save();

      logger.error(`Rollback failed: ${migrationName}`, error);
      res.status(500).json({ message: 'Rollback failed', error: error.message });
    }
  } catch (error) {
    logger.error('Rollback migration error:', error);
    res.status(500).json({ message: 'Failed to rollback migration' });
  }
};

exports.createMigration = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Migration name is required' });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${name}.js`;
    const filePath = path.join(MIGRATIONS_DIR, fileName);

    const template = `/**
 * Migration: ${name}
 * Description: ${description || 'N/A'}
 * Created: ${new Date().toISOString()}
 */

const sequelize = require('../config/database');

exports.up = async () => {
  const queryInterface = sequelize.getQueryInterface();
  
  // Add your migration code here
  // Example: await queryInterface.addColumn('users', 'newField', { type: Sequelize.STRING });
};

exports.down = async () => {
  const queryInterface = sequelize.getQueryInterface();
  
  // Add your rollback code here
  // Example: await queryInterface.removeColumn('users', 'newField');
};
`;

    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
    await fs.writeFile(filePath, template);

    const migration = await Migration.create({
      name: fileName,
      description,
      status: 'pending',
      executedBy: userId
    });

    res.status(201).json({ 
      message: 'Migration file created', 
      migration,
      filePath 
    });
  } catch (error) {
    logger.error('Create migration error:', error);
    res.status(500).json({ message: 'Failed to create migration' });
  }
};
