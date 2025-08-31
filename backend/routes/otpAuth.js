import express from 'express';
import otpManager from '../utils/otpUtils.js';
import otpEmailService from '../utils/otpEmailService.js';
import { requireJWTOnly } from '../middleware/otpAuth.js';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database.js';

/**
 * =====================================================================================
 * ACE CSS LEAVE PORTAL - OTP AUTHENTICATION ROUTES
 * =====================================================================================
 * Version: 2.2.0
 * Purpose: Handle OTP generation, verification, and resending
 * Features: Rate limiting, secure OTP handling, comprehensive validation
 * =====================================================================================
 */

const router = express.Router();

/**
 * POST /otp/generate
 * Generate and send OTP to user's email
 */
router.post('/generate', requireJWTOnly, async (req, res) => {
  try {
    const { purpose = 'login' } = req.body;
    const userId = req.user.id;
    
    console.log(`🔐 === OTP GENERATION REQUEST ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`IP: ${req.ip}`);
    console.log(`User Agent: ${req.get('User-Agent')?.substring(0, 100)}...`);
    
    // Get user details from database
    const connection = await mysql.createConnection(dbConfig);
    
    const [userRows] = await connection.execute(`
      SELECT u.id, u.email, u.first_name, u.last_name, s.name as student_name, st.name as staff_name
      FROM users u
      LEFT JOIN students s ON u.id = s.id
      LEFT JOIN staff st ON u.id = st.id
      WHERE u.id = ?
    `, [userId]);
    
    await connection.end();
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = userRows[0];
    const userName = user.student_name || user.staff_name || `${user.first_name} ${user.last_name}`.trim() || 'User';
    const userEmail = user.email;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email not found. Cannot send OTP.',
        code: 'NO_EMAIL'
      });
    }
    
    // Generate OTP
    const otpResult = await otpManager.createOTP(
      userId,
      userEmail,
      purpose,
      req.ip,
      req.get('User-Agent')
    );
    
    if (!otpResult.success) {
      return res.status(429).json({
        success: false,
        error: otpResult.error,
        waitTime: otpResult.waitTime,
        code: 'OTP_GENERATION_FAILED'
      });
    }
    
    // Send OTP email
    const emailResult = await otpEmailService.sendOTPEmail(
      userEmail,
      userName,
      otpResult.otpCode,
      purpose,
      otpResult.expiresIn
    );
    
    if (!emailResult.success) {
      console.error('❌ Failed to send OTP email:', emailResult.error);
      // Even if email fails, we don't want to expose internal errors
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email. Please try again later.',
        code: 'EMAIL_SEND_FAILED'
      });
    }
    
    console.log(`✅ OTP generated and sent successfully to ${userEmail}`);
    console.log(`🔐 === OTP GENERATION COMPLETE ===`);
    
    // Return success without exposing OTP code
    res.json({
      success: true,
      message: `OTP sent successfully to ${userEmail.replace(/(.{2}).*@/, '$1***@')}`,
      otpId: otpResult.otpId,
      expiresIn: otpResult.expiresIn,
      expiresAt: otpResult.expiresAt,
      email: userEmail.replace(/(.{2}).*@/, '$1***@'), // Masked email
      purpose: purpose
    });
    
  } catch (error) {
    console.error('❌ Error in OTP generation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during OTP generation',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /otp/verify
 * Verify OTP provided by user
 */
router.post('/verify', requireJWTOnly, async (req, res) => {
  try {
    const { otpCode, purpose = 'login' } = req.body;
    const userId = req.user.id;
    
    console.log(`🔍 === OTP VERIFICATION REQUEST ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`IP: ${req.ip}`);
    
    // Validate input
    if (!otpCode) {
      return res.status(400).json({
        success: false,
        error: 'OTP code is required',
        code: 'MISSING_OTP'
      });
    }
    
    if (!/^\d{6}$/.test(otpCode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format. Must be 6 digits.',
        code: 'INVALID_OTP_FORMAT'
      });
    }
    
    // Verify OTP
    const verificationResult = await otpManager.verifyOTP(
      userId,
      otpCode,
      purpose,
      req.ip
    );
    
    if (!verificationResult.success) {
      console.log(`❌ OTP verification failed: ${verificationResult.error}`);
      
      return res.status(400).json({
        success: false,
        error: verificationResult.error,
        code: verificationResult.code,
        remainingAttempts: verificationResult.remainingAttempts
      });
    }
    
    console.log(`✅ OTP verified successfully for user ${userId}`);
    console.log(`🔍 === OTP VERIFICATION COMPLETE ===`);
    
    res.json({
      success: true,
      message: 'OTP verified successfully',
      otpId: verificationResult.otpId,
      verified: true
    });
    
  } catch (error) {
    console.error('❌ Error in OTP verification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during OTP verification',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /otp/resend
 * Resend OTP to user (with rate limiting)
 */
router.post('/resend', requireJWTOnly, async (req, res) => {
  try {
    const { purpose = 'login' } = req.body;
    const userId = req.user.id;
    
    console.log(`🔄 === OTP RESEND REQUEST ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Purpose: ${purpose}`);
    
    // Check if user can request a new OTP
    const rateLimitCheck = await otpManager.canRequestOTP(userId);
    
    if (!rateLimitCheck.canRequest) {
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.reason,
        waitTime: rateLimitCheck.waitTime,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    // Use the same logic as generate endpoint
    const generateRequest = { body: { purpose }, user: req.user, ip: req.ip, get: req.get.bind(req) };
    
    // Forward to generate endpoint logic
    return router.handle({ 
      method: 'POST', 
      url: '/generate',
      body: { purpose },
      user: req.user,
      ip: req.ip,
      get: req.get.bind(req)
    }, res);
    
  } catch (error) {
    console.error('❌ Error in OTP resend:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during OTP resend',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /otp/status
 * Check OTP verification status for current user
 */
router.get('/status', requireJWTOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const isVerified = await otpManager.isOTPVerified(userId);
    
    res.json({
      success: true,
      isVerified: isVerified,
      requiresOTP: !isVerified,
      userId: userId
    });
    
  } catch (error) {
    console.error('❌ Error checking OTP status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error checking OTP status',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /otp/reset
 * Reset OTP verification status (for logout)
 */
router.post('/reset', requireJWTOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const resetResult = await otpManager.resetOTPVerification(userId);
    
    if (!resetResult.success) {
      return res.status(500).json({
        success: false,
        error: resetResult.error,
        code: 'RESET_FAILED'
      });
    }
    
    console.log(`🔄 OTP verification reset for user ${userId}`);
    
    res.json({
      success: true,
      message: 'OTP verification reset successfully'
    });
    
  } catch (error) {
    console.error('❌ Error resetting OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during OTP reset',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /otp/stats (Admin only)
 * Get OTP system statistics
 */
router.get('/stats', requireJWTOnly, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.',
        code: 'ACCESS_DENIED'
      });
    }
    
    const statsResult = await otpManager.getOTPStats();
    
    if (!statsResult.success) {
      return res.status(500).json({
        success: false,
        error: statsResult.error,
        code: 'STATS_ERROR'
      });
    }
    
    res.json({
      success: true,
      stats: statsResult.stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting OTP stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error getting OTP stats',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /otp/test-email (Development only)
 * Test OTP email sending
 */
router.post('/test-email', requireJWTOnly, async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Test endpoint not available in production',
        code: 'NOT_AVAILABLE'
      });
    }
    
    const { email } = req.body;
    const testEmail = email || 'adhiyamaancyber@gmail.com';
    
    const result = await otpEmailService.sendTestOTPEmail(testEmail);
    
    res.json({
      success: result.success,
      message: result.success ? 'Test OTP email sent successfully' : 'Failed to send test email',
      error: result.error,
      messageId: result.messageId,
      recipient: testEmail
    });
    
  } catch (error) {
    console.error('❌ Error sending test OTP email:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error sending test email',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
