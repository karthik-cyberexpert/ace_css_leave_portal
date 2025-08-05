import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002';

// Test and fix authentication issues
async function testAndFixAuth() {
  console.log('🔧 Testing and Fixing Authentication Issues...\n');

  // Step 1: Check current authentication state
  console.log('1. Checking current authentication state...');
  const authToken = localStorage.getItem('auth_token');
  const userProfile = localStorage.getItem('user_profile');
  
  console.log('   - auth_token:', authToken ? `Present (${authToken.substring(0, 20)}...)` : 'Missing');
  console.log('   - user_profile:', userProfile ? 'Present' : 'Missing');

  if (!authToken) {
    console.log('❌ No authentication token found. User must log in.');
    return {
      success: false,
      message: 'Please log in to access batch management features',
      action: 'LOGIN_REQUIRED'
    };
  }

  // Step 2: Test token validity
  console.log('\n2. Testing token validity...');
  try {
    const profileResponse = await axios.get(`${API_BASE_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Token is valid');
    console.log('   - User:', profileResponse.data.first_name, profileResponse.data.last_name);
    console.log('   - Email:', profileResponse.data.email);
    console.log('   - Admin:', profileResponse.data.is_admin);
    console.log('   - Tutor:', profileResponse.data.is_tutor);
    
  } catch (error) {
    console.log('❌ Token validation failed:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔄 Token expired - clearing storage');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      return {
        success: false,
        message: 'Authentication token expired. Please log in again.',
        action: 'LOGIN_REQUIRED'
      };
    }
    
    return {
      success: false,
      message: 'Authentication error: ' + (error.response?.data?.error || error.message),
      action: 'AUTH_ERROR'
    };
  }

  // Step 3: Test batches endpoint access
  console.log('\n3. Testing batches endpoint access...');
  try {
    const batchesResponse = await axios.get(`${API_BASE_URL}/batches`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Batches endpoint accessible');
    console.log('   - Found', batchesResponse.data.length, 'batches');
    
    // Step 4: Test batch update functionality
    if (batchesResponse.data.length > 0) {
      console.log('\n4. Testing batch update functionality...');
      const testBatch = batchesResponse.data[0];
      console.log('   - Testing with batch:', testBatch.name);
      
      try {
        // Perform a no-op update (same status)
        await axios.put(`${API_BASE_URL}/batches/${testBatch.id}`, {
          is_active: testBatch.is_active
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log('✅ Batch update functionality working');
        
        return {
          success: true,
          message: 'Authentication and batch management fully functional',
          action: 'READY'
        };
        
      } catch (updateError) {
        console.log('❌ Batch update failed:', updateError.response?.data?.error || updateError.message);
        console.log('   - Status:', updateError.response?.status);
        
        if (updateError.response?.status === 403) {
          return {
            success: false,
            message: 'User does not have permission to update batches',
            action: 'PERMISSION_DENIED'
          };
        }
        
        return {
          success: false,
          message: 'Batch update error: ' + (updateError.response?.data?.error || updateError.message),
          action: 'UPDATE_ERROR'
        };
      }
    } else {
      console.log('⚠️  No batches found to test update functionality');
      return {
        success: true,
        message: 'Authentication working but no batches found',
        action: 'NO_BATCHES'
      };
    }
    
  } catch (error) {
    console.log('❌ Batches endpoint failed:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      return {
        success: false,
        message: 'Authentication failed accessing batches endpoint',
        action: 'LOGIN_REQUIRED'
      };
    }
    
    return {
      success: false,
      message: 'Batches endpoint error: ' + (error.response?.data?.error || error.message),
      action: 'API_ERROR'
    };
  }
}

// Auto-run the test
testAndFixAuth().then(result => {
  console.log('\n🎯 Test Result:', result);
  
  switch (result.action) {
    case 'LOGIN_REQUIRED':
      console.log('\n💡 Solution: Please log out and log back in');
      break;
    case 'PERMISSION_DENIED':
      console.log('\n💡 Solution: Make sure you are logged in as an admin user');
      break;
    case 'READY':
      console.log('\n🎉 Everything is working! You can now use batch management features');
      break;
    default:
      console.log('\n❓ Unexpected result - check the logs above');
  }
}).catch(console.error);

// Make available in browser console
if (typeof window !== 'undefined') {
  window.testAndFixAuth = testAndFixAuth;
  console.log('\n💡 You can run testAndFixAuth() in the browser console');
}
