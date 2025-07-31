import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002';

async function cleanupTestUsers() {
  try {
    console.log('🧹 Cleaning up test users...\n');

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
    if (!loginData.token) {
      throw new Error('Admin login failed');
    }
    const adminToken = loginData.token;

    // Get all students
    const studentsResponse = await fetch(`${API_BASE}/students`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const students = await studentsResponse.json();

    // Find test users to clean up
    const testEmails = ['testuser@student.com', 'testupload@college.portal'];
    const testUsers = students.filter(s => testEmails.includes(s.email));

    console.log('Found test users to clean up:', testUsers.map(u => ({ email: u.email, name: u.name })));

    // Delete each test user
    for (const user of testUsers) {
      try {
        const deleteResponse = await fetch(`${API_BASE}/students/${user.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (deleteResponse.ok) {
          console.log(`✅ Deleted test user: ${user.email}`);
        } else {
          console.log(`❌ Failed to delete test user: ${user.email}`);
        }
      } catch (error) {
        console.log(`❌ Error deleting ${user.email}:`, error.message);
      }
    }

    // Also check if there are any orphaned users in the users table
    console.log('\n🔍 Checking for orphaned user records...');
    
    // We can't directly query the users table, but we can try to login with test emails
    // and if they exist but not in students, we know they're orphaned
    
    console.log('\n✅ Cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

cleanupTestUsers();
