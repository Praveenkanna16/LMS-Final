// Add this admin token to browser localStorage for testing
// Open browser console and run this script

const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJpYXQiOjE3NjE3NTA3MjEsImV4cCI6MTc2MTgzNzEyMX0.SOlJSIhtxuiFMUwuH0njLGTPNfNJf-c-aDMfdDau8_g";

const adminUser = {
  id: 1,
  name: "Admin User",
  email: "admin@test.com",
  role: "admin",
  status: "active",
  isActive: true,
  emailVerified: true
};

// Set the session data (using correct localStorage keys)
localStorage.setItem('genzed_token', adminToken);
localStorage.setItem('token', adminToken); // Also set 'token' for DatabaseViewer compatibility
localStorage.setItem('genzed_user', JSON.stringify(adminUser));
localStorage.setItem('genzed_auth_timestamp', Date.now().toString());
localStorage.setItem('genzed_session_active', 'true');

console.log('✅ Admin session set! Refresh the page to login as admin.');
console.log('Token:', adminToken);
console.log('User:', adminUser);
