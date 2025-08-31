import { sendLoginNotification, testEmailConnection, sendTestEmail } from './utils/emailService.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve('../.env') });

async function testEmailService() {
  console.log('🔧 Testing Email Service Configuration...\n');
  
  // 1. Check environment variables
  console.log('📋 Environment Variables:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ Not set');
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set (length: ' + process.env.EMAIL_PASSWORD.length + ')' : '❌ Not set');
  console.log('');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('❌ Email configuration is incomplete. Please check your .env file.');
    process.exit(1);
  }
  
  // 2. Test SMTP connection
  console.log('🔗 Testing SMTP Connection...');
  try {
    const connectionTest = await testEmailConnection();
    if (connectionTest.success) {
      console.log('✅ SMTP connection successful');
    } else {
      console.log('❌ SMTP connection failed:', connectionTest.error);
      return;
    }
  } catch (error) {
    console.log('❌ SMTP connection error:', error.message);
    return;
  }
  
  console.log('');
  
  // 3. Send test email
  console.log('📧 Sending test email...');
  try {
    const testResult = await sendTestEmail(process.env.EMAIL_USER);
    if (testResult.success) {
      console.log('✅ Test email sent successfully');
      console.log('   Message ID:', testResult.messageId);
      console.log('   Sent to:', process.env.EMAIL_USER);
    } else {
      console.log('❌ Test email failed:', testResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ Test email error:', error.message);
    return;
  }
  
  console.log('');
  
  // 4. Send login notification test
  console.log('🔐 Testing login notification...');
  try {
    const loginTest = await sendLoginNotification(
      process.env.EMAIL_USER, 
      'Test User', 
      {
        ipAddress: '192.168.46.89',
        userAgent: 'Mozilla/5.0 (Test Browser)'
      }
    );
    if (loginTest.success) {
      console.log('✅ Login notification sent successfully');
      console.log('   Message ID:', loginTest.messageId);
      console.log('   Sent to:', process.env.EMAIL_USER);
    } else {
      console.log('❌ Login notification failed:', loginTest.error);
    }
  } catch (error) {
    console.log('❌ Login notification error:', error.message);
  }
  
  console.log('\n🎉 Email testing completed!');
  console.log('📬 Check your inbox for test emails.');
}

// Run the test
testEmailService().catch(console.error);
