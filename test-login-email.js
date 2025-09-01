import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('🔧 LOGIN EMAIL SERVICE TEST');
console.log('='.repeat(50));

// Test the login email service directly
async function testLoginEmailService() {
  try {
    console.log('\n1. IMPORTING EMAIL SERVICE...');
    
    // Import the login email service
    const { sendLoginNotification } = await import('./backend/utils/loginEmailService.js');
    console.log('   ✅ Login email service imported successfully');

    console.log('\n2. PREPARING TEST DATA...');
    const testUserEmail = process.env.EMAIL_USER; // Send to yourself for testing
    const testUserName = 'Test User';
    const testLoginDetails = {
      ipAddress: '192.168.46.89',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Test Browser'
    };

    console.log('   📧 Test Email:', testUserEmail);
    console.log('   👤 Test User:', testUserName);
    console.log('   🌐 Test IP:', testLoginDetails.ipAddress);

    console.log('\n3. SENDING LOGIN NOTIFICATION EMAIL...');
    const result = await sendLoginNotification(testUserEmail, testUserName, testLoginDetails);

    console.log('\n4. RESULT ANALYSIS:');
    if (result.success) {
      console.log('   ✅ SUCCESS! Login email sent successfully');
      console.log('   📧 Message ID:', result.messageId);
      console.log('   📬 Recipient:', result.recipient || testUserEmail);
      console.log('   🕐 Timestamp:', result.timestamp);
      
      if (result.redirected) {
        console.log('   🔄 Email was redirected (development mode)');
      }
    } else {
      console.error('   ❌ FAILED! Login email sending failed');
      console.error('   Error:', result.error);
      console.error('   Code:', result.code);
      console.error('   Timestamp:', result.timestamp);
    }

    console.log('\n🎯 TEST COMPLETE');
    
  } catch (error) {
    console.error('\n❌ LOGIN EMAIL SERVICE TEST FAILED:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    
    console.error('\n🔧 POSSIBLE ISSUES:');
    console.error('   1. Email service module import failed');
    console.error('   2. Environment variables not loaded properly');
    console.error('   3. SMTP configuration issues');
    console.error('   4. Network connectivity problems');
  }
}

// Test the email service from utils directly
async function testEmailServiceDirect() {
  try {
    console.log('\n5. TESTING DIRECT EMAIL SERVICE...');
    
    const { sendTestEmail } = await import('./backend/utils/emailService.js');
    console.log('   ✅ Direct email service imported');
    
    const testResult = await sendTestEmail(process.env.EMAIL_USER);
    
    if (testResult.success) {
      console.log('   ✅ Direct email test successful');
      console.log('   📧 Message ID:', testResult.messageId);
    } else {
      console.error('   ❌ Direct email test failed:', testResult.error);
    }
    
  } catch (error) {
    console.error('   ❌ Direct email service test failed:', error.message);
  }
}

// Test login email service from development version
async function testDevEmailService() {
  try {
    console.log('\n6. TESTING DEVELOPMENT EMAIL SERVICE...');
    
    const { sendLoginNotification: sendDevLogin } = await import('./backend/utils/loginEmailServiceDev.js');
    console.log('   ✅ Development email service imported');
    
    const devResult = await sendDevLogin(
      process.env.EMAIL_USER,
      'Dev Test User',
      {
        ipAddress: '192.168.46.89',
        userAgent: 'Development Test Browser'
      }
    );
    
    if (devResult.success) {
      console.log('   ✅ Development email test successful');
      console.log('   📧 Message ID:', devResult.messageId);
      console.log('   📬 Original Recipient:', devResult.originalRecipient);
      console.log('   📮 Actual Recipient:', devResult.actualRecipient);
      console.log('   🔄 Redirected:', devResult.redirected);
    } else {
      console.error('   ❌ Development email test failed:', devResult.error);
    }
    
  } catch (error) {
    console.error('   ❌ Development email service test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive email tests...\n');
  
  await testLoginEmailService();
  await testEmailServiceDirect();
  await testDevEmailService();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 All email service tests completed!');
  console.log('   Check your email inbox for test messages.');
  console.log('   If any test passed, the email system is working.');
  console.log('   The issue might be in the login flow integration.');
}

// Execute tests
runAllTests().catch(console.error);
