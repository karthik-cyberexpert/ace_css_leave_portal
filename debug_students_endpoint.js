import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002';

async function debugStudentsEndpoint() {
  try {
    // Login as admin
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    const adminToken = loginData.token;

    // Get all students
    const studentsResponse = await fetch(`${API_BASE}/students`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const students = await studentsResponse.json();
    
    console.log('All students:', JSON.stringify(students, null, 2));
    
    // Find test student
    const testStudent = students.find(s => s.email === 'testuser@student.com');
    if (testStudent) {
      console.log('\nTest student found:');
      console.log('- ID:', testStudent.id);
      console.log('- Email:', testStudent.email);
      console.log('- Name:', testStudent.name);
      console.log('- Profile Photo:', testStudent.profile_photo);
    } else {
      console.log('\n❌ Test student not found');
      console.log('Looking for email: testuser@student.com');
      console.log('Available students:', students.map(s => ({ email: s.email, name: s.name })));
    }

    // Also try login as the test user to verify it exists
    const testLoginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'testuser@student.com',
        password: 'testuser123'
      })
    });

    if (testLoginResponse.ok) {
      const testLoginData = await testLoginResponse.json();
      console.log('\n✅ Test user can login successfully');
      
      // Get profile as test user
      const profileResponse = await fetch(`${API_BASE}/profile`, {
        headers: { 'Authorization': `Bearer ${testLoginData.token}` }
      });
      const profile = await profileResponse.json();
      console.log('Test user profile:', JSON.stringify(profile, null, 2));
    } else {
      console.log('\n❌ Test user cannot login');
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugStudentsEndpoint();
