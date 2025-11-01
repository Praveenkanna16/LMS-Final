// Import required dependencies
const User = require('./User');
const FCMToken = require('./FCMToken');

// Note: FCMToken associations are disabled to avoid automatic foreign key creation issues
// The relationship can be handled manually if needed

module.exports = FCMToken;
