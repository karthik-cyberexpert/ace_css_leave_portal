/**
 * Security middleware configuration for ACE CS Leave Portal
 * 
 * This module provides comprehensive security middleware setup including:
 * - Helmet for security headers
 * - CORS configuration
 * - Rate limiting (general + auth-specific)
 * - Compression
 * - Request sanitization
 * - Security logging
 * 
 * Usage in server.js:
 * const { applySecurityMiddleware } = require('./config/security');
 * applySecurityMiddleware(app);
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const crypto = require('crypto');

/**
 * Configure CORS based on environment variables
 */
function configureCORS() {
  const corsOrigins = process.env.CORS_ORIGIN || 'http://localhost:8085,http://localhost:3009';
  const allowedOrigins = corsOrigins.split(',').map(origin => origin.trim());
  
  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400 // 24 hours preflight cache
  });
}

/**
 * Configure Helmet for security headers
 */
function configureHelmet() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: Consider removing unsafe-* in production
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // X-Frame-Options
    frameguard: { action: 'deny' },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // X-XSS-Protection
    xssFilter: true,
    
    // Referrer Policy
    referrerPolicy: { policy: "same-origin" },
    
    // Hide X-Powered-By header
    hidePoweredBy: true,
    
    // Expect-CT header
    expectCt: {
      maxAge: 30,
      enforce: true
    }
  });
}

/**
 * Configure general rate limiting
 */
function configureGeneralRateLimit() {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    }
  });
}

/**
 * Configure stricter rate limiting for authentication endpoints
 */
function configureAuthRateLimit() {
  const windowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 300000; // 5 minutes
  const maxRequests = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10;
  
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}, User-Agent: ${req.get('User-Agent')}`);
      res.status(429).json({
        error: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
}

/**
 * Request sanitization middleware
 */
function sanitizeRequest(req, res, next) {
  // Add request ID for tracing
  req.id = crypto.randomBytes(16).toString('hex');
  
  // Log suspicious patterns
  const suspicious = [
    /script/i, /javascript/i, /vbscript/i, /onload/i, /onerror/i,
    /select.*from/i, /union.*select/i, /drop.*table/i, /insert.*into/i,
    /\.\.\//, /etc\/passwd/, /proc\/self/, /dev\/null/
  ];
  
  const checkSuspicious = (obj, path = '') => {
    if (typeof obj === 'string') {
      suspicious.forEach(pattern => {
        if (pattern.test(obj)) {
          console.warn(`Suspicious content detected in ${path}: ${pattern} from IP: ${req.ip}`);
        }
      });
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        checkSuspicious(obj[key], `${path}.${key}`);
      });
    }
  };
  
  if (req.body) checkSuspicious(req.body, 'body');
  if (req.query) checkSuspicious(req.query, 'query');
  if (req.params) checkSuspicious(req.params, 'params');
  
  next();
}

/**
 * Security logging middleware
 */
function securityLogger(req, res, next) {
  // Log important security events
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log failed authentication attempts
    if (req.path.includes('/auth/') && res.statusCode === 401) {
      console.warn(`Failed auth attempt - IP: ${req.ip}, Path: ${req.path}, User-Agent: ${req.get('User-Agent')}, Duration: ${duration}ms`);
    }
    
    // Log successful logins
    if (req.path === '/api/auth/login' && res.statusCode === 200) {
      console.info(`Successful login - IP: ${req.ip}, Duration: ${duration}ms`);
    }
    
    // Log admin access
    if (req.path.includes('/admin/') && res.statusCode < 400) {
      console.info(`Admin access - IP: ${req.ip}, Path: ${req.path}, Status: ${res.statusCode}, Duration: ${duration}ms`);
    }
    
    // Log file uploads
    if (req.method === 'POST' && req.path.includes('/upload')) {
      console.info(`File upload - IP: ${req.ip}, Path: ${req.path}, Status: ${res.statusCode}, Duration: ${duration}ms`);
    }
  });
  
  next();
}

/**
 * Configure compression
 */
function configureCompression() {
  return compression({
    // Only compress responses larger than 1KB
    threshold: 1024,
    // Compression level (1 = fastest, 9 = best compression)
    level: 6,
    // Compress these MIME types
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  });
}

/**
 * Apply all security middleware to the Express app
 * 
 * @param {Express} app - Express application instance
 */
function applySecurityMiddleware(app) {
  console.info('Applying security middleware...');
  
  // Trust proxy if behind reverse proxy
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }
  
  // Apply middleware in order of importance
  app.use(securityLogger);
  app.use(configureHelmet());
  app.use(configureCORS());
  app.use(configureCompression());
  app.use(sanitizeRequest);
  
  // General rate limiting for all requests
  app.use(configureGeneralRateLimit());
  
  // Stricter rate limiting for auth endpoints
  app.use('/api/auth', configureAuthRateLimit());
  
  console.info('Security middleware applied successfully');
}

/**
 * Get auth rate limiter for manual application to specific routes
 */
function getAuthRateLimit() {
  return configureAuthRateLimit();
}

module.exports = {
  applySecurityMiddleware,
  getAuthRateLimit,
  configureCORS,
  configureHelmet,
  configureGeneralRateLimit,
  configureAuthRateLimit,
  sanitizeRequest,
  securityLogger
};
