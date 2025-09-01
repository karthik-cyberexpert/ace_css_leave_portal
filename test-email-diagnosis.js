import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('🔧 EMAIL DIAGNOSIS TEST');
console.log('='.repeat(50));

console.log('\n1. ENVIRONMENT VARIABLES CHECK:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `✅ Set (${process.env.EMAIL_PASSWORD.length} chars)` : '❌ Missing');

if (process.env.EMAIL_USER) {
  console.log('   EMAIL_USER value:', process.env.EMAIL_USER);
}

if (process.env.EMAIL_PASSWORD) {
  console.log('   EMAIL_PASSWORD preview:', process.env.EMAIL_PASSWORD.substring(0, 4) + '***');
}

console.log('\n2. NODEMAILER TRANSPORTER TEST:');

const testEmailConfig = async () => {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      debug: true, // Enable debug mode
      logger: true  // Enable logging
    });

    console.log('   ✅ Transporter created successfully');

    console.log('\n3. SMTP CONNECTION TEST:');
    await transporter.verify();
    console.log('   ✅ SMTP connection verified successfully');

    console.log('\n4. TEST EMAIL SENDING:');
    const testResult = await transporter.sendMail({
      from: `"ACE CSS Leave Portal Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '🧪 Email Diagnostic Test - ' + new Date().toLocaleTimeString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px;">
            <h2 style="color: #155724; margin: 0 0 15px 0;">✅ Email System Working!</h2>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
            <p><strong>To:</strong> ${process.env.EMAIL_USER}</p>
            <p><strong>Status:</strong> Email service is functioning correctly!</p>
          </div>
        </div>
      `
    });

    console.log('   ✅ Test email sent successfully!');
    console.log('   Message ID:', testResult.messageId);
    console.log('   Response:', testResult.response);

    console.log('\n🎉 ALL TESTS PASSED! Email service is working correctly.');
    console.log('   The issue might be with the login notification function or timing.');

  } catch (error) {
    console.error('\n❌ EMAIL DIAGNOSIS FAILED:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Command:', error.command);
    console.error('   Response Code:', error.responseCode);

    // Specific error diagnosis
    if (error.code === 'EAUTH') {
      console.error('\n🔐 AUTHENTICATION ERROR DIAGNOSIS:');
      console.error('   1. Check if 2-Step Verification is enabled in Gmail');
      console.error('   2. Generate a new App Password:');
      console.error('      - Go to https://myaccount.google.com/security');
      console.error('      - Click "2-Step Verification"');
      console.error('      - Click "App passwords"');
      console.error('      - Generate a new password for "Mail"');
      console.error('      - Use that 16-character password in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔌 CONNECTION ERROR DIAGNOSIS:');
      console.error('   1. Check internet connection');
      console.error('   2. Check Windows Firewall settings');
      console.error('   3. Check antivirus email protection');
      console.error('   4. Try running as administrator');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n⏰ TIMEOUT ERROR DIAGNOSIS:');
      console.error('   1. Network connection is slow or unstable');
      console.error('   2. Gmail SMTP might be temporarily unavailable');
      console.error('   3. Corporate firewall might be blocking SMTP');
    }

    console.error('\n🔧 SUGGESTED FIXES:');
    console.error('   1. Verify Gmail app password is correct');
    console.error('   2. Check Windows Firewall and antivirus settings');
    console.error('   3. Try a different network connection');
    console.error('   4. Ensure Gmail account has 2FA enabled');
  }
};

// Run the diagnosis
testEmailConfig().catch(console.error);
