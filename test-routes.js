import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3009';

async function testRoute(path, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers
    });

    console.log(`${path}: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.text();
      if (data.length > 200) {
        console.log(`  Response preview: ${data.substring(0, 200)}...`);
      } else {
        console.log(`  Response: ${data}`);
      }
    }
    
    return response.status;
  } catch (error) {
    console.log(`${path}: ERROR - ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('Testing API routes without authentication:');
  await testRoute('/');
  await testRoute('/test-db');
  
  console.log('\nTesting authentication:');
  
  // First login to get a token
  let token = null;
  try {
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log('Login successful, token obtained');
    } else {
      console.log('Login failed:', loginResponse.status, loginResponse.statusText);
    }
  } catch (error) {
    console.log('Login error:', error.message);
  }
  
  if (token) {
    console.log('\nTesting authenticated routes:');
    await testRoute('/profile', token);
    await testRoute('/students', token);
    await testRoute('/staff', token);
    await testRoute('/leave-requests', token);
    await testRoute('/od-requests', token);
    await testRoute('/profile-change-requests', token);
    
    console.log('\nTesting with /api/ prefix:');
    await testRoute('/api/profile', token);
    await testRoute('/api/students', token);
    await testRoute('/api/staff', token);
    await testRoute('/api/leave-requests', token);
    await testRoute('/api/od-requests', token);
    await testRoute('/api/dashboard', token);
  }
}

main().catch(console.error);
