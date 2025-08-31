import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

/**
 * =====================================================================================
 * ACE CSS LEAVE PORTAL - OTP EMAIL SERVICE
 * =====================================================================================
 * Version: 2.2.0
 * Purpose: Send OTP verification emails with professional templates
 * Features: Multiple purposes, rate limiting, secure delivery
 * =====================================================================================
 */

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

class OTPEmailService {
  constructor() {
    this.isInitialized = false;
    this.transporter = null;
    this.config = {
      user: process.env.SMTP_USER || process.env.EMAIL_USER || 'adhiyamaancyber@gmail.com',
      password: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      fromName: 'ACE CSE Leave Portal - Security',
      fromEmail: process.env.SMTP_FROM || process.env.EMAIL_USER || 'adhiyamaancyber@gmail.com'
    };
  }

  /**
   * Initialize the email service
   */
  async initialize() {
    try {
      console.log('🔧 Initializing OTP Email Service...');
      
      // Check environment variables
      if (!this.config.user || !this.config.password) {
        throw new Error('SMTP credentials not found in environment variables');
      }
      
      console.log(`📧 SMTP User: ${this.config.user}`);
      console.log(`🔑 SMTP Password Length: ${this.config.password.length} characters`);
      console.log(`🏢 SMTP Host: ${this.config.host}:${this.config.port}`);
      
      // Create transporter
      this.transporter = nodemailer.createTransporter({
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
      console.log('🔗 Testing SMTP connection for OTP service...');
      await this.transporter.verify();
      console.log('✅ OTP Email Service SMTP connection successful!');
      
      this.isInitialized = true;
      return { success: true, message: 'OTP Email service initialized successfully' };
      
    } catch (error) {
      console.error('❌ Failed to initialize OTP email service:', error.message);
      this.isInitialized = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(userEmail, userName, otpCode, purpose = 'login', expiresIn = 10) {
    try {
      console.log(`📨 === OTP EMAIL SENDING START ===`);
      console.log(`👤 User: ${userName}`);
      console.log(`📧 Email: ${userEmail}`);
      console.log(`🔐 Purpose: ${purpose}`);
      console.log(`⏰ Expires in: ${expiresIn} minutes`);
      console.log(`🕐 Time: ${new Date().toISOString()}`);
      
      // Initialize if not already done
      if (!this.isInitialized) {
        console.log('⚠️ OTP Email service not initialized, initializing now...');
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error(`Initialization failed: ${initResult.error}`);
        }
      }
      
      // Validate inputs
      if (!userEmail || !userName || !otpCode) {
        throw new Error('Missing required parameters: userEmail, userName, or otpCode');
      }
      
      if (!/^\d{6}$/.test(otpCode)) {
        throw new Error('Invalid OTP format. Must be 6 digits.');
      }
      
      // Get current timestamp in IST
      const currentTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      // Prepare email content based on purpose
      const emailContent = this.getEmailContentByPurpose(purpose, userName, otpCode, expiresIn, currentTime);
      
      const mailOptions = {
        from: {
          name: this.config.fromName,
          address: this.config.fromEmail
        },
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        priority: 'high', // High priority for OTP emails
        headers: {
          'X-Mailer': 'ACE CSE Leave Portal OTP Service',
          'X-Priority': '1'
        }
      };
      
      console.log('📝 OTP email content prepared');
      console.log('📤 Sending OTP email...');
      
      // Send email with detailed logging
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ OTP email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Sent to: ${userEmail}`);
      console.log(`🔐 OTP expires in: ${expiresIn} minutes`);
      console.log('📨 === OTP EMAIL SENDING END ===\n');
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: userEmail,
        expiresIn: expiresIn,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('\n❌ === OTP EMAIL SENDING FAILED ===');
      console.error(`Error: ${error.message}`);
      console.error(`Code: ${error.code || 'N/A'}`);
      
      // Detailed error categorization
      if (error.code === 'EAUTH') {
        console.error('🔐 AUTHENTICATION ERROR:');
        console.error('   - Check if Gmail app password is correct');
        console.error('   - Verify SMTP credentials in .env file');
        console.error('   - Ensure 2-step verification is enabled in Gmail');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('🔌 CONNECTION ERROR:');
        console.error('   - Check internet connection');
        console.error('   - Verify firewall/antivirus settings');
        console.error('   - Check if SMTP server is accessible');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('⏰ TIMEOUT ERROR:');
        console.error('   - Network is slow or unstable');
        console.error('   - Try again in a few moments');
      }
      
      console.error('❌ === OTP EMAIL SENDING FAILED END ===\n');
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get email content based on purpose
   */
  getEmailContentByPurpose(purpose, userName, otpCode, expiresIn, currentTime) {
    const baseConfig = {
      collegeName: 'ACE College of Engineering and Technology',
      departmentName: 'Computer Science and Engineering Department',
      portalName: 'ACE CSE Leave Portal',
      supportEmail: 'support@ace.edu.in',
      year: new Date().getFullYear()
    };

    const purposeConfig = {
      login: {
        subject: '🔐 Login Verification Code - ACE CSE Leave Portal',
        title: 'Login Verification Required',
        emoji: '🔐',
        description: 'You are attempting to log into your Leave Portal account. Please use the verification code below to complete your login.',
        urgency: 'high',
        actionText: 'Complete Login'
      },
      password_reset: {
        subject: '🔑 Password Reset Code - ACE CSE Leave Portal',
        title: 'Password Reset Verification',
        emoji: '🔑',
        description: 'You have requested to reset your password. Please use the verification code below to proceed with password reset.',
        urgency: 'high',
        actionText: 'Reset Password'
      },
      email_change: {
        subject: '📧 Email Change Verification - ACE CSE Leave Portal',
        title: 'Email Change Verification',
        emoji: '📧',
        description: 'You have requested to change your email address. Please use the verification code below to confirm this change.',
        urgency: 'normal',
        actionText: 'Confirm Email Change'
      },
      account_verification: {
        subject: '✅ Account Verification Code - ACE CSE Leave Portal',
        title: 'Account Verification Required',
        emoji: '✅',
        description: 'Welcome to the Leave Portal! Please use the verification code below to verify your account and complete the setup.',
        urgency: 'normal',
        actionText: 'Verify Account'
      }
    };

    const config = purposeConfig[purpose] || purposeConfig.login;

    // Format OTP with spaces for better readability
    const formattedOTP = otpCode.split('').join(' ');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px;">
      <h1 style="color: #2c5aa0; margin: 0; font-size: 24px;">${config.emoji} ${baseConfig.portalName}</h1>
      <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">${config.title}</p>
    </div>

    <!-- OTP Icon -->
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background-color: #e8f4fd; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; font-size: 32px;">
        ${config.emoji}
      </div>
    </div>

    <!-- Main Content -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #2c5aa0; margin-bottom: 15px;">${config.title}</h2>
      <p style="font-size: 16px; color: #555; margin-bottom: 10px;">
        Hello <strong>${userName}</strong>,
      </p>
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        ${config.description}
      </p>
    </div>

    <!-- OTP Code Display -->
    <div style="background-color: #f8f9fa; border: 3px dashed #2c5aa0; padding: 30px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
      <h3 style="color: #2c5aa0; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Your Verification Code</h3>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2c5aa0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 15px; border-radius: 8px; border: 2px solid #2c5aa0;">
        ${formattedOTP}
      </div>
      <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">
        ⏰ This code expires in <strong>${expiresIn} minutes</strong>
      </p>
    </div>

    <!-- Instructions -->
    <div style="background-color: #e8f4fd; border-left: 4px solid #2c5aa0; padding: 15px; margin-bottom: 25px;">
      <h4 style="color: #2c5aa0; margin-top: 0; margin-bottom: 10px;">📋 Instructions:</h4>
      <ul style="color: #555; margin: 0; padding-left: 20px;">
        <li>Enter this 6-digit code in the verification form</li>
        <li>Do not share this code with anyone</li>
        <li>The code expires in ${expiresIn} minutes</li>
        <li>You have 3 attempts to enter the correct code</li>
      </ul>
    </div>

    <!-- Security Notice -->
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
      <h4 style="color: #856404; margin-top: 0; margin-bottom: 10px;">🔒 Security Notice</h4>
      <p style="color: #856404; margin: 0; font-size: 14px;">
        If you did not request this verification code, please ignore this email and contact your system administrator immediately. 
        Your account security may be at risk.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin-bottom: 30px;">
      <p style="color: #555; margin-bottom: 15px;">Having trouble entering the code?</p>
      <a href="${process.env.VITE_API_URL || 'http://localhost:8085'}/login" 
         style="display: inline-block; background-color: #2c5aa0; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">
        ${config.actionText}
      </a>
    </div>

    <!-- Technical Details -->
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
      <h4 style="color: #2c5aa0; margin-top: 0; margin-bottom: 10px; font-size: 16px;">📊 Verification Details:</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; font-weight: bold; color: #555; width: 30%;">📅 Requested:</td>
          <td style="padding: 5px 0; color: #333;">${currentTime}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold; color: #555;">📧 Email:</td>
          <td style="padding: 5px 0; color: #333;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold; color: #555;">⏱️ Valid Until:</td>
          <td style="padding: 5px 0; color: #333;">${new Date(Date.now() + expiresIn * 60 * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold; color: #555;">🎯 Purpose:</td>
          <td style="padding: 5px 0; color: #333;">${purpose.replace('_', ' ').toUpperCase()}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px; color: #666; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">
        This is an automated security verification email from ${baseConfig.portalName}.
      </p>
      <p style="margin: 0 0 10px 0;">
        <strong>© ${baseConfig.year} ${baseConfig.collegeName}</strong>
      </p>
      <p style="margin: 0; color: #999;">
        ${baseConfig.departmentName}
      </p>
      <p style="margin: 10px 0 0 0; color: #999;">
        Need help? Contact: ${baseConfig.supportEmail}
      </p>
    </div>

  </div>
</body>
</html>`;

    const text = `
${baseConfig.portalName} - ${config.title}

Hello ${userName},

${config.description}

Your Verification Code: ${otpCode}

⏰ This code expires in ${expiresIn} minutes.

Instructions:
- Enter this 6-digit code in the verification form
- Do not share this code with anyone
- You have 3 attempts to enter the correct code

Verification Details:
- Requested: ${currentTime}
- Email: ${userEmail}
- Purpose: ${purpose.replace('_', ' ').toUpperCase()}
- Valid Until: ${new Date(Date.now() + expiresIn * 60 * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

🔒 Security Notice:
If you did not request this verification code, please ignore this email and contact your system administrator immediately.

Best regards,
${baseConfig.portalName}
© ${baseConfig.year} ${baseConfig.collegeName}
${baseConfig.departmentName}

Need help? Contact: ${baseConfig.supportEmail}
    `.trim();

    return {
      subject: config.subject,
      html: html,
      text: text
    };
  }

  /**
   * Test OTP email service
   */
  async sendTestOTPEmail(testEmail = 'adhiyamaancyber@gmail.com') {
    try {
      const testOTP = '123456';
      const result = await this.sendOTPEmail(
        testEmail,
        'Test User',
        testOTP,
        'login',
        10
      );
      
      return result;
      
    } catch (error) {
      console.error('❌ Error sending test OTP email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const otpEmailService = new OTPEmailService();
export default otpEmailService;

// Export for direct usage
export const sendOTPEmail = otpEmailService.sendOTPEmail.bind(otpEmailService);
export const sendTestOTPEmail = otpEmailService.sendTestOTPEmail.bind(otpEmailService);
