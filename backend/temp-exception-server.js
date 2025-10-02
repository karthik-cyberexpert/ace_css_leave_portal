import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const app = express();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cyber_security_leave_portal',
  port: parseInt(process.env.DB_PORT) || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('🗄️ Temp server database config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
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

// CORS configuration
const corsOptions = {
  origin: [
    'http://210.212.246.131:8085',
    'http://210.212.246.131:3009',
    'http://210.212.246.131',
    'http://localhost:8085',
    'http://localhost:3009',
    'http://127.0.0.1:8085',
    'http://127.0.0.1:3009'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      console.log('Invalid token:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

// Health check
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'exception-days-temp-server'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      service: 'exception-days-temp-server'
    });
  }
});

// Exception days routes
app.get('/api/exception-days/public', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching exception days for user:', req.user.id);
    
    const exceptionDays = await query(
      'SELECT date, reason FROM exception_days WHERE date >= CURDATE() ORDER BY date ASC'
    );
    
    console.log('Found exception days:', exceptionDays.length);
    res.json(exceptionDays);
  } catch (error) {
    console.error('Error fetching public exception days:', error);
    res.status(500).json({ error: 'Failed to fetch exception days' });
  }
});

// Check if date is exception day
app.get('/api/exception-days/check/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    const [exceptionDay] = await query(
      'SELECT id, reason, description FROM exception_days WHERE date = ?',
      [date]
    );
    
    res.json({
      isExceptionDay: !!exceptionDay,
      exceptionDay: exceptionDay || null
    });
  } catch (error) {
    console.error('Error checking exception day:', error);
    res.status(500).json({ error: 'Failed to check exception day' });
  }
});

// Admin routes (if needed)
app.get('/api/exception-days', authenticateToken, async (req, res) => {
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

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error.message);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

// Start server on a different port
const PORT = 3011;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Temporary Exception Days Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Public access: http://210.212.246.131:${PORT}`);
  console.log('📝 Available routes:');
  console.log('  - GET /api/exception-days/public (for all users)');
  console.log('  - GET /api/exception-days/check/:date (for date checking)');
  console.log('  - GET /api/exception-days (admin only)');
  console.log('  - GET /health (health check)');
});

export default app;
