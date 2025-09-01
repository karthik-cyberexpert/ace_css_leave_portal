import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 EMAIL SYSTEM FIX & DIAGNOSIS');
console.log('='.repeat(60));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

class EmailSystemFixer {
  constructor() {
    this.envPath = path.resolve(__dirname, '.env');
    this.issues = [];
    this.fixes = [];
  }

  async diagnoseAndFix() {
    console.log('\n📋 STEP 1: ENVIRONMENT VARIABLES CHECK');
    await this.checkEnvironmentVariables();

    console.log('\n📋 STEP 2: GMAIL CONFIGURATION VALIDATION');
    await this.validateGmailConfig();

    console.log('\n📋 STEP 3: NETWORK & CONNECTIVITY TEST');
    await this.testConnectivity();

    console.log('\n📋 STEP 4: EMAIL SERVICE INTEGRATION TEST');
    await this.testEmailServiceIntegration();

    console.log('\n📋 STEP 5: APPLY FIXES');
    await this.applyFixes();

    this.generateReport();
  }

  async checkEnvironmentVariables() {
    console.log('   Checking .env file...');
    
    if (!fs.existsSync(this.envPath)) {
      this.issues.push('❌ .env file not found');
      this.fixes.push('Create .env file with email configuration');
      return;
    }

    const envContent = fs.readFileSync(this.envPath, 'utf8');
    console.log('   ✅ .env file exists');

    // Check EMAIL_USER
    if (!process.env.EMAIL_USER) {
      this.issues.push('❌ EMAIL_USER not set in .env');
      this.fixes.push('Add EMAIL_USER=adhiyamaancyber@gmail.com to .env');
    } else {
      console.log('   ✅ EMAIL_USER:', process.env.EMAIL_USER);
    }

    // Check EMAIL_PASSWORD
    if (!process.env.EMAIL_PASSWORD) {
      this.issues.push('❌ EMAIL_PASSWORD not set in .env');
      this.fixes.push('Add EMAIL_PASSWORD=your_app_password to .env');
    } else {
      console.log('   ✅ EMAIL_PASSWORD: Set (' + process.env.EMAIL_PASSWORD.length + ' chars)');
      
      // Check if it looks like an app password (16 chars, no spaces)
      if (process.env.EMAIL_PASSWORD.length !== 16 || process.env.EMAIL_PASSWORD.includes(' ')) {
        this.issues.push('⚠️ EMAIL_PASSWORD format looks incorrect (should be 16-char app password)');
        this.fixes.push('Generate new Gmail App Password and update .env');
      }
    }
  }

  async validateGmailConfig() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('   ❌ Skipping Gmail test - credentials missing');
      return;
    }

    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      console.log('   Testing SMTP connection...');
      await transporter.verify();
      console.log('   ✅ Gmail SMTP connection successful');

    } catch (error) {
      this.issues.push(`❌ Gmail SMTP connection failed: ${error.message}`);
      
      if (error.code === 'EAUTH') {
        this.fixes.push('Gmail authentication failed - regenerate App Password');
      } else if (error.code === 'ECONNREFUSED') {
        this.fixes.push('Connection refused - check firewall/network settings');
      } else {
        this.fixes.push(`Gmail error (${error.code}) - check account settings`);
      }
    }
  }

  async testConnectivity() {
    // Test basic internet connectivity
    try {
      console.log('   Testing network connectivity...');
      const https = await import('https');
      
      await new Promise((resolve, reject) => {
        const req = https.request('https://smtp.gmail.com/', (res) => {
          console.log('   ✅ Can reach Gmail servers');
          resolve();
        });
        
        req.on('error', (error) => {
          this.issues.push('❌ Cannot reach Gmail servers');
          this.fixes.push('Check internet connection and firewall settings');
          reject(error);
        });
        
        req.setTimeout(5000, () => {
          this.issues.push('❌ Timeout reaching Gmail servers');
          this.fixes.push('Check network speed and stability');
          reject(new Error('Timeout'));
        });
        
        req.end();
      });

    } catch (error) {
      console.log('   ❌ Network connectivity issue:', error.message);
    }
  }

  async testEmailServiceIntegration() {
    console.log('   Testing email service modules...');
    
    try {
      // Test main email service
      const { sendTestEmail } = await import('./backend/utils/emailService.js');
      console.log('   ✅ Main email service module loaded');
      
      // Test login email service
      const { sendLoginNotification } = await import('./backend/utils/loginEmailService.js');
      console.log('   ✅ Login email service module loaded');
      
      // Test actual sending
      console.log('   Testing actual email sending...');
      const testResult = await sendTestEmail(process.env.EMAIL_USER);
      
      if (testResult.success) {
        console.log('   ✅ Email sending test successful!');
        console.log('   📧 Message ID:', testResult.messageId);
      } else {
        this.issues.push(`❌ Email sending failed: ${testResult.error}`);
        this.fixes.push('Email configuration or service issue detected');
      }

    } catch (error) {
      this.issues.push(`❌ Email service integration error: ${error.message}`);
      this.fixes.push('Check email service module imports and dependencies');
    }
  }

  async applyFixes() {
    if (this.fixes.length === 0) {
      console.log('   ✅ No fixes needed - email system is working correctly!');
      return;
    }

    console.log('   Applying automatic fixes...');

    // Fix 1: Ensure environment variables are properly set
    if (this.fixes.some(fix => fix.includes('.env'))) {
      console.log('   🔧 Checking .env configuration...');
      
      let envContent = '';
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }

      // Ensure email configuration exists
      if (!envContent.includes('EMAIL_USER=')) {
        envContent += '\n# Email Configuration\n';
        envContent += 'EMAIL_USER=adhiyamaancyber@gmail.com\n';
        console.log('   ✅ Added EMAIL_USER to .env');
      }

      if (!envContent.includes('EMAIL_PASSWORD=') && !process.env.EMAIL_PASSWORD) {
        envContent += 'EMAIL_PASSWORD=your_16_char_app_password_here\n';
        console.log('   ⚠️ Added EMAIL_PASSWORD placeholder to .env - UPDATE THIS!');
      }

      fs.writeFileSync(this.envPath, envContent);
    }

    // Fix 2: Create a corrected login email service
    if (this.issues.some(issue => issue.includes('Email service'))) {
      console.log('   🔧 Creating optimized email service...');
      await this.createOptimizedEmailService();
    }
  }

  async createOptimizedEmailService() {
    const optimizedServicePath = path.join(__dirname, 'backend', 'utils', 'loginEmailService.fixed.js');
    
    const optimizedService = `import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with absolute path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class OptimizedLoginEmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;

    console.log('🔧 Initializing Optimized Email Service...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email credentials not found in environment');
    }

    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5
    });

    // Verify connection
    await this.transporter.verify();
    console.log('✅ Email service initialized successfully');
    
    this.initialized = true;
    return true;
  }

  async sendLoginNotification(userEmail, userName, loginDetails = {}) {
    try {
      console.log('📨 === OPTIMIZED LOGIN EMAIL START ===');
      console.log('📧 Target:', userEmail);
      console.log('👤 User:', userName);

      await this.initialize();

      const loginTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const mailOptions = {
        from: {
          name: 'ACE CSS Leave Portal',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: '🔐 Login Alert - ACE CSS Leave Portal',
        html: this.generateEmailHTML(userName, userEmail, loginTime, loginDetails),
        priority: 'normal'
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('📨 === OPTIMIZED LOGIN EMAIL END ===');

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Optimized email service error:', error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  generateEmailHTML(userName, userEmail, loginTime, loginDetails) {
    return \`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; text-align: center;">🔐 Login Alert</h1>
          <p style="margin: 10px 0 0 0; text-align: center; opacity: 0.9;">ACE CSS Leave Portal</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #333;">Hello <strong>\${userName}</strong>,</p>
          
          <p style="color: #666; line-height: 1.6;">
            Your account was successfully accessed on the Leave Portal System.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #495057;">Login Details:</h3>
            <p><strong>📅 Time:</strong> \${loginTime}</p>
            <p><strong>📧 Email:</strong> \${userEmail}</p>
            <p><strong>🌐 IP:</strong> \${loginDetails.ipAddress || 'Unknown'}</p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>🔒 Security Notice:</strong> If this wasn't you, contact your administrator immediately.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© \${new Date().getFullYear()} ACE College of Engineering and Technology</p>
          </div>
        </div>
      </div>
    \`;
  }
}

// Export singleton
const optimizedEmailService = new OptimizedLoginEmailService();

export const sendLoginNotification = async (userEmail, userName, loginDetails) => {
  return await optimizedEmailService.sendLoginNotification(userEmail, userName, loginDetails);
};

export default optimizedEmailService;
`;

    // Write the optimized service
    fs.writeFileSync(optimizedServicePath, optimizedService);
    console.log('   ✅ Created optimized email service:', optimizedServicePath);
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 EMAIL SYSTEM DIAGNOSIS REPORT');
    console.log('='.repeat(60));

    if (this.issues.length === 0) {
      console.log('\n✅ EXCELLENT! No issues found.');
      console.log('   Your email system is configured correctly and should work.');
      console.log('   If emails still don\'t send during login, the issue might be:');
      console.log('   1. Timing issue in the login process');
      console.log('   2. Server not calling the email function');
      console.log('   3. Email being sent to spam folder');
    } else {
      console.log('\n❌ ISSUES FOUND:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (this.fixes.length > 0) {
      console.log('\n🔧 FIXES APPLIED/RECOMMENDED:');
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Run: node test-email-diagnosis.js');
    console.log('   2. Run: node test-login-email.js');
    console.log('   3. Test actual login and check console logs');
    console.log('   4. Check email spam/junk folder');
    
    if (this.issues.some(issue => issue.includes('app password'))) {
      console.log('\n🔑 GMAIL APP PASSWORD SETUP:');
      console.log('   1. Go to https://myaccount.google.com/security');
      console.log('   2. Enable 2-Step Verification');
      console.log('   3. Generate App Password for "Mail"');
      console.log('   4. Use the 16-character password in .env file');
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run the diagnosis and fix
const fixer = new EmailSystemFixer();
fixer.diagnoseAndFix().catch(console.error);
