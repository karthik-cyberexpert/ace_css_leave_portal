import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables with proper path
dotenv.config({ path: path.resolve('../.env') });

class LoginEmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    
    // Development mode - redirect all emails to admin
    // For LAN/local development, always enable development mode
    this.isDevelopmentMode = process.env.NODE_ENV !== 'production' || true; // Force development mode
    this.adminEmail = process.env.EMAIL_USER; // Your real Gmail address
  }

  async initialize() {
    console.log('🔧 Initializing Enhanced Login Email Service (Development Mode)...');
    console.log('📧 Email User:', process.env.EMAIL_USER);
    console.log('🔑 Password Length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0, 'characters');
    console.log('🔄 Development Mode:', this.isDevelopmentMode ? 'ENABLED (emails redirected)' : 'DISABLED');
    console.log('📬 Admin Email (redirect target):', this.adminEmail);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('❌ Email configuration missing - EMAIL_USER or EMAIL_PASSWORD not set');
    }

    // Create transporter with Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      debug: false,
      logger: false
    });

    // Test connection
    console.log('🔗 Testing SMTP connection...');
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection successful!');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      throw error;
    }
  }

  async sendLoginNotification(originalRecipientEmail, userName, loginDetails) {
    console.log('\n📨 === ENHANCED LOGIN EMAIL NOTIFICATION START ===');
    console.log('👤 Original User:', userName);
    console.log('📧 Original Email:', originalRecipientEmail);
    console.log('🕐 Time:', new Date().toISOString());

    if (!this.isInitialized) {
      console.log('⚠️ Service not initialized, initializing now...');
      await this.initialize();
    }

    try {
      // Determine actual recipient
      let actualRecipient = originalRecipientEmail;
      let emailSubjectPrefix = '';
      let emailBodyPrefix = '';
      
      if (this.isDevelopmentMode) {
        actualRecipient = this.adminEmail;
        emailSubjectPrefix = '[DEV] ';
        emailBodyPrefix = `
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">🚧 Development Mode Notice</h4>
            <p style="color: #856404; margin: 0;">
              This email was originally intended for <strong>${originalRecipientEmail}</strong> but has been redirected to your admin email for testing purposes.
            </p>
          </div>
        `;
        console.log('🔄 DEVELOPMENT MODE: Redirecting email');
        console.log('📧 From:', originalRecipientEmail, '➜ To:', actualRecipient);
      }

      // Format login time to IST
      const loginTime = new Date();
      const istTime = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(loginTime);

      console.log('🕐 Login Time (IST):', istTime);
      console.log('🌐 IP Address:', loginDetails.ipAddress);
      console.log('💻 User Agent:', loginDetails.userAgent.substring(0, 50) + '...');

      // Email content
      const subject = `${emailSubjectPrefix}Login Alert - ${userName}`;
      
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            ${emailBodyPrefix}
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #007bff; margin: 0 0 15px 0;">🔐 Login Notification</h2>
              <p style="margin: 0;">A successful login was detected for your account.</p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #495057;">Login Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>👤 User:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>📧 Email:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${originalRecipientEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>🕐 Time:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${istTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>🌐 IP Address:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${loginDetails.ipAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>💻 Device:</strong></td>
                  <td style="padding: 8px 0;">${loginDetails.userAgent}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
              <h4 style="color: #0c5460; margin: 0 0 10px 0;">🛡️ Security Notice</h4>
              <p style="color: #0c5460; margin: 0;">
                If this login was not initiated by you, please contact your system administrator immediately and change your password.
              </p>
            </div>

            <div style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px;">
              <p>This is an automated security notification from College Portal System.</p>
              <p>© ${new Date().getFullYear()} College Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      console.log('📝 Email content prepared');
      console.log('📤 Sending email...');

      // Send email
      const info = await this.transporter.sendMail({
        from: `"College Portal System" <${process.env.EMAIL_USER}>`,
        to: actualRecipient,
        subject: subject,
        html: htmlBody
      });

      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', info.messageId);
      console.log('📬 Sent to:', actualRecipient);
      console.log('📨 === ENHANCED LOGIN EMAIL NOTIFICATION END ===\n');

      return {
        success: true,
        messageId: info.messageId,
        originalRecipient: originalRecipientEmail,
        actualRecipient: actualRecipient,
        redirected: this.isDevelopmentMode
      };

    } catch (error) {
      console.error('❌ DETAILED EMAIL ERROR:');
      console.error('   Error message:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Response code:', error.responseCode);
      console.error('📨 === ENHANCED LOGIN EMAIL NOTIFICATION END ===\n');

      return {
        success: false,
        error: error.message,
        code: error.code,
        originalRecipient: originalRecipientEmail
      };
    }
  }
}

// Create singleton instance
const loginEmailService = new LoginEmailService();

// Export the send function
export async function sendLoginNotification(recipientEmail, userName, loginDetails) {
  return await loginEmailService.sendLoginNotification(recipientEmail, userName, loginDetails);
}

// Export connection test function
export async function testConnection() {
  if (!loginEmailService.isInitialized) {
    await loginEmailService.initialize();
  }
  return true;
}
