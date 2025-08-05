// Debug utility to check authentication status
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002';

async function debugAuthentication() {
  console.log('🔍 Debugging Authentication Status...\n');

  // Check localStorage for token
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  console.log('1. Token in localStorage:', token ? `${token.substring(0, 20)}...` : 'No token found');

  if (!token) {
    console.log('❌ No authentication token found. User needs to log in.');
    return;
  }

  // Test token validity with profile endpoint
  try {
    console.log('\n2. Testing token validity...');
    const response = await axios.get(`${API_BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token is valid. User profile:', {
      id: response.data.id,
      email: response.data.email,
      name: `${response.data.first_name} ${response.data.last_name}`,
      isAdmin: response.data.is_admin,
      isTutor: response.data.is_tutor
    });

    // Test batches endpoint specifically
    console.log('\n3. Testing batches endpoint access...');
    const batchesResponse = await axios.get(`${API_BASE_URL}/batches`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Batches endpoint accessible. Found', batchesResponse.data.length, 'batches');
    
    // Test batch update endpoint
    console.log('\n4. Testing batch update permissions...');
    if (batchesResponse.data.length > 0) {
      const firstBatch = batchesResponse.data[0];
      console.log('Testing update on batch:', firstBatch.name);
      
      try {
        // Try to toggle and revert the active status (no actual change)
        const currentStatus = firstBatch.is_active;
        await axios.put(`${API_BASE_URL}/batches/${firstBatch.id}`, {
          is_active: currentStatus // Keep the same status (no real change)
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Batch update permissions confirmed');
      } catch (updateError) {
        console.log('❌ Batch update failed:', updateError.response?.data?.error || updateError.message);
      }
    }

  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.error || error.message);
    console.log('Status code:', error.response?.status);
    
    if (error.response?.status === 401) {
      console.log('🔄 Token has expired. User needs to log in again.');
    } else if (error.response?.status === 403) {
      console.log('🚫 User does not have sufficient permissions.');
    }
  }
}

// For browser console usage
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuthentication;
  console.log('💡 Run debugAuth() in browser console to check authentication');
}

// For Node.js usage
debugAuthentication().catch(console.error);
