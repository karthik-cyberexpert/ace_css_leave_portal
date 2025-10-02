import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import cron from 'node-cron';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { jwtSecret, dbConfig } from './config/database.js';
import { sendLoginNotification } from './utils/loginEmailService.js';
import { testEmailConnection, sendTestEmail } from './utils/emailService.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.production file for production
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const app = express();

// =====================================================================================
// PRODUCTION SECURITY MIDDLEWARE
// =====================================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://www.gravatar.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", `${process.env.ACCESS_PROTOCOL || 'http'}://${process.env.PUBLIC_IP || 'localhost'}:${process.env.BACKEND_PORT || process.env.PORT || 3009}`],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Dynamic CORS configuration for production
function buildCorsOrigins() {
  const publicIp = process.env.PUBLIC_IP || process.env.DOMAIN || process.env.SERVER_IP || 'localhost';
  const protocol = process.env.ACCESS_PROTOCOL || 'http';
  const frontendPort = process.env.FRONTEND_PORT || '8085';
  const backendPort = process.env.BACKEND_PORT || process.env.PORT || '3009';
  const redirectPort = process.env.REDIRECT_PORT || '80';
  
  const origins = [
    `${protocol}://${publicIp}:${frontendPort}`,
    `${protocol}://${publicIp}:${backendPort}`,
    `${protocol}://${publicIp}`,
    // Also allow without port for standard ports
    ...(redirectPort === '80' && protocol === 'http' || redirectPort === '443' && protocol === 'https' 
      ? [`${protocol}://${publicIp}`] : []),
    // Development origins for local testing
    'http://localhost:8085',
    'http://localhost:3009',
    'http://127.0.0.1:8085',
    'http://127.0.0.1:3009'
  ];
  
  // If CORS_ORIGIN is explicitly set, use it as additional origins
  if (process.env.CORS_ORIGIN) {
    origins.push(...process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()));
  }
  
  // Remove duplicates
  return [...new Set(origins)];
}

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = buildCorsOrigins();
    
    // Allow requests with no origin (mobile apps, curl requests, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      console.log(`CORS: Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// =====================================================================================
// DATABASE CONFIGURATION
// =====================================================================================

console.log('🗄️ Initializing database connection pool with config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  connectionLimit: dbConfig.connectionLimit
});

const pool = mysql.createPool(dbConfig);

// Database query helper
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// =====================================================================================
// LOGGING SETUP
// =====================================================================================

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logging function
function log(level, message, extra = {}) {
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    level,
    message,
    ...extra
  };
  
  console.log(JSON.stringify(logMessage));
  
  // Write to log file
  const logFile = path.join(logsDir, 'app.log');
  fs.appendFileSync(logFile, JSON.stringify(logMessage) + '\n');
}

// =====================================================================================
// FILE UPLOAD CONFIGURATION
// =====================================================================================

// Create upload directories
const uploadsDir = path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');
const certificatesDir = path.join(uploadsDir, 'certificates');

[uploadsDir, profilePhotosDir, certificatesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.fieldname === 'certificate' ? certificatesDir : profilePhotosDir;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) and PDF files are allowed!'));
    }
  }
});

// =====================================================================================
// MIDDLEWARE
// =====================================================================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      log('warn', 'Invalid token attempt', { token: token.substring(0, 10) + '...', ip: req.ip });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Check if session exists in database
    try {
      const sessions = await query(
        'SELECT * FROM user_sessions WHERE user_id = ? AND expires_at > NOW()',
        [user.id]
      );
      
      if (sessions.length === 0) {
        return res.status(403).json({ error: 'Session expired' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      log('error', 'Session validation error', { error: error.message });
      return res.status(500).json({ error: 'Authentication error' });
    }
  });
};

// =====================================================================================
// HEALTH CHECK ENDPOINT
// =====================================================================================

app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await query('SELECT 1');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      memory: process.memoryUsage(),
      version: '2.1.0'
    };
    
    res.json(health);
  } catch (error) {
    log('error', 'Health check failed', { error: error.message });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// =====================================================================================
// AUTHENTICATION ROUTES
// =====================================================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    // Check if user exists (search by email or username)
    const users = await query(`
      SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_admin, u.is_tutor,
             s.name as student_name, s.register_number, s.batch, s.semester,
             st.name as staff_name, st.username as staff_username
      FROM users u
      LEFT JOIN students s ON u.id = s.id
      LEFT JOIN staff st ON u.id = st.id
      WHERE u.email = ? OR s.username = ? OR st.username = ?
    `, [identifier, identifier, identifier]);

    if (users.length === 0) {
      log('warn', 'Login attempt with invalid credentials', { identifier, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      log('warn', 'Login attempt with wrong password', { identifier, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear any existing sessions for this user
    await query('DELETE FROM user_sessions WHERE user_id = ?', [user.id]);

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      isTutor: user.is_tutor
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
      expiresIn: '24h',
      issuer: 'ace-css-leave-portal',
      audience: 'leave-portal-users'
    });

    // Save session to database
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await query(`
      INSERT INTO user_sessions (id, user_id, token_hash, device_info, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sessionId, user.id, tokenHash, req.get('User-Agent'), req.ip, expiresAt]);

    // Prepare user response
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin,
      isTutor: user.is_tutor,
      name: user.student_name || user.staff_name,
      registerNumber: user.register_number,
      username: user.staff_username,
      batch: user.batch,
      semester: user.semester
    };

    log('info', 'User login successful', { userId: user.id, ip: req.ip });

    res.json({
      token,
      user: userResponse,
      message: 'Login successful'
    });

  } catch (error) {
    log('error', 'Login error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Clear user session
    await query('DELETE FROM user_sessions WHERE user_id = ?', [req.user.id]);
    
    log('info', 'User logout successful', { userId: req.user.id });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    log('error', 'Logout error', { error: error.message });
    res.status(500).json({ error: 'Logout failed' });
  }
});

// =====================================================================================
// EXCEPTION DAYS API ENDPOINTS
// =====================================================================================

// Get all exception days (Admin only)
app.get('/api/exception-days', authenticateToken, express.json(), async (req, res) => {
  try {
    // Only admins can manage exception days
    const [user] = await query('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const exceptionDays = await query(
      'SELECT * FROM exception_days ORDER BY date DESC'
    );
    
    res.json(exceptionDays);
  } catch (error) {
    console.error('Error fetching exception days:', error);
    res.status(500).json({ error: 'Failed to fetch exception days' });
  }
});

// Get exception days for students/tutors (public read access)
app.get('/api/exception-days/public', authenticateToken, async (req, res) => {
  try {
    // All authenticated users can view exception days to avoid applying leave on blocked dates
    const exceptionDays = await query(
      'SELECT date, reason FROM exception_days WHERE date >= CURDATE() ORDER BY date ASC'
    );
    
    res.json(exceptionDays);
  } catch (error) {
    console.error('Error fetching public exception days:', error);
    res.status(500).json({ error: 'Failed to fetch exception days' });
  }
});

// Create new exception day
app.post('/api/exception-days', authenticateToken, express.json(), async (req, res) => {
  try {
    // Only admins can manage exception days
    const [user] = await query('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { date, reason, description } = req.body;
    
    if (!date || !reason) {
      return res.status(400).json({ error: 'Date and reason are required' });
    }

    // Check if date already exists
    const [existingDay] = await query(
      'SELECT id FROM exception_days WHERE date = ?',
      [date]
    );
    
    if (existingDay) {
      return res.status(400).json({ error: 'Exception day already exists for this date' });
    }

    const id = uuidv4();
    await query(
      'INSERT INTO exception_days (id, date, reason, description) VALUES (?, ?, ?, ?)',
      [id, date, reason, description || null]
    );
    
    // Return the created exception day
    const [newExceptionDay] = await query(
      'SELECT * FROM exception_days WHERE id = ?',
      [id]
    );
    
    res.status(201).json(newExceptionDay);
  } catch (error) {
    console.error('Error creating exception day:', error);
    res.status(500).json({ error: 'Failed to create exception day' });
  }
});

// Update exception day
app.put('/api/exception-days/:id', authenticateToken, express.json(), async (req, res) => {
  try {
    // Only admins can manage exception days
    const [user] = await query('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { date, reason, description } = req.body;
    
    if (!date || !reason) {
      return res.status(400).json({ error: 'Date and reason are required' });
    }

    // Check if exception day exists
    const [existingDay] = await query(
      'SELECT id FROM exception_days WHERE id = ?',
      [id]
    );
    
    if (!existingDay) {
      return res.status(404).json({ error: 'Exception day not found' });
    }

    // Check if new date conflicts with other exception days (excluding current one)
    const [conflictingDay] = await query(
      'SELECT id FROM exception_days WHERE date = ? AND id != ?',
      [date, id]
    );
    
    if (conflictingDay) {
      return res.status(400).json({ error: 'Another exception day already exists for this date' });
    }

    await query(
      'UPDATE exception_days SET date = ?, reason = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [date, reason, description || null, id]
    );
    
    // Return the updated exception day
    const [updatedExceptionDay] = await query(
      'SELECT * FROM exception_days WHERE id = ?',
      [id]
    );
    
    res.json(updatedExceptionDay);
  } catch (error) {
    console.error('Error updating exception day:', error);
    res.status(500).json({ error: 'Failed to update exception day' });
  }
});

// Delete exception day
app.delete('/api/exception-days/:id', authenticateToken, async (req, res) => {
  try {
    // Only admins can manage exception days
    const [user] = await query('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    // Check if exception day exists
    const [existingDay] = await query(
      'SELECT id FROM exception_days WHERE id = ?',
      [id]
    );
    
    if (!existingDay) {
      return res.status(404).json({ error: 'Exception day not found' });
    }

    await query('DELETE FROM exception_days WHERE id = ?', [id]);
    
    res.json({ message: 'Exception day deleted successfully' });
  } catch (error) {
    console.error('Error deleting exception day:', error);
    res.status(500).json({ error: 'Failed to delete exception day' });
  }
});

// =====================================================================================
// ERROR HANDLING
// =====================================================================================

// Global error handler
app.use((error, req, res, next) => {
  log('error', 'Unhandled error', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request too large' });
  }

  if (error.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }

  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message 
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  log('warn', '404 Not Found', { url: req.originalUrl, method: req.method, ip: req.ip });
  res.status(404).json({ error: 'Route not found' });
});

// =====================================================================================
// SESSION CLEANUP CRON JOB
// =====================================================================================

// Clean up expired sessions every hour
cron.schedule('0 * * * *', async () => {
  try {
    const result = await query('DELETE FROM user_sessions WHERE expires_at < NOW()');
    log('info', 'Session cleanup completed', { deletedSessions: result.affectedRows });
  } catch (error) {
    log('error', 'Session cleanup failed', { error: error.message });
  }
});

// =====================================================================================
// SERVER STARTUP
// =====================================================================================

const PORT = process.env.BACKEND_PORT || process.env.PORT || 3009;
const HOST = process.env.HOST || '0.0.0.0';

// Log configuration for debugging
console.log('🔧 Server Configuration:');
console.log(`  Public IP: ${process.env.PUBLIC_IP || 'localhost'}`);
console.log(`  Protocol: ${process.env.ACCESS_PROTOCOL || 'http'}`);
console.log(`  Backend Port: ${PORT}`);
console.log(`  Frontend Port: ${process.env.FRONTEND_PORT || '8085'}`);
console.log(`  CORS Origins: ${buildCorsOrigins().join(', ')}`);
console.log(`  API URL: ${process.env.VITE_API_URL || `${process.env.ACCESS_PROTOCOL || 'http'}://${process.env.PUBLIC_IP || 'localhost'}:${PORT}`}`);
console.log('');

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down gracefully');
  server.close(() => {
    log('info', 'Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('info', 'SIGINT received, shutting down gracefully');
  server.close(() => {
    log('info', 'Server closed');
    process.exit(0);
  });
});

const server = app.listen(PORT, HOST, () => {
  log('info', 'Server started', { 
    port: PORT, 
    host: HOST, 
    environment: process.env.NODE_ENV,
    publicIp: process.env.PUBLIC_IP 
  });
  console.log(`🚀 ACE CSS Leave Portal Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Access via public IP: http://${process.env.PUBLIC_IP}:${PORT}`);
  console.log(`📊 Health check: http://${process.env.PUBLIC_IP}:${PORT}/health`);
});

export default app;
