import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3002';

// Test credentials - using valid credentials from database
const TEST_CREDENTIALS = {
  identifier: 'test@gmail.com', // Student user
  password: 'password' // Default password, may need to be updated
};

async function getTestToken() {
  try {
    console.log('Attempting to login with credentials:', TEST_CREDENTIALS.identifier);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    const responseText = await response.text();
    console.log('Login response status:', response.status);
    console.log('Login response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      if (data.token) {
        console.log('✅ Login successful!');
        console.log('Token:', data.token);
        return data.token;
      }
    }
    
    console.log('❌ Login failed');
    return null;
    
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Get sample OD request ID
async function getSampleODRequest(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/od-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const odRequests = await response.json();
      console.log('Available OD requests:', odRequests.length);
      
      if (odRequests.length > 0) {
        const firstRequest = odRequests[0];
        console.log('Sample OD request:', {
          id: firstRequest.id,
          student_name: firstRequest.student_name,
          status: firstRequest.status
        });
        return firstRequest.id;
      }
    }
    
    console.log('No OD requests found or error fetching them');
    return null;
    
  } catch (error) {
    console.error('Error fetching OD requests:', error);
    return null;
  }
}

async function main() {
  console.log('=== Getting Test Token ===\n');
  
  const token = await getTestToken();
  
  if (token) {
    console.log('\n=== Getting Sample OD Request ===');
    const odRequestId = await getSampleODRequest(token);
    
    console.log('\n=== Test Configuration ===');
    console.log(`const TEST_TOKEN = '${token}';`);
    console.log(`const TEST_REQUEST_ID = '${odRequestId || 'UPDATE_WITH_VALID_ID'}';`);
    
    if (odRequestId) {
      console.log('\n✅ Ready to test certificate upload!');
      console.log('Copy the token and request ID above into test-certificate-upload.js');
    } else {
      console.log('\n⚠️  No OD requests found. You may need to create one first.');
    }
  } else {
    console.log('\n❌ Could not get authentication token.');
    console.log('Please check the credentials in this script and ensure the server is running.');
  }
}

main();
