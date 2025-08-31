import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3008';

async function testBackendDirect() {
  console.log('Testing direct backend API calls...');
  
  // Test backend root
  console.log('\n1. Testing backend root endpoint:');
  try {
    const response = await fetch(`${BACKEND_URL}/`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend root working:', data.message);
    } else {
      console.log('❌ Backend root failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return;
  }
  
  // Test login endpoint
  console.log('\n2. Testing backend login endpoint:');
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@admin.com',
        password: 'admin123'
      })
    });
    
    console.log('Login response status:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Backend login working! Token received:', !!data.token);
    } else {
      console.log('❌ Backend login failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Backend login error:', error.message);
  }
  
  // Test students endpoint with token
  console.log('\n3. Testing backend students endpoint:');
  try {
    // First get a token
    const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@admin.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token;
      
      // Now test students endpoint
      const studentsResponse = await fetch(`${BACKEND_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Students response status:', studentsResponse.status);
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        console.log('✅ Backend students endpoint working! Count:', studentsData.length);
      } else {
        const errorData = await studentsResponse.json();
        console.log('❌ Backend students failed:', errorData.error);
      }
    } else {
      console.log('❌ Could not get token for students test');
    }
  } catch (error) {
    console.log('❌ Backend students test error:', error.message);
  }
}

testBackendDirect().catch(console.error);
