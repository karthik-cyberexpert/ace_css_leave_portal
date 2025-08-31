import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

console.log('📧 === SIMPLE EMAIL TEST ===');
console.log('🎯 Testing basic email delivery');
console.log('📨 From:', process.env.EMAIL_USER);
console.log('📬 To: karthiksathya308@gmail.com');
console.log('⏰ Time:', new Date().toISOString());
console.log('==============================\n');

async function sendSimpleEmail() {
  try {
    console.log('🔧 Creating transporter...');
    
    const transporter = nodemailer.createTransport({
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
    
    console.log('🔗 Testing connection...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');
    
    const mailOptions = {
      from: {
        name: 'ACE CSE Leave Portal',
        address: process.env.EMAIL_USER
      },
      to: 'karthiksathya308@gmail.com',
      subject: '🧪 EMAIL DELIVERY TEST - Direct to User',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5aa0;">🧪 Email Delivery Test</h2>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📬 Recipient Information:</h3>
            <p><strong>To:</strong> karthiksathya308@gmail.com</p>
            <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h3>⚠️ Important Test Information:</h3>
            <p>If you receive this email at <strong>karthiksathya308@gmail.com</strong>, the email system is working correctly.</p>
            <p>If you receive this email at a different address (like adhiyamaancyber@gmail.com), there may be:</p>
            <ul>
              <li>Email forwarding rules in Gmail</li>
              <li>Auto-forwarding enabled on the recipient account</li>
              <li>Organization-level email policies</li>
              <li>The recipient email may not exist</li>
            </ul>
          </div>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin-top: 20px;">
            <h3>✅ What to Check:</h3>
            <ol>
              <li>Which email address received this message?</li>
              <li>Check the email headers (View Original/Show Original)</li>
              <li>Look for "X-Forwarded" or "Auto-forwarded" headers</li>
              <li>Verify no Gmail rules are forwarding emails</li>
            </ol>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #666; font-size: 12px;">
            This is a test email from the ACE CSE Leave Portal system to verify email delivery.
          </p>
        </div>
      `,
      text: `
EMAIL DELIVERY TEST - Direct to User

Recipient Information:
To: karthiksathya308@gmail.com
From: ${process.env.EMAIL_USER}
Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

IMPORTANT TEST INFORMATION:
If you receive this email at karthiksathya308@gmail.com, the email system is working correctly.

If you receive this email at a different address (like adhiyamaancyber@gmail.com), there may be:
- Email forwarding rules in Gmail
- Auto-forwarding enabled on the recipient account
- Organization-level email policies
- The recipient email may not exist

WHAT TO CHECK:
1. Which email address received this message?
2. Check the email headers (View Original/Show Original)
3. Look for "X-Forwarded" or "Auto-forwarded" headers
4. Verify no Gmail rules are forwarding emails

This is a test email from the ACE CSE Leave Portal system to verify email delivery.
      `
    };
    
    console.log('📨 Mail configuration:');
    console.log('   From Name:', mailOptions.from.name);
    console.log('   From Address:', mailOptions.from.address);
    console.log('   To Address:', mailOptions.to);
    console.log('   Subject:', mailOptions.subject);
    console.log('');
    
    console.log('📤 Sending email...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.messageId);
    console.log('   Response:', result.response);
    console.log('   Envelope From:', result.envelope?.from);
    console.log('   Envelope To:', result.envelope?.to);
    
    console.log('\n🎯 === TEST RESULTS ===');
    console.log('✅ Email was sent to Gmail successfully');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Intended Recipient: karthiksathya308@gmail.com');
    console.log('📨 Sender: adhiyamaancyber@gmail.com');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Check karthiksathya308@gmail.com inbox');
    console.log('2. Check adhiyamaancyber@gmail.com inbox');
    console.log('3. If email appears in sender inbox, check for forwarding rules');
    console.log('4. Look at email headers to see delivery path');
    
  } catch (error) {
    console.error('💥 Email sending failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Stack:', error.stack);
  }
}

// Run the test
sendSimpleEmail()
  .then(() => {
    console.log('\n🏁 Simple email test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
