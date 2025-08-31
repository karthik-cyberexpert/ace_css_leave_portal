import { testLoginEmailService, sendLoginNotification } from './utils/loginEmailService.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

console.log('🧪 === LOGIN EMAIL SERVICE TEST ===');
console.log('📧 Email User:', process.env.EMAIL_USER);
console.log('🔑 Email Password Length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'NOT SET');
console.log('🎯 Target Email: karthisathya308@gmail.com');
console.log('⏰ Test Time:', new Date().toISOString());
console.log('================================\n');

async function testEmailDelivery() {
  try {
    console.log('🚀 Starting email delivery test...\n');
    
    // Test 1: Send to the target user email
    console.log('📨 Test 1: Sending login notification to karthisathya308@gmail.com');
    const result1 = await sendLoginNotification(
      'karthisathya308@gmail.com', 
      'Karthi Sathya',
      {
        ipAddress: '192.168.46.89',
        userAgent: 'Test Browser - Direct Email Test'
      }
    );
    
    console.log('✅ Result 1:', result1);
    console.log('');
    
    // Test 2: Send to admin email as backup test
    console.log('📨 Test 2: Sending test email to admin email (backup test)');
    const result2 = await testLoginEmailService('adhiyamaancyber@gmail.com');
    console.log('✅ Result 2:', result2);
    
    // Test 3: Send to another test email to verify service works
    console.log('📨 Test 3: Sending to adhiyamaancyber@gmail.com directly');
    const result3 = await sendLoginNotification(
      'adhiyamaancyber@gmail.com', 
      'Direct Test User',
      {
        ipAddress: '192.168.46.89',
        userAgent: 'Test Browser - Admin Direct Test'
      }
    );
    console.log('✅ Result 3:', result3);
    
    // Summary
    console.log('\n🏁 === TEST SUMMARY ===');
    console.log('Test 1 (User Email):', result1.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Test 2 (Admin Test):', result2.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Test 3 (Admin Direct):', result3.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (result1.success) {
      console.log('\n🎉 SUCCESS: Email should be delivered to karthisathya308@gmail.com');
      console.log('📬 Check your inbox (and spam folder if needed)');
      console.log('💡 If you don\'t see it, check:');
      console.log('   1. Spam/Junk folder');
      console.log('   2. Gmail filters/rules');
      console.log('   3. Email client sync settings');
    } else {
      console.log('\n❌ FAILED: Email delivery to user failed');
      console.log('🔍 Error details:', result1.error);
      console.log('💡 Possible causes:');
      console.log('   1. Gmail app password expired or incorrect');
      console.log('   2. Network/firewall blocking SMTP');
      console.log('   3. Gmail account settings changed');
      console.log('   4. Target email blocking the sender');
    }
    
    if (result3.success && !result1.success) {
      console.log('\n⚠️ NOTICE: Admin email works but user email failed');
      console.log('🔍 This suggests the issue is with the target email address');
      console.log('💡 karthisathya308@gmail.com might be:');
      console.log('   1. Blocking emails from adhiyamaancyber@gmail.com');
      console.log('   2. Have strict spam filters');
      console.log('   3. Have full inbox');
      console.log('   4. Be an inactive/invalid email address');
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testEmailDelivery()
  .then(() => {
    console.log('\n🏁 Email test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Email test failed:', error);
    process.exit(1);
  });
