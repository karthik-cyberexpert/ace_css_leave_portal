import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'adhiyamaancyber@gmail.com',
      pass: process.env.EMAIL_PASSWORD // App password will be set in environment
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send login notification email
export const sendLoginNotification = async (userEmail, userName, loginDetails) => {
  try {
    const transporter = createTransporter();
    
    // Get current timestamp in IST
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

    const mailOptions = {
      from: {
        name: 'ACE CSE Leave Portal',
        address: process.env.EMAIL_USER || 'adhiyamaancyber@gmail.com'
      },
      to: userEmail,
      subject: '🔐 Login Alert - ACE CSE Leave Portal',
      html: `
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
              <h1 style="color: #2c5aa0; margin: 0; font-size: 24px;">ACE CSE Leave Portal</h1>
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

            <!-- Action Buttons -->
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.VITE_API_URL || 'http://localhost:8080'}/profile" 
                 style="display: inline-block; background-color: #2c5aa0; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; margin: 0 10px;">
                View Profile
              </a>
              <a href="${process.env.VITE_API_URL || 'http://localhost:8080'}/dashboard" 
                 style="display: inline-block; background-color: #28a745; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; margin: 0 10px;">
                Go to Dashboard
              </a>
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
        </html>
      `,
      text: `
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
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Login notification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending login notification email:', error.message);
    return { success: false, error: error.message };
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection successful');
    return { success: true, message: 'Email server connection successful' };
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send test email
export const sendTestEmail = async (testEmail = 'adhiyamaancyber@gmail.com') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ACE CSE Leave Portal',
        address: process.env.EMAIL_USER || 'adhiyamaancyber@gmail.com'
      },
      to: testEmail,
      subject: '✅ Test Email - ACE CSE Leave Portal SMTP Setup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2c5aa0; text-align: center;">🎉 Email Setup Successful!</h1>
            <p>This is a test email to confirm that Gmail SMTP is working correctly for the ACE CSE Leave Portal system.</p>
            <p><strong>Configuration:</strong></p>
            <ul>
              <li>SMTP Server: smtp.gmail.com:587</li>
              <li>From Email: adhiyamaancyber@gmail.com</li>
              <li>Test Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
            </ul>
            <p style="color: #28a745;"><strong>✅ Email service is ready for login notifications!</strong></p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    return { success: false, error: error.message };
  }
};
