import fetch from 'node-fetch';

console.log('🔍 Testing Dashboard API Endpoints...\n');

// Test credentials from our previous working test
const TEST_CREDENTIALS = {
  identifier: 'admin@college.edu',
  password: 'admin123'
};

let authToken = '';

async function getAuthToken() {
  try {
    console.log('🔐 Step 1: Getting authentication token...');
    const response = await fetch('http://210.212.246.131:8085/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    authToken = data.token;
    console.log('✅ Successfully obtained auth token');
    console.log(`   User: ${data.user?.email}`);
    console.log(`   Role: ${data.user?.isAdmin ? 'Admin' : data.user?.isTutor ? 'Tutor' : 'Student'}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get auth token:', error.message);
    throw error;
  }
}

async function testEndpoint(endpoint, description) {
  try {
    console.log(`📡 Testing: ${description}`);
    console.log(`   Endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
      return { success: false, status: response.status, error: errorText };
    }
    
    const data = await response.json();
    console.log(`   ✅ Success: Found ${Array.isArray(data) ? data.length : 'N/A'} records`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`   📄 Sample data keys: ${Object.keys(data[0] || {}).join(', ')}`);
    }
    
    return { success: true, status: response.status, data };
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDashboardTests() {
  try {
    console.log('🚀 Starting Dashboard API Tests...\n');
    
    // Get authentication token
    const loginData = await getAuthToken();
    
    if (!authToken) {
      throw new Error('No auth token obtained, cannot proceed with API tests');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('2️⃣ Testing API Endpoints...');
    console.log('='.repeat(60) + '\n');
    
    // Test various endpoints that the frontend likely uses
    const endpoints = [
      {
        url: 'http://210.212.246.131:8085/api/profile',
        desc: 'User Profile'
      },
      {
        url: 'http://210.212.246.131:8085/api/students',
        desc: 'Students List'
      },
      {
        url: 'http://210.212.246.131:8085/api/staff',
        desc: 'Staff List'
      },
      {
        url: 'http://210.212.246.131:8085/api/leave-requests',
        desc: 'Leave Requests'
      },
      {
        url: 'http://210.212.246.131:8085/api/od-requests',
        desc: 'OD Requests'
      },
      {
        url: 'http://210.212.246.131:8085/api/profile-change-requests',
        desc: 'Profile Change Requests'
      },
      {
        url: 'http://210.212.246.131:3009/health',
        desc: 'Backend Health Check (Direct)'
      }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint.url, endpoint.desc);
      results.push({ ...endpoint, ...result });
      console.log(''); // Empty line between tests
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60) + '\n');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
      console.log('\n🎉 Working Endpoints:');
      successful.forEach(r => {
        const dataInfo = r.data ? 
          (Array.isArray(r.data) ? `(${r.data.length} records)` : '(data available)') : '';
        console.log(`   ✅ ${r.desc} ${dataInfo}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Endpoints:');
      failed.forEach(r => {
        console.log(`   ❌ ${r.desc} - ${r.status || 'No response'}: ${r.error || 'Unknown error'}`);
      });
      
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('1. Check if the backend server is running properly');
      console.log('2. Verify that database contains the expected data');
      console.log('3. Ensure API endpoints exist in the backend server');
      console.log('4. Check backend server logs for detailed error information');
    }
    
    // Specific diagnostics
    const profileResult = results.find(r => r.desc === 'User Profile');
    const studentsResult = results.find(r => r.desc === 'Students List');
    const staffResult = results.find(r => r.desc === 'Staff List');
    
    console.log('\n🔍 Dashboard Data Diagnosis:');
    
    if (profileResult?.success) {
      console.log(`✅ User profile loads correctly for ${profileResult.data?.email}`);
      console.log(`   Role: ${profileResult.data?.is_admin ? 'Admin' : profileResult.data?.is_tutor ? 'Tutor' : 'Student'}`);
    } else {
      console.log('❌ User profile endpoint failed - this will prevent dashboard loading');
    }
    
    if (studentsResult?.success && studentsResult.data?.length > 0) {
      console.log(`✅ Students data available (${studentsResult.data.length} students)`);
    } else {
      console.log('⚠️ No students data - dashboard may appear empty');
    }
    
    if (staffResult?.success && staffResult.data?.length > 0) {
      console.log(`✅ Staff data available (${staffResult.data.length} staff members)`);
    } else {
      console.log('⚠️ No staff data - some features may not work');
    }
    
    if (successful.length === results.length) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('🌐 Dashboard should be fully functional at: http://210.212.246.131:8085');
      console.log('🔑 Login with: admin@college.edu / admin123');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
      console.log('Dashboard may have limited functionality or missing data');
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// Run the tests
runDashboardTests()
  .then(() => {
    console.log('\n✅ Dashboard endpoint tests completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  });
