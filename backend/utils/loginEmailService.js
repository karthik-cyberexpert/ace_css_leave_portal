import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

/**
 * Enhanced Login Email Service
 * Completely rebuilt with comprehensive error handling and logging
 */
class LoginEmailService {
  constructor() {
    this.isInitialized = false;
    this.transporter = null;
    this.config = {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false
    };
  }

  /**
   * Initialize the email service
   */
  async initialize() {
    try {
      console.log('🔧 Initializing Login Email Service...');
      
      // Check environment variables
      if (!this.config.user || !this.config.password) {
        throw new Error('EMAIL_USER or EMAIL_PASSWORD not found in environment variables');
      }
      
      console.log(`📧 Email User: ${this.config.user}`);
      console.log(`🔑 Password Length: ${this.config.password.length} characters`);
      
      // Create transporter
      this.transporter = nodemailer.createTransport({
        service: this.config.service,
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Test connection
      console.log('🔗 Testing SMTP connection...');
      await this.transporter.verify();
      console.log('✅ SMTP connection successful!');
      
      this.isInitialized = true;
      return { success: true, message: 'Email service initialized successfully' };
      
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.isInitialized = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Send login notification email
   */
  async sendLoginNotification(userEmail, userName, loginDetails = {}) {
    try {
      console.log('\n📨 === LOGIN EMAIL NOTIFICATION START ===');
      console.log(`👤 User: ${userName}`);
      console.log(`📧 Email: ${userEmail}`);
      console.log(`🕐 Time: ${new Date().toISOString()}`);
      
      // Initialize if not already done
      if (!this.isInitialized) {
        console.log('⚠️ Service not initialized, initializing now...');
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error(`Initialization failed: ${initResult.error}`);
        }
      }
      
      // Validate inputs
      if (!userEmail || !userName) {
        throw new Error('Missing required parameters: userEmail or userName');
      }
      
      // Prepare login timestamp in IST
      const loginTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      console.log(`🕐 Login Time (IST): ${loginTime}`);
      console.log(`🌐 IP Address: ${loginDetails.ipAddress || 'Unknown'}`);
      console.log(`💻 User Agent: ${loginDetails.userAgent ? loginDetails.userAgent.substring(0, 50) + '...' : 'Unknown'}`);
      
      // Create email content
      const mailOptions = {
        from: {
          name: 'ACE CSE Leave Portal - Login Alert',
          address: this.config.user
        },
        to: userEmail,
        subject: '🔐 Login Alert - ACE CSE Leave Portal',
        html: this.generateEmailHTML(userName, userEmail, loginTime, loginDetails),
        text: this.generateEmailText(userName, userEmail, loginTime, loginDetails)
      };
      
      console.log('📝 Email content prepared');
      console.log('📤 Sending email...');
      
      // Send email with detailed logging
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Sent to: ${userEmail}`);
      console.log('📨 === LOGIN EMAIL NOTIFICATION END ===\n');
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: userEmail,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('\n❌ === EMAIL SENDING FAILED ===');
      console.error(`Error: ${error.message}`);
      console.error(`Code: ${error.code || 'N/A'}`);
      console.error(`Command: ${error.command || 'N/A'}`);
      
      // Detailed error categorization
      if (error.code === 'EAUTH') {
        console.error('🔐 AUTHENTICATION ERROR:');
        console.error('   - Check if Gmail app password is correct');
        console.error('   - Verify EMAIL_PASSWORD in .env file');
        console.error('   - Ensure 2-step verification is enabled in Gmail');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('🔌 CONNECTION ERROR:');
        console.error('   - Check internet connection');
        console.error('   - Verify firewall/antivirus settings');
        console.error('   - Check if Gmail SMTP is accessible');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('⏰ TIMEOUT ERROR:');
        console.error('   - Network is slow or unstable');
        console.error('   - Try again in a few moments');
      } else {
        console.error('🔍 GENERAL ERROR:');
        console.error('   - Check server logs for details');
        console.error('   - Verify email service configuration');
      }
      
      console.error(`Stack trace: ${error.stack}`);
      console.error('❌ === EMAIL SENDING FAILED END ===\n');
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate HTML email content
   */
  generateEmailHTML(userName, userEmail, loginTime, loginDetails) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px;">
      <h1 style="color: #2c5aa0; margin: 0; font-size: 24px;">🔐 ACE CSE Leave Portal</h1>
      <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Login Security Alert</p>
    </div>

    <!-- Alert Icon -->
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background-color: #e8f4fd; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; font-size: 24px;">
        🔐
      </div>
    </div>

    <!-- Main Content -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #2c5aa0; margin-bottom: 15px;">New Login Detected</h2>
      <p style="font-size: 16px; color: #555; margin-bottom: 10px;">
        Hello <strong>${userName}</strong>,
      </p>
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Your account was successfully accessed on the Leave Portal System.
      </p>
    </div>

    <!-- Login Details -->
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="color: #2c5aa0; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Login Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555; width: 30%;">📅 Date & Time:</td>
          <td style="padding: 8px 0; color: #333;">${loginTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555;">📧 Email:</td>
          <td style="padding: 8px 0; color: #333;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555;">🌐 IP Address:</td>
          <td style="padding: 8px 0; color: #333;">${loginDetails.ipAddress || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555;">💻 Device:</td>
          <td style="padding: 8px 0; color: #333;">${loginDetails.userAgent ? loginDetails.userAgent.substring(0, 50) + '...' : 'N/A'}</td>
        </tr>
      </table>
    </div>

    <!-- Security Notice -->
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
      <h4 style="color: #856404; margin-top: 0; margin-bottom: 10px;">🔒 Security Notice</h4>
      <p style="color: #856404; margin: 0; font-size: 14px;">
        If this login was not made by you, please contact your system administrator immediately and change your password.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px; color: #666; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">
        This is an automated security notification from ACE CSE Leave Portal System.
      </p>
      <p style="margin: 0 0 10px 0;">
        <strong>© ${new Date().getFullYear()} ACE College of Engineering and Technology</strong>
      </p>
      <p style="margin: 0; color: #999;">
        Computer Science and Engineering Department
      </p>
    </div>

  </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email content
   */
  generateEmailText(userName, userEmail, loginTime, loginDetails) {
    return `
ACE CSE Leave Portal - Login Alert

Hello ${userName},

Your account was successfully accessed on ${loginTime}.

Login Details:
- Date & Time: ${loginTime}
- Email: ${userEmail}
- IP Address: ${loginDetails.ipAddress || 'N/A'}
- Device: ${loginDetails.userAgent || 'N/A'}

If this login was not made by you, please contact your system administrator immediately.

Best regards,
ACE CSE Leave Portal System
© ${new Date().getFullYear()} ACE College of Engineering and Technology
Computer Science and Engineering Department
    `.trim();
  }

  /**
   * Test the email service
   */
  async testEmailService(testEmail = null) {
    try {
      console.log('\n🧪 === EMAIL SERVICE TEST START ===');
      
      const targetEmail = testEmail || this.config.user;
      console.log(`🎯 Testing email to: ${targetEmail}`);
      
      const result = await this.sendLoginNotification(
        targetEmail,
        'Test User',
        {
          ipAddress: '192.168.46.89',
          userAgent: 'Test Browser - Email Service Test'
        }
      );
      
      console.log('🧪 === EMAIL SERVICE TEST END ===\n');
      return result;
      
    } catch (error) {
      console.error('❌ Email service test failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const loginEmailService = new LoginEmailService();

// Export functions
export const sendLoginNotification = async (userEmail, userName, loginDetails) => {
  return await loginEmailService.sendLoginNotification(userEmail, userName, loginDetails);
};

export const testLoginEmailService = async (testEmail) => {
  return await loginEmailService.testEmailService(testEmail);
};

export const initializeEmailService = async () => {
  return await loginEmailService.initialize();
};

export default loginEmailService;
