import { sendLoginNotification } from './utils/loginEmailServiceDev.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

async function testDevelopmentEmailService() {
  console.log('🔧 Testing Development Email Service with Redirection...\n');
  
  // Test cases that should all redirect to your Gmail
  const testCases = [
    {
      name: 'Fake Admin User',
      email: 'admin@college.portal',
      userName: 'Admin User'
    },
    {
      name: 'Fake Student User', 
      email: 'student123@college.portal',
      userName: 'Student User'
    },
    {
      name: 'Fake Tutor User',
      email: 'tutor@college.portal',
      userName: 'Tutor User'
    },
    {
      name: 'Invalid Domain User',
      email: 'user@invalid.domain',
      userName: 'Invalid User'
    }
  ];
  
  const loginDetails = {
    ipAddress: '192.168.46.89',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };
  
  console.log('📧 Admin Email (all should redirect to):', process.env.EMAIL_USER);
  console.log('🔧 Environment Variables Check:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'undefined (defaults to development)');
  console.log('');
  
  let successCount = 0;
  let totalCount = testCases.length;
  
  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`   Original Email: ${testCase.email}`);
    
    try {
      const result = await sendLoginNotification(testCase.email, testCase.userName, loginDetails);
      
      if (result && result.success) {
        console.log('   ✅ SUCCESS: Email sent!');
        console.log(`   📧 Redirected: ${result.redirected ? 'YES' : 'NO'}`);
        console.log(`   📨 Message ID: ${result.messageId}`);
        console.log(`   📬 Actual Recipient: ${result.actualRecipient}`);
        
        if (result.redirected && result.actualRecipient === process.env.EMAIL_USER) {
          console.log('   🎯 PERFECT: Email correctly redirected to admin!');
          successCount++;
        } else if (!result.redirected && result.actualRecipient === testCase.email) {
          console.log('   ⚠️  WARNING: Email sent to original address (not redirected)');
        } else {
          console.log('   ❓ UNEXPECTED: Redirection behavior unclear');
        }
        
      } else {
        console.log('   ❌ FAILED: Email not sent');
        console.log(`   Error: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('   ❌ EXCEPTION occurred');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 RESULTS SUMMARY:');
  console.log(`   Total Tests: ${totalCount}`);
  console.log(`   Successfully Redirected: ${successCount}`);
  console.log(`   Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  console.log('');
  
  if (successCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED! All emails are being redirected to your admin account.');
    console.log('✅ Your login notification system is now working correctly.');
    console.log('📧 All user login attempts will notify your Gmail: ' + process.env.EMAIL_USER);
  } else {
    console.log('⚠️  SOME TESTS FAILED. Email redirection may not be working as expected.');
    console.log('🔧 Check the development mode configuration in loginEmailServiceDev.js');
  }
}

testDevelopmentEmailService()
  .then(() => {
    console.log('\n✅ Development email service test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
