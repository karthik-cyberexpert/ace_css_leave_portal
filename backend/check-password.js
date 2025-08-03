import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3002';
const TEST_EMAIL = 'test@gmail.com';

async function checkUserPassword() {
  let connection;
  
  try {
    console.log('=== Checking User Password ===');
    connection = await mysql.createConnection(dbConfig);
    
    // Get user information from database
    const [users] = await connection.execute(
      'SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = ?',
      [TEST_EMAIL]
    );
    
    if (users.length === 0) {
      console.log('❌ User not found with email:', TEST_EMAIL);
      return;
    }
    
    const user = users[0];
    console.log('User found:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Name:', user.first_name, user.last_name);
    console.log('- Password Hash:', user.password_hash);
    
    // Test common passwords
    const commonPasswords = ['password', 'test123', 'admin123', '123456', 'test', 'password123'];
    
    console.log('\n=== Testing Common Passwords ===');
    for (const testPassword of commonPasswords) {
      const isMatch = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`Password "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
      
      if (isMatch) {
        console.log(`\n🎉 Found working password: "${testPassword}"`);
        
        // Test login with this password
        console.log('\n=== Testing Login ===');
        await testLogin(TEST_EMAIL, testPassword);
        break;
      }
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: email,
        password: password
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', result.token);
    } else {
      console.log('❌ Login failed:', result.error);
    }
    
  } catch (error) {
    console.error('Login test error:', error);
  }
}

async function resetPassword(email, newPassword) {
  let connection;
  
  try {
    console.log(`\n=== Resetting Password for ${email} ===`);
    connection = await mysql.createConnection(dbConfig);
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, email]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Password updated successfully for ${email}`);
      console.log(`New password: "${newPassword}"`);
      
      // Test the new password
      console.log('\n=== Testing New Password ===');
      await testLogin(email, newPassword);
    } else {
      console.log(`❌ Failed to update password for ${email}`);
    }
    
  } catch (error) {
    console.error('Password reset error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function checkPasswordUpdateEndpoint() {
  console.log('\n=== Checking Password Update Endpoint ===');
  
  // First, get a valid token
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: TEST_EMAIL,
        password: 'password' // assuming this works
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Cannot get token for password update test');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Got authentication token');
    
    // Now try to update password via API
    const updateResponse = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        password: 'newpassword123'
      })
    });
    
    const updateResult = await updateResponse.text();
    console.log('Password update response:', updateResponse.status, updateResult);
    
  } catch (error) {
    console.error('Password update endpoint test error:', error);
  }
}

async function main() {
  console.log('Starting password investigation...\n');
  
  // Check current password
  await checkUserPassword();
  
  // Reset to a known password
  await resetPassword(TEST_EMAIL, 'password');
  
  // Check password update endpoint
  await checkPasswordUpdateEndpoint();
  
  console.log('\n=== Investigation Complete ===');
  console.log('Current working password should be: "password"');
}

main();
