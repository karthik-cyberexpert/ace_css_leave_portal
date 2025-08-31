import jwt from 'jsonwebtoken';
import otpManager from '../utils/otpUtils.js';
import { jwtSecret } from '../config/database.js';

/**
 * =====================================================================================
 * ACE CSS LEAVE PORTAL - OTP AUTHENTICATION MIDDLEWARE
 * =====================================================================================
 * Version: 2.2.0
 * Purpose: Middleware to ensure routes require OTP verification
 * Features: JWT validation + OTP verification check
 * =====================================================================================
 */

/**
 * Middleware to verify JWT token and OTP verification status
 */
export const requireOTPVerification = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      
      // Check if user's OTP is verified
      const isOTPVerified = await otpManager.isOTPVerified(decoded.id);
      
      if (!isOTPVerified) {
        return res.status(403).json({
          error: 'OTP verification required. Please complete OTP verification to access this resource.',
          code: 'OTP_VERIFICATION_REQUIRED',
          requiresOTP: true
        });
      }
      
      // User is authenticated and OTP verified
      next();
      
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }
    
  } catch (error) {
    console.error('❌ OTP Auth Middleware Error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to verify JWT token only (for OTP-related endpoints)
 */
export const requireJWTOnly = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    try {
      // Verify JWT token only
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      
      // Continue without OTP verification check
      next();
      
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }
    
  } catch (error) {
    console.error('❌ JWT Auth Middleware Error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Utility function to check if request needs OTP verification
 */
export const checkOTPRequirement = async (userId) => {
  try {
    const isVerified = await otpManager.isOTPVerified(userId);
    return {
      isVerified,
      requiresOTP: !isVerified
    };
  } catch (error) {
    console.error('❌ Error checking OTP requirement:', error);
    return {
      isVerified: false,
      requiresOTP: true,
      error: error.message
    };
  }
};

export default {
  requireOTPVerification,
  requireJWTOnly,
  checkOTPRequirement
};
