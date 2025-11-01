const { sequelize } = require('./models');
const { QueryInterface, DataTypes } = require('sequelize');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('Users');
    
    // Add new columns to Users table if they don't exist
    if (!tableDescription.lastActiveAt) {
      console.log('Adding lastActiveAt column to Users table...');
      await queryInterface.addColumn('Users', 'lastActiveAt', {
        type: DataTypes.DATE,
        allowNull: true
      });
    }
    
    if (!tableDescription.deviceInfo) {
      console.log('Adding deviceInfo column to Users table...');
      await queryInterface.addColumn('Users', 'deviceInfo', {
        type: DataTypes.JSON,
        allowNull: true
      });
    }
    
    if (!tableDescription.loginIp) {
      console.log('Adding loginIp column to Users table...');
      await queryInterface.addColumn('Users', 'loginIp', {
        type: DataTypes.STRING,
        allowNull: true
      });
    }
    
    if (!tableDescription.verified) {
      console.log('Adding verified column to Users table...');
      await queryInterface.addColumn('Users', 'verified', {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      });
    }
    
    // Check if Batches table exists and add new columns
    try {
      const batchDescription = await queryInterface.describeTable('batches');
      
      if (!batchDescription.createdBy) {
        console.log('Adding createdBy column to batches table...');
        await queryInterface.addColumn('batches', 'createdBy', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      }
      
      if (!batchDescription.studentCount) {
        console.log('Adding studentCount column to batches table...');
        await queryInterface.addColumn('batches', 'studentCount', {
          type: DataTypes.INTEGER,
          defaultValue: 0
        });
      }
    } catch (error) {
      console.log('Batches table might not exist yet, skipping batch migrations');
    }
    
    // Create new tables if they don't exist
    try {
      await queryInterface.describeTable('system_settings');
      console.log('system_settings table already exists');
    } catch (error) {
      console.log('Creating system_settings table...');
      await queryInterface.createTable('system_settings', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        value: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        type: {
          type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
          defaultValue: 'string'
        },
        description: {
          type: DataTypes.TEXT
        },
        category: {
          type: DataTypes.STRING,
          defaultValue: 'general'
        },
        updatedBy: {
          type: DataTypes.INTEGER
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false
        }
      });
    }
    
    try {
      await queryInterface.describeTable('activity_logs');
      console.log('activity_logs table already exists');
    } catch (error) {
      console.log('Creating activity_logs table...');
      await queryInterface.createTable('activity_logs', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false
        },
        entityType: {
          type: DataTypes.STRING,
          allowNull: false
        },
        entityId: {
          type: DataTypes.INTEGER
        },
        details: {
          type: DataTypes.TEXT
        },
        ipAddress: {
          type: DataTypes.STRING
        },
        userAgent: {
          type: DataTypes.TEXT
        },
        status: {
          type: DataTypes.ENUM('success', 'failed', 'pending'),
          defaultValue: 'success'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false
        }
      });
    }
    
    console.log('✅ Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
