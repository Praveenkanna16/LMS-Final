const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create a temporary admin token for testing
const adminPayload = {
  userId: 1, // Assuming admin user ID is 1
  role: 'admin',
  email: 'admin@test.com'
};

const token = jwt.sign(
  adminPayload, 
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('Admin Token for testing:');
console.log(token);
console.log('\nUse this token in Authorization header as:');
console.log(`Authorization: Bearer ${token}`);
console.log('\nOr use curl to test:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5001/api/users`);
