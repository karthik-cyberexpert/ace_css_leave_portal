import fetch from 'node-fetch';

async function testLoginViaAPI() {
  console.log('🌐 Testing Login via HTTP API...\n');
  
  const serverUrl = 'http://192.168.46.89:3009';
  const loginEndpoint = `${serverUrl}/auth/login`;
  
  // Test credentials
  const credentials = {
    identifier: 'karthisathya308@gmail.com',
    password: '1234567890'
  };
  
  console.log('🎯 Target Server:', serverUrl);
  console.log('📡 Login Endpoint:', loginEndpoint);
  console.log('📧 Email:', credentials.identifier);
  console.log('🔑 Password: [REDACTED]');
  console.log('');
  
  try {
    // Step 1: Check if server is running
    console.log('🔍 Step 1: Checking if server is running...');
    
    try {
      const healthCheck = await fetch(serverUrl, { 
        method: 'GET',
        timeout: 5000
      });
      
      if (healthCheck.ok) {
        const serverInfo = await healthCheck.json();
        console.log('✅ Server is running!');
        console.log('   Status:', serverInfo.status);
        console.log('   Message:', serverInfo.message);
      } else {
        console.log('⚠️ Server responded but with error status:', healthCheck.status);
      }
    } catch (serverError) {
      console.log('❌ Server is not running or not accessible');
      console.log('   Error:', serverError.message);
      console.log('   Please start your backend server first with: node server.js');
      return;
    }
    
    // Step 2: Attempt login
    console.log('\n🔐 Step 2: Attempting login...');
    
    const loginResponse = await fetch(loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestScript/1.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('📡 Request sent to server...');
    console.log('📊 Response status:', loginResponse.status);
    
    const responseData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('   Token received:', responseData.token ? 'YES' : 'NO');
      console.log('   Message:', responseData.message);
      console.log('   User ID:', responseData.user?.id || 'N/A');
      console.log('   User Email:', responseData.user?.email || 'N/A');
      
      console.log('\n📧 EMAIL NOTIFICATION STATUS:');
      console.log('   The server should have attempted to send a login notification email.');
      console.log('   Check the server console logs for email sending details.');
      console.log('   If using the development email service, the email should be');
      console.log('   redirected to: adhiyamaancyber@gmail.com');
      
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('   Status:', loginResponse.status);
      console.log('   Error:', responseData.error || responseData.message || 'Unknown error');
      
      if (loginResponse.status === 401) {
        console.log('');
        console.log('🔍 DEBUGGING 401 ERROR:');
        console.log('   - Check if the email exists in the database');
        console.log('   - Verify the password is correct');
        console.log('   - Check if the user account is active');
      } else if (loginResponse.status === 500) {
        console.log('');
        console.log('🔍 DEBUGGING 500 ERROR:');
        console.log('   - Server internal error occurred');
        console.log('   - Check server logs for detailed error information');
        console.log('   - Database connection might be failing');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 CONNECTION REFUSED:');
      console.log('   - Make sure your backend server is running');
      console.log('   - Check if the server is listening on the correct port (3002)');
      console.log('   - Verify firewall settings allow connections');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔍 HOST NOT FOUND:');
      console.log('   - Check if the server IP address is correct');
      console.log('   - Verify network connectivity');
    }
  }
}

// Helper function to check if fetch is available
async function checkDependencies() {
  try {
    // Try to import node-fetch if fetch is not available globally
    if (typeof fetch === 'undefined') {
      console.log('ℹ️  Installing node-fetch dependency...');
      // We'll handle this in the main function
    }
    return true;
  } catch (error) {
    console.error('❌ Missing dependencies:', error.message);
    console.log('💡 Please install node-fetch: npm install node-fetch');
    return false;
  }
}

// Run the test
testLoginViaAPI()
  .then(() => {
    console.log('\n✅ Login API test completed');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
  });
