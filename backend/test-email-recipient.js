import { sendLoginNotification } from './utils/loginEmailService.js';
import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

console.log('📧 === EMAIL RECIPIENT VERIFICATION TEST ===');
console.log('🎯 Testing if emails go to correct recipients');
console.log('📨 Sender:', process.env.EMAIL_USER);
console.log('⏰ Test Time:', new Date().toISOString());
console.log('===============================================\n');

// Create a custom transporter to inspect email details
const createTestTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

async function testEmailRecipients() {
  try {
    console.log('🚀 Starting email recipient verification...\n');
    
    // Test 1: Direct email to specific user
    console.log('📨 Test 1: Sending to karthiksathya308@gmail.com');
    const result1 = await sendLoginNotification(
      'karthiksathya308@gmail.com',
      'Karthik Sathya',
      {
        ipAddress: '192.168.46.89',
        userAgent: 'Test Browser - Recipient Verification'
      }
    );
    
    console.log('✅ Result 1:', result1);
    console.log('   Success:', result1.success);
    console.log('   Recipient:', result1.recipient);
    console.log('   Message ID:', result1.messageId);
    console.log('');
    
    // Test 2: Direct nodemailer test with explicit recipient
    console.log('📨 Test 2: Direct nodemailer test');
    const transporter = createTestTransporter();
    
    const directMailOptions = {
      from: {
        name: 'ACE CSE Leave Portal - Direct Test',
        address: process.env.EMAIL_USER
      },
      to: 'karthiksathya308@gmail.com',
      subject: '🧪 DIRECT EMAIL TEST - Should go to User',
      html: `
        <h2>🧪 Direct Email Recipient Test</h2>
        <p><strong>This email should be delivered to: karthiksathya308@gmail.com</strong></p>
        <p><strong>Sender:</strong> ${process.env.EMAIL_USER}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Test Purpose:</strong> Verify email goes to correct recipient</p>
        <hr>
        <p>If you receive this email at karthiksathya308@gmail.com, then email routing is working correctly.</p>
        <p>If you receive this at a different address, there may be email forwarding/redirection configured.</p>
      `,
      text: `
        DIRECT EMAIL RECIPIENT TEST
        
        This email should be delivered to: karthiksathya308@gmail.com
        Sender: ${process.env.EMAIL_USER}
        Time: ${new Date().toISOString()}
        
        If you receive this email at karthiksathya308@gmail.com, then email routing is working correctly.
        If you receive this at a different address, there may be email forwarding/redirection configured.
      `
    };
    
    console.log('📝 Direct mail options:');
    console.log('   From:', directMailOptions.from);
    console.log('   To:', directMailOptions.to);
    console.log('   Subject:', directMailOptions.subject);
    
    const directResult = await transporter.sendMail(directMailOptions);
    
    console.log('✅ Direct email sent successfully!');
    console.log('   Message ID:', directResult.messageId);
    console.log('   Response:', directResult.response);
    console.log('');
    
    // Test 3: Send to admin email to compare
    console.log('📨 Test 3: Sending to admin email for comparison');
    const result3 = await sendLoginNotification(
      'adhiyamaancyber@gmail.com',
      'Admin Test',
      {
        ipAddress: '192.168.46.89',
        userAgent: 'Test Browser - Admin Comparison'
      }
    );
    
    console.log('✅ Result 3 (Admin):', result3);
    console.log('   Success:', result3.success);
    console.log('   Recipient:', result3.recipient);
    console.log('');
    
    // Summary
    console.log('🏁 === TEST SUMMARY ===');
    console.log('Test 1 (User via service):', result1.success ? '✅ SENT' : '❌ FAILED');
    console.log('   Target: karthiksathya308@gmail.com');
    console.log('   Recipient recorded:', result1.recipient);
    
    console.log('Test 2 (User direct):', directResult.messageId ? '✅ SENT' : '❌ FAILED');
    console.log('   Target: karthiksathya308@gmail.com');
    console.log('   Message ID:', directResult.messageId);
    
    console.log('Test 3 (Admin):', result3.success ? '✅ SENT' : '❌ FAILED');
    console.log('   Target: adhiyamaancyber@gmail.com');
    console.log('   Recipient recorded:', result3.recipient);
    
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('1. Check BOTH email inboxes:');
    console.log('   - karthiksathya308@gmail.com');
    console.log('   - adhiyamaancyber@gmail.com');
    
    console.log('2. Check spam folders in both accounts');
    
    console.log('3. If emails appear in adhiyamaancyber@gmail.com instead of karthiksathya308@gmail.com:');
    console.log('   - Gmail may have email forwarding rules');
    console.log('   - The sender account may have auto-forwarding enabled');
    console.log('   - There may be a mail server configuration issue');
    
    console.log('4. Look for "Auto-forwarded" or "Redirected" in email headers');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testEmailRecipients()
  .then(() => {
    console.log('\n🎉 Email recipient verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
