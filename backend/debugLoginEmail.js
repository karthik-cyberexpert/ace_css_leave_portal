import { sendLoginNotification } from './utils/loginEmailService.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

async function testLoginEmailWithDifferentEmails() {
  console.log('🔍 Testing login email with different email types...\n');
  
  // Test different email scenarios
  const testEmails = [
    {
      description: 'Real Gmail (should work)',
      email: process.env.EMAIL_USER,
      name: 'Real User'
    },
    {
      description: 'Fake college email (likely fails)',
      email: 'admin@college.portal',
      name: 'Admin User'
    },
    {
      description: 'Invalid domain (should fail)', 
      email: 'student@invalid.domain',
      name: 'Student User'
    }
  ];
  
  const loginDetails = {
    ipAddress: '192.168.46.89',
    userAgent: 'Mozilla/5.0 Test Browser'
  };
  
  console.log('🔧 Email Configuration:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('');
  
  for (const test of testEmails) {
    console.log(`📧 Testing: ${test.description}`);
    console.log(`   Email: ${test.email}`);
    console.log('   Attempting to send...');
    
    try {
      const result = await sendLoginNotification(test.email, test.name, loginDetails);
      
      if (result && result.success) {
        console.log('   ✅ SUCCESS - Email sent!');
        console.log(`   📨 Message ID: ${result.messageId}`);
      } else {
        console.log('   ❌ FAILED - Email not sent');
        console.log(`   Error: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('   ❌ EXCEPTION occurred');
      console.log(`   Error Code: ${error.code}`);
      console.log(`   Error Message: ${error.message}`);
      
      // Specific Gmail error handling
      if (error.responseCode === 550) {
        console.log('   🚫 Gmail rejected: Invalid/non-existent email address');
      } else if (error.code === 'EAUTH') {
        console.log('   🔐 Authentication issue: Check Gmail app password');
      }
    }
    console.log('');
  }
  
  console.log('🎯 CONCLUSION:');
  console.log('If only real Gmail addresses work, then your database has fake emails.');
  console.log('Solutions:');
  console.log('1. Update database with real email addresses');
  console.log('2. For testing, redirect all emails to your Gmail');
  console.log('3. Disable emails in development mode');
}

testLoginEmailWithDifferentEmails()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
