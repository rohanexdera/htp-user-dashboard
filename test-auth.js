/**
 * Authentication Test Script
 * Tests login with existing user credentials
 * 
 * Email: groook757@gmail.com
 * Password: Rohan@757
 */

const API_BASE_URL = 'https://party-one-developer.uc.r.appspot.com';

async function testLogin() {
    console.log('🔍 Testing Authentication...\n');
    console.log('Backend URL:', API_BASE_URL);
    console.log('Testing with: groook757@gmail.com\n');

    try {
        // Test 1: Check if backend is accessible
        console.log('1️⃣ Checking backend connectivity...');
        const healthCheck = await fetch(`${API_BASE_URL}/`).catch(() => null);
        if (healthCheck) {
            console.log('✅ Backend is accessible\n');
        } else {
            console.log('⚠️  Backend health check skipped\n');
        }

        // Test 2: Test login endpoint
        console.log('2️⃣ Testing login endpoint...');
        const loginResponse = await fetch(`${API_BASE_URL}/login/v1/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'groook757@gmail.com',
                password: 'Rohan@757'
            })
        });

        console.log('Response Status:', loginResponse.status);
        
        const loginData = await loginResponse.json();
        console.log('Response Data:', JSON.stringify(loginData, null, 2));

        if (loginData.success) {
            console.log('\n✅ LOGIN SUCCESSFUL!');
            console.log('\n📋 User Details:');
            if (loginData.data && loginData.data.length > 0) {
                const user = loginData.data[0];
                console.log('  - Name:', user.name || 'N/A');
                console.log('  - Email:', user.email);
                console.log('  - ID:', user.id);
                console.log('  - Gender:', user.gender || 'N/A');
                console.log('  - Token:', user.token ? '✓ Present' : '✗ Missing');
            }
        } else {
            console.log('\n❌ LOGIN FAILED');
            console.log('Error:', loginData.message || loginData.error);
        }

    } catch (error) {
        console.log('\n❌ TEST FAILED');
        console.log('Error:', error.message);
        console.log('\nDetails:', error);
    }
}

// Run the test
testLogin();
