import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database.js';

/**
 * =====================================================================================
 * ACE CSS LEAVE PORTAL - OTP UTILITIES
 * =====================================================================================
 * Version: 2.2.0
 * Purpose: Secure OTP generation, validation, and management
 * Features: Rate limiting, attempt tracking, secure storage
 * =====================================================================================
 */

class OTPManager {
  constructor() {
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY_MINUTES = 10; // 10 minutes expiry
    this.MAX_ATTEMPTS = 3;
    this.RATE_LIMIT_MINUTES = 5; // 5 minutes between OTP requests
    this.CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour cleanup interval
    
    // Start automatic cleanup
    this.startCleanupScheduler();
  }

  /**
   * Generate a secure 6-digit OTP
   */
  generateOTP() {
    // Generate cryptographically secure random number
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    
    // Convert to 6-digit string with leading zeros
    const otp = (randomNumber % 1000000).toString().padStart(6, '0');
    
    return otp;
  }

  /**
   * Hash OTP for secure storage
   */
  async hashOTP(otp) {
    const saltRounds = 12; // Higher salt rounds for OTP security
    return await bcrypt.hash(otp, saltRounds);
  }

  /**
   * Verify OTP against hash
   */
  async verifyOTP(otp, hash) {
    return await bcrypt.compare(otp, hash);
  }

  /**
   * Check if user can request a new OTP (rate limiting)
   */
  async canRequestOTP(userId) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      const [rows] = await connection.execute(`
        SELECT last_otp_request 
        FROM users 
        WHERE id = ?
      `, [userId]);
      
      await connection.end();
      
      if (rows.length === 0) {
        return { canRequest: false, reason: 'User not found' };
      }
      
      const lastRequest = rows[0].last_otp_request;
      
      if (!lastRequest) {
        return { canRequest: true };
      }
      
      const timeDiff = Date.now() - new Date(lastRequest).getTime();
      const minutesSinceLastRequest = timeDiff / (1000 * 60);
      
      if (minutesSinceLastRequest < this.RATE_LIMIT_MINUTES) {
        const waitTime = Math.ceil(this.RATE_LIMIT_MINUTES - minutesSinceLastRequest);
        return { 
          canRequest: false, 
          reason: `Please wait ${waitTime} minute(s) before requesting a new OTP`,
          waitTime: waitTime
        };
      }
      
      return { canRequest: true };
      
    } catch (error) {
      console.error('❌ Error checking OTP rate limit:', error);
      return { canRequest: false, reason: 'Database error' };
    }
  }

  /**
   * Create a new OTP for user
   */
  async createOTP(userId, email, purpose = 'login', ipAddress = null, userAgent = null) {
    try {
      console.log(`🔐 Creating OTP for user: ${userId}, email: ${email}, purpose: ${purpose}`);
      
      // Check rate limiting
      const rateLimitCheck = await this.canRequestOTP(userId);
      if (!rateLimitCheck.canRequest) {
        return {
          success: false,
          error: rateLimitCheck.reason,
          waitTime: rateLimitCheck.waitTime
        };
      }
      
      const connection = await mysql.createConnection(dbConfig);
      
      try {
        await connection.beginTransaction();
        
        // Generate OTP and hash
        const otpCode = this.generateOTP();
        const otpHash = await this.hashOTP(otpCode);
        const otpId = uuidv4();
        const expiresAt = new Date(Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000));
        
        // Invalidate any existing active OTPs for this user and purpose
        await connection.execute(`
          UPDATE otp_verifications 
          SET is_used = TRUE, updated_at = NOW() 
          WHERE user_id = ? AND purpose = ? AND is_used = FALSE
        `, [userId, purpose]);
        
        // Insert new OTP
        await connection.execute(`
          INSERT INTO otp_verifications (
            id, user_id, email, otp_code, otp_hash, purpose, 
            expires_at, ip_address, user_agent, max_attempts
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          otpId, userId, email, otpCode, otpHash, purpose,
          expiresAt, ipAddress, userAgent, this.MAX_ATTEMPTS
        ]);
        
        // Update user's last OTP request timestamp
        await connection.execute(`
          UPDATE users 
          SET last_otp_request = NOW(), updated_at = NOW() 
          WHERE id = ?
        `, [userId]);
        
        await connection.commit();
        
        console.log(`✅ OTP created successfully: ID=${otpId}, Code=${otpCode}, Expires=${expiresAt.toISOString()}`);
        
        return {
          success: true,
          otpId: otpId,
          otpCode: otpCode, // Only return this for sending email, never store in logs
          expiresAt: expiresAt,
          expiresIn: this.OTP_EXPIRY_MINUTES
        };
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        await connection.end();
      }
      
    } catch (error) {
      console.error('❌ Error creating OTP:', error);
      return {
        success: false,
        error: 'Failed to create OTP. Please try again later.'
      };
    }
  }

  /**
   * Verify OTP provided by user
   */
  async verifyOTP(userId, otpCode, purpose = 'login', ipAddress = null) {
    try {
      console.log(`🔍 Verifying OTP for user: ${userId}, purpose: ${purpose}`);
      
      const connection = await mysql.createConnection(dbConfig);
      
      try {
        await connection.beginTransaction();
        
        // Find active OTP
        const [otpRows] = await connection.execute(`
          SELECT id, otp_hash, attempts, max_attempts, expires_at, is_verified, is_used
          FROM otp_verifications
          WHERE user_id = ? AND purpose = ? AND is_used = FALSE
          ORDER BY created_at DESC
          LIMIT 1
        `, [userId, purpose]);
        
        if (otpRows.length === 0) {
          return {
            success: false,
            error: 'No active OTP found. Please request a new OTP.',
            code: 'NO_ACTIVE_OTP'
          };
        }
        
        const otpRecord = otpRows[0];
        
        // Check if OTP is expired
        if (new Date() > new Date(otpRecord.expires_at)) {
          await connection.execute(`
            UPDATE otp_verifications 
            SET is_used = TRUE, updated_at = NOW() 
            WHERE id = ?
          `, [otpRecord.id]);
          
          await connection.commit();
          
          return {
            success: false,
            error: 'OTP has expired. Please request a new OTP.',
            code: 'OTP_EXPIRED'
          };
        }
        
        // Check if already verified
        if (otpRecord.is_verified) {
          return {
            success: false,
            error: 'OTP has already been verified.',
            code: 'ALREADY_VERIFIED'
          };
        }
        
        // Check maximum attempts
        if (otpRecord.attempts >= otpRecord.max_attempts) {
          await connection.execute(`
            UPDATE otp_verifications 
            SET is_used = TRUE, updated_at = NOW() 
            WHERE id = ?
          `, [otpRecord.id]);
          
          await connection.commit();
          
          return {
            success: false,
            error: 'Maximum verification attempts exceeded. Please request a new OTP.',
            code: 'MAX_ATTEMPTS_EXCEEDED'
          };
        }
        
        // Increment attempt count
        await connection.execute(`
          UPDATE otp_verifications 
          SET attempts = attempts + 1, updated_at = NOW() 
          WHERE id = ?
        `, [otpRecord.id]);
        
        // Verify OTP
        const isValid = await this.verifyOTP(otpCode, otpRecord.otp_hash);
        
        if (isValid) {
          // Mark as verified and used
          await connection.execute(`
            UPDATE otp_verifications 
            SET is_verified = TRUE, is_used = TRUE, verified_at = NOW(), updated_at = NOW()
            WHERE id = ?
          `, [otpRecord.id]);
          
          // Update user OTP verification status
          await connection.execute(`
            UPDATE users 
            SET otp_verified = TRUE, updated_at = NOW() 
            WHERE id = ?
          `, [userId]);
          
          await connection.commit();
          
          console.log(`✅ OTP verified successfully for user: ${userId}`);
          
          return {
            success: true,
            message: 'OTP verified successfully',
            otpId: otpRecord.id
          };
          
        } else {
          await connection.commit();
          
          const remainingAttempts = otpRecord.max_attempts - (otpRecord.attempts + 1);
          
          return {
            success: false,
            error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
            code: 'INVALID_OTP',
            remainingAttempts: remainingAttempts
          };
        }
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        await connection.end();
      }
      
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      return {
        success: false,
        error: 'Failed to verify OTP. Please try again later.',
        code: 'VERIFICATION_ERROR'
      };
    }
  }

  /**
   * Reset user's OTP verification status (for logout)
   */
  async resetOTPVerification(userId) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Mark user as not OTP verified
      await connection.execute(`
        UPDATE users 
        SET otp_verified = FALSE, updated_at = NOW() 
        WHERE id = ?
      `, [userId]);
      
      // Mark all active OTPs as used
      await connection.execute(`
        UPDATE otp_verifications 
        SET is_used = TRUE, updated_at = NOW() 
        WHERE user_id = ? AND is_used = FALSE
      `, [userId]);
      
      await connection.end();
      
      console.log(`🔄 OTP verification reset for user: ${userId}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error resetting OTP verification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user's OTP is verified
   */
  async isOTPVerified(userId) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      const [rows] = await connection.execute(`
        SELECT otp_verified 
        FROM users 
        WHERE id = ?
      `, [userId]);
      
      await connection.end();
      
      return rows.length > 0 ? rows[0].otp_verified : false;
      
    } catch (error) {
      console.error('❌ Error checking OTP verification status:', error);
      return false;
    }
  }

  /**
   * Cleanup expired and used OTPs
   */
  async cleanupExpiredOTPs() {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Delete expired and used OTPs older than 24 hours
      const [result] = await connection.execute(`
        DELETE FROM otp_verifications 
        WHERE (
          expires_at < NOW() 
          OR is_used = TRUE
        ) 
        AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);
      
      await connection.end();
      
      if (result.affectedRows > 0) {
        console.log(`🧹 Cleaned up ${result.affectedRows} expired OTP records`);
      }
      
      return { success: true, deletedCount: result.affectedRows };
      
    } catch (error) {
      console.error('❌ Error cleaning up expired OTPs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start automatic cleanup scheduler
   */
  startCleanupScheduler() {
    console.log('🕐 Starting OTP cleanup scheduler (runs every hour)');
    
    setInterval(async () => {
      await this.cleanupExpiredOTPs();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Get OTP statistics for monitoring
   */
  async getOTPStats() {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_otps,
          SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified_otps,
          SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used_otps,
          SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_otps,
          SUM(CASE WHEN attempts >= max_attempts THEN 1 ELSE 0 END) as max_attempts_reached,
          AVG(attempts) as avg_attempts
        FROM otp_verifications
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);
      
      await connection.end();
      
      return { success: true, stats: stats[0] };
      
    } catch (error) {
      console.error('❌ Error getting OTP stats:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const otpManager = new OTPManager();
export default otpManager;

// Export individual functions for convenience
export const {
  generateOTP,
  createOTP,
  verifyOTP,
  resetOTPVerification,
  isOTPVerified,
  canRequestOTP,
  cleanupExpiredOTPs,
  getOTPStats
} = otpManager;
