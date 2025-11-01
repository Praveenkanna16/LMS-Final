const sequelize = require('./database');

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection
};
