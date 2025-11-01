console.log('🚀 GenZEd Authentication Reset Tool');
console.log('================================');

// Clear all GenZEd authentication data
const keysToRemove = [
    'genzed_token',
    'genzed_user', 
    'genzed_auth_timestamp',
    'genzed_session_active',
    'genzed-auth-store'
];

console.log('🧹 Clearing authentication data...');
keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removed: ${key}`);
});

// Also clear any other auth-related items
Object.keys(localStorage).forEach(key => {
    if (key.includes('auth') || key.includes('token') || key.includes('genzed')) {
        localStorage.removeItem(key);
        console.log(`✅ Removed: ${key}`);
    }
});

console.log('');
console.log('🎯 Next Steps:');
console.log('1. Refresh the page (Ctrl+F5)');
console.log('2. Visit: http://localhost:8084/login');
console.log('3. Login with fresh credentials');
console.log('');
console.log('📋 Test Credentials:');
console.log('- Email: admin@genzed.com');
console.log('- Password: password');
console.log('');
console.log('✅ Authentication reset complete!');
console.log('Redirecting to login page...');

// Redirect to login after 2 seconds
setTimeout(() => {
    window.location.href = 'http://localhost:8084/login';
}, 2000);
