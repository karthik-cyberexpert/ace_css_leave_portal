// ===============================================================================
// COMPLETE LOGIN AND EMAIL NOTIFICATION TEST
// ===============================================================================
// This script tests the complete login flow including email notifications

import { sendLoginNotification } from './utils/loginEmailServiceDev.js';

// Test function that simulates what happens during login
async function testCompleteLoginFlow() {
  console.log('🔐 COMPLETE LOGIN AND EMAIL NOTIFICATION TEST');
  console.log('============================================\n');
  
  // Test cases with different user scenarios
  const testUsers = [
    {
      name: 'Test Admin User',
      email: 'admin@college.portal',
      type: 'Admin',
      description: 'Testing admin user login notification'
    },
    {
      name: 'Test Student User',
      email: 'student@college.portal', 
      type: 'Student',
      description: 'Testing student user login notification'
    },
    {
      name: 'Test Tutor User',
      email: 'tutor@college.portal',
      type: 'Tutor', 
      description: 'Testing tutor user login notification'
    },
    {
      name: 'Real User Test',
      email: 'karthisathya308@gmail.com',
      type: 'Real User',
      description: 'Testing with the actual email you provided'
    }
  ];
  
  // Simulated login details
  const loginDetails = {
    ipAddress: '192.168.46.89', // Your LAN IP
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };
  
  console.log('📧 Email Configuration Check:');
  console.log('   EMAIL_USER (admin email):', process.env.EMAIL_USER || 'NOT SET');
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
  console.log('   Development Mode: ENABLED (all emails redirect to admin)');
  console.log('');
  
  let successCount = 0;
  let totalCount = testUsers.length;
  
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`📧 Test ${i + 1}/${totalCount}: ${user.description}`);
    console.log(`   User: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Type: ${user.type}`);
    console.log('   Sending login notification...');
    
    try {
      const result = await sendLoginNotification(user.email, user.name, loginDetails);
      
      if (result && result.success) {
        console.log('   ✅ SUCCESS: Email sent!');
        console.log(`   📨 Message ID: ${result.messageId}`);
        console.log(`   📬 Original Recipient: ${result.originalRecipient}`);
        console.log(`   📬 Actual Recipient: ${result.actualRecipient}`);
        console.log(`   🔄 Redirected: ${result.redirected ? 'YES' : 'NO'}`);
        
        if (result.redirected && result.actualRecipient === process.env.EMAIL_USER) {
          console.log('   🎯 PERFECT: Email redirected to admin successfully!');
          successCount++;
        } else {
          console.log('   ⚠️  WARNING: Email redirection may not be working as expected');
        }
        
      } else {
        console.log('   ❌ FAILED: Email not sent');
        console.log(`   Error: ${result?.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log('   ❌ EXCEPTION: Email sending failed');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log(''); // Empty line between tests
    
    // Wait a bit between emails to avoid rate limiting
    if (i < testUsers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Results summary
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  console.log(`   Total Tests: ${totalCount}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${totalCount - successCount}`);
  console.log(`   Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  console.log('');
  
  if (successCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Email notification system is working correctly.');
    console.log('📧 All login notifications will be sent to:', process.env.EMAIL_USER);
    console.log('💌 Check your Gmail inbox for test emails with [DEV] prefix.');
    console.log('');
    console.log('🔥 NEXT STEPS:');
    console.log('1. Try logging in through your web application');
    console.log('2. Check your Gmail for login notification emails');
    console.log('3. All user logins should now trigger email notifications');
    
  } else if (successCount > 0) {
    console.log('⚠️  PARTIAL SUCCESS');
    console.log(`${successCount} out of ${totalCount} tests passed.`);
    console.log('Some email notifications are working, but there may be issues with others.');
    
  } else {
    console.log('❌ ALL TESTS FAILED');
    console.log('Email notification system is not working properly.');
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('1. Check EMAIL_USER and EMAIL_PASSWORD in .env file');
    console.log('2. Verify Gmail app password is correct');
    console.log('3. Ensure Gmail account has 2-factor authentication enabled');
    console.log('4. Check network connectivity and firewall settings');
  }
}

// Helper function to test just the email service without login
async function testEmailServiceOnly() {
  console.log('📧 Testing Email Service Only...\n');
  
  const testEmail = 'test@example.com';
  const testUser = 'Test User';
  const loginDetails = {
    ipAddress: '192.168.46.89',
    userAgent: 'Test Browser'
  };
  
  try {
    const result = await sendLoginNotification(testEmail, testUser, loginDetails);
    
    if (result && result.success) {
      console.log('✅ Email service is working!');
      console.log(`📨 Message ID: ${result.messageId}`);
      return true;
    } else {
      console.log('❌ Email service failed');
      console.log(`Error: ${result?.error || 'Unknown error'}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Email service exception');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('../.env') });

// Run the complete test
console.log('🚀 Starting Complete Login Email Test...\n');

testCompleteLoginFlow()
  .then(() => {
    console.log('\n✅ Complete login email test finished');
  })
  .catch(error => {
    console.error('\n❌ Test failed with error:', error);
  });
