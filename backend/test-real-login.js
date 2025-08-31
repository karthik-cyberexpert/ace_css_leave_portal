import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

const SERVER_URL = 'http://192.168.46.89:3009';
const TEST_CREDENTIALS = {
  email: 'karthiksathya308@gmail.com',  // Corrected email (with 'k')
  password: '1234567890'
};

console.log('🚀 === REAL LOGIN API TEST ===');
console.log('🌐 Server URL:', SERVER_URL);
console.log('📧 Test Email:', TEST_CREDENTIALS.email);
console.log('🔑 Test Password Length:', TEST_CREDENTIALS.password.length);
console.log('⏰ Test Time:', new Date().toISOString());
console.log('================================\n');

async function testLoginAPI() {
  try {
    console.log('1️⃣ Testing server connectivity...');
    
    // Test server connectivity first
    try {
      const healthResponse = await fetch(`${SERVER_URL}/`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Server is running');
        console.log('   Status:', healthData.status);
        console.log('   Port:', healthData.port);
      } else {
        console.log('❌ Server health check failed:', healthResponse.status);
        return;
      }
    } catch (connectError) {
      console.error('❌ Cannot connect to server:', connectError.message);
      console.error('💡 Make sure the backend server is running on http://192.168.46.89:3009');
      return;
    }
    
    console.log('\n2️⃣ Testing login endpoint...');
    
    // Test login API
    const loginResponse = await fetch(`${SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Login-Client/1.0 (Email Test)',
        'X-Forwarded-For': '192.168.46.89'
      },
      body: JSON.stringify({
        identifier: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password
      }),
      timeout: 10000
    });
    
    console.log('📡 Response Status:', loginResponse.status);
    console.log('📡 Response Headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('   Token received:', loginData.token ? 'Yes' : 'No');
      console.log('   User ID:', loginData.user?.id || 'N/A');
      console.log('   User Email:', loginData.user?.email || 'N/A');
      console.log('   Message:', loginData.message || 'N/A');
      
      console.log('\n📨 Email notification should have been triggered!');
      console.log('💡 Check the server console logs for email sending activity');
      console.log('📬 Check karthisathya308@gmail.com inbox (and spam folder)');
      
    } else {
      const errorData = await loginResponse.text();
      console.error('❌ LOGIN FAILED');
      console.error('   Status:', loginResponse.status);
      console.error('   Error:', errorData);
      
      if (loginResponse.status === 401) {
        console.error('💡 Possible causes:');
        console.error('   - Incorrect email or password');
        console.error('   - User account not found in database');
        console.error('   - Password hash mismatch');
      } else if (loginResponse.status === 500) {
        console.error('💡 Server error - check server logs');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test database connectivity
async function testDatabaseConnection() {
  try {
    console.log('\n3️⃣ Testing database connection...');
    
    const dbResponse = await fetch(`${SERVER_URL}/test-db`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log('✅ Database connection working');
      console.log('   User count in database:', dbData.userCount);
    } else {
      console.log('❌ Database connection failed:', dbResponse.status);
    }
  } catch (error) {
    console.error('❌ Database test error:', error.message);
  }
}

// Test user existence
async function testUserExists() {
  try {
    console.log('\n4️⃣ Testing if user exists...');
    
    // We'll try to check if we can get some info about users (need a safer endpoint)
    const usersResponse = await fetch(`${SERVER_URL}/test-users`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Can fetch user data');
      console.log('   Sample users found:', usersData.users?.length || 0);
      console.log('   Sample students found:', usersData.students?.length || 0);
    } else {
      console.log('⚠️ Cannot check user existence (endpoint might be disabled)');
    }
  } catch (error) {
    console.log('⚠️ User check error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🔍 Running comprehensive login and email test...\n');
  
  await testLoginAPI();
  await testDatabaseConnection();
  await testUserExists();
  
  console.log('\n🏁 === TEST COMPLETED ===');
  console.log('💡 If login was successful but no email received:');
  console.log('   1. Check server console logs for email sending errors');
  console.log('   2. Check spam/junk folder in Gmail');
  console.log('   3. Verify server environment variables are correct');
  console.log('   4. Check if Gmail is blocking the sender');
  
  process.exit(0);
}

runAllTests().catch((error) => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
