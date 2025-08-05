// Debug script for batch management issues
// Paste this in browser console to debug authentication and batch management

console.log('🔧 Batch Management Debug Tool Loaded');

// Function to check authentication status
function checkAuth() {
  const authToken = localStorage.getItem('auth_token');
  const userProfile = localStorage.getItem('user_profile');
  
  console.log('🔍 Authentication Status:');
  console.log('- auth_token:', authToken ? `Present (${authToken.substring(0, 20)}...)` : '❌ Missing');
  console.log('- user_profile:', userProfile ? '✅ Present' : '❌ Missing');
  
  if (authToken) {
    try {
      // Try to decode JWT (basic check)
      const parts = authToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const expiry = new Date(payload.exp * 1000);
        const now = new Date();
        console.log('- Token expiry:', expiry.toLocaleString());
        console.log('- Token valid:', expiry > now ? '✅ Yes' : '❌ Expired');
      }
    } catch (e) {
      console.log('- Token format:', '❌ Invalid');
    }
  }
  
  return !!authToken;
}

// Function to test API calls
async function testBatchAPI() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.log('❌ No token found. Cannot test API.');
    return false;
  }
  
  try {
    console.log('🧪 Testing batch API...');
    
    // Test profile endpoint
    const profileResponse = await fetch('http://localhost:3002/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!profileResponse.ok) {
      console.log('❌ Profile test failed:', profileResponse.status, profileResponse.statusText);
      return false;
    }
    
    console.log('✅ Profile endpoint working');
    
    // Test batches endpoint
    const batchesResponse = await fetch('http://localhost:3002/batches', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!batchesResponse.ok) {
      console.log('❌ Batches test failed:', batchesResponse.status, batchesResponse.statusText);
      return false;
    }
    
    const batches = await batchesResponse.json();
    console.log('✅ Batches endpoint working. Found', batches.length, 'batches');
    
    return true;
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    return false;
  }
}

// Function to fix common issues
function fixAuth() {
  console.log('🔧 Attempting to fix authentication issues...');
  
  // Clear potentially corrupted data
  const oldToken = localStorage.getItem('auth_token');
  const oldProfile = localStorage.getItem('user_profile');
  
  if (!oldToken) {
    console.log('❌ No token to fix. User needs to log in.');
    return false;
  }
  
  // Try to clean up and re-set
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_profile');
  
  // Set them back (this can help with browser storage issues)
  if (oldToken) localStorage.setItem('auth_token', oldToken);
  if (oldProfile) localStorage.setItem('user_profile', oldProfile);
  
  console.log('✅ Authentication data refreshed');
  console.log('💡 Try the batch operation again, or refresh the page if needed');
  
  return true;
}

// Function to simulate batch update
async function testBatchUpdate() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.log('❌ No token found. Cannot test batch update.');
    return false;
  }
  
  try {
    // Get batches first
    const batchesResponse = await fetch('http://localhost:3002/batches', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!batchesResponse.ok) {
      console.log('❌ Cannot fetch batches for testing');
      return false;
    }
    
    const batches = await batchesResponse.json();
    if (batches.length === 0) {
      console.log('❌ No batches available for testing');
      return false;
    }
    
    const testBatch = batches[0];
    console.log('🧪 Testing batch update with:', testBatch.name);
    
    // Perform a no-op update (keep same status)
    const updateResponse = await fetch(`http://localhost:3002/batches/${testBatch.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_active: testBatch.is_active
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log('❌ Batch update test failed:', updateResponse.status, errorText);
      return false;
    }
    
    console.log('✅ Batch update test successful!');
    return true;
    
  } catch (error) {
    console.log('❌ Batch update test failed:', error.message);
    return false;
  }
}

// Main debug function
async function debugBatch() {
  console.clear();
  console.log('🚀 Starting Batch Management Debug...\n');
  
  // Step 1: Check authentication
  console.log('Step 1: Checking authentication...');
  const hasAuth = checkAuth();
  
  if (!hasAuth) {
    console.log('\n❌ Authentication issue detected.');
    console.log('💡 Solution: Please log out and log back in.');
    return;
  }
  
  // Step 2: Test API
  console.log('\nStep 2: Testing API access...');
  const apiWorks = await testBatchAPI();
  
  if (!apiWorks) {
    console.log('\n❌ API access issue detected.');
    console.log('💡 Trying to fix authentication...');
    fixAuth();
    console.log('💡 Please refresh the page and try again.');
    return;
  }
  
  // Step 3: Test batch update
  console.log('\nStep 3: Testing batch update...');
  const updateWorks = await testBatchUpdate();
  
  if (!updateWorks) {
    console.log('\n❌ Batch update issue detected.');
    console.log('💡 This might be a permissions issue or server error.');
    return;
  }
  
  console.log('\n🎉 All tests passed! Batch management should be working.');
  console.log('💡 If you still have issues, try refreshing the page.');
}

// Expose functions globally
window.debugBatch = debugBatch;
window.checkAuth = checkAuth;
window.testBatchAPI = testBatchAPI;
window.fixAuth = fixAuth;
window.testBatchUpdate = testBatchUpdate;

console.log('\n💡 Available debug functions:');
console.log('- debugBatch() - Run full diagnostic');
console.log('- checkAuth() - Check authentication status');
console.log('- testBatchAPI() - Test API endpoints');
console.log('- fixAuth() - Try to fix auth issues');
console.log('- testBatchUpdate() - Test batch update functionality');
console.log('\n🎯 Run debugBatch() to start!');
