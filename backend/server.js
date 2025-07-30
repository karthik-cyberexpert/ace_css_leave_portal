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
import { dbConfig, jwtSecret } from './config/database.js';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'profile-photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const port = 3002;

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Utility function to execute queries
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Session management functions
async function createSession(userId, token) {
  const sessionId = uuidv4();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  await query(
    'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [sessionId, userId, tokenHash, expiresAt]
  );
  
  return sessionId;
}

async function invalidateUserSessions(userId) {
  await query(
    'UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND is_active = 1',
    [userId]
  );
}

async function isSessionValid(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const [session] = await query(
    'SELECT * FROM user_sessions WHERE token_hash = ? AND is_active = 1 AND expires_at > NOW()',
    [tokenHash]
  );
  return !!session;
}

async function cleanupExpiredSessions() {
  await query('UPDATE user_sessions SET is_active = 0 WHERE expires_at <= NOW()');
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MySQL Backend API Server is running!', 
    status: 'OK',
    port: port,
    endpoints: {
      testDb: '/test-db',
      login: '/auth/login',
      profile: '/profile',
      students: '/students',
      staff: '/staff',
      leaveRequests: '/leave-requests',
      odRequests: '/od-requests'
    }
  });
});

// Add user registration
app.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const userInsert = await query('INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)', [id, email, passwordHash, firstName, lastName]);
    res.status(201).json({ message: 'User registered successfully!', userId: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Add user login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to login user.' });
  }
});

// JWT middleware for authentication with session validation
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, jwtSecret, async (err, user) => {
    if (err) return res.sendStatus(403);
    
    // Check if the session is still valid
    const sessionValid = await isSessionValid(token);
    if (!sessionValid) {
      return res.status(401).json({ 
        error: 'Session expired or invalid. Please login again.',
        code: 'SESSION_INVALID'
      });
    }
    
    req.user = user;
    req.token = token;
    next();
  });
}

// Get user profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [user] = await query(
      'SELECT id, email, first_name, last_name, profile_photo, is_admin, is_tutor FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get all students
app.get('/students', authenticateToken, async (req, res) => {
  try {
    const students = await query('SELECT * FROM students ORDER BY name');
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get all staff
app.get('/staff', authenticateToken, async (req, res) => {
  try {
    const staff = await query('SELECT * FROM staff ORDER BY name');
    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Upload profile photo
app.post('/upload/profile-photo', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = `/uploads/profile-photos/${req.file.filename}`;
    res.json({ message: 'File uploaded successfully', filePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Create a new student
app.post('/students', authenticateToken, async (req, res) => {
  try {
    const { email, password, name, registerNumber, tutorId, batch, semester, mobile } = req.body;
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert into users table first
    await query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [id, email, passwordHash, name.split(' ')[0], name.split(' ').slice(1).join(' ')]
    );

    // Insert into students table
    await query(
      'INSERT INTO students (id, name, register_number, tutor_id, batch, semester, email, mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, registerNumber, tutorId, batch, semester, email, mobile]
    );

    res.status(201).json({ message: 'Student created successfully', id });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student', details: error.message });
  }
});

// Create a new staff member
app.post('/staff', authenticateToken, async (req, res) => {
  try {
    const { email, password, name, username, isAdmin, isTutor } = req.body;
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert into users table first
    await query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_tutor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, email, passwordHash, name.split(' ')[0], name.split(' ').slice(1).join(' '), isAdmin, isTutor]
    );

    // Insert into staff table
    await query(
      'INSERT INTO staff (id, name, email, username, is_admin, is_tutor) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, username, isAdmin, isTutor]
    );

    res.status(201).json({ message: 'Staff member created successfully', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// Update student
app.put('/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    await query(`UPDATE students SET ${setClause} WHERE id = ?`, values);
    
    const [updatedStudent] = await query('SELECT * FROM students WHERE id = ?', [id]);
    res.json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Update staff
app.put('/staff/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    await query(`UPDATE staff SET ${setClause} WHERE id = ?`, values);
    
    const [updatedStaff] = await query('SELECT * FROM staff WHERE id = ?', [id]);
    res.json(updatedStaff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// Delete student
app.delete('/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM students WHERE id = ?', [id]);
    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Delete staff
app.delete('/staff/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM staff WHERE id = ?', [id]);
    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

// Get leave requests
app.get('/leave-requests', authenticateToken, async (req, res) => {
  try {
    const leaveRequests = await query('SELECT * FROM leave_requests ORDER BY created_at DESC');
    res.json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Create leave request
app.post('/leave-requests', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, totalDays, subject, description } = req.body;
    const id = uuidv4();
    
    // Get student and tutor info
    const [student] = await query('SELECT * FROM students WHERE id = ?', [req.user.id]);
    const [tutor] = await query('SELECT * FROM staff WHERE id = ?', [student.tutor_id]);
    
    await query(
      'INSERT INTO leave_requests (id, student_id, student_name, student_register_number, tutor_id, tutor_name, start_date, end_date, total_days, subject, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, student.name, student.register_number, student.tutor_id, tutor.name, startDate, endDate, totalDays, subject, description]
    );
    
    res.status(201).json({ message: 'Leave request created successfully', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Helper function to calculate days between dates
const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDifference = end.getTime() - start.getTime();
  return Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;
};

// Update leave request status
app.put('/leave-requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason, startDate, endDate, isPartial } = req.body;
    
    // Get the original request to check current status and student info
    const [originalRequest] = await query('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (!originalRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    // Get current student data
    const [student] = await query('SELECT * FROM students WHERE id = ?', [originalRequest.student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    let updateData = {
      status: status,
      cancel_reason: cancelReason || null
    };
    
    let newLeaveTaken = student.leave_taken;
    
    // Handle partial cancellation for approved leave requests
    if (isPartial && originalRequest.status === 'Approved' && status === 'Cancellation Pending') {
      const partialDays = calculateDaysBetween(startDate, endDate);
      
      // Store partial cancellation data
      updateData.partial_cancel_start = startDate;
      updateData.partial_cancel_end = endDate;
      updateData.partial_cancel_days = partialDays;
      
      // Subtract the partially cancelled days from leave taken
      newLeaveTaken = Math.max(0, student.leave_taken - partialDays);
      
      // Update the total days of the request to reflect partial cancellation
      updateData.total_days = originalRequest.total_days - partialDays;
    }
    
    // Handle full approval - add leave days to student's count (only for leave requests, not OD)
    else if (status === 'Approved' && originalRequest.status !== 'Approved') {
      // This handles approval from Pending, Forwarded, or Retried status
      newLeaveTaken = student.leave_taken + originalRequest.total_days;
    }
    
    // Handle full cancellation of approved requests - subtract leave days
    else if (status === 'Cancelled' && originalRequest.status === 'Approved') {
      newLeaveTaken = Math.max(0, student.leave_taken - originalRequest.total_days);
    }
    
    // Handle rejection after approval - subtract leave days
    else if (status === 'Rejected' && originalRequest.status === 'Approved') {
      newLeaveTaken = Math.max(0, student.leave_taken - originalRequest.total_days);
    }
    
    // Handle rejection of retried requests - no leave days to subtract since they weren't approved
    else if (status === 'Rejected' && originalRequest.status === 'Retried') {
      // No change to leave_taken since retried requests weren't previously approved
      newLeaveTaken = student.leave_taken;
    }
    
    // Update the leave request
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    await query(`UPDATE leave_requests SET ${setClause} WHERE id = ?`, values);
    
    // Update student's leave_taken count if it changed
    if (newLeaveTaken !== student.leave_taken) {
      await query('UPDATE students SET leave_taken = ? WHERE id = ?', [newLeaveTaken, originalRequest.student_id]);
    }
    
    const [updatedRequest] = await query('SELECT * FROM leave_requests WHERE id = ?', [id]);
    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update leave request status' });
  }
});

// Get OD requests
app.get('/od-requests', authenticateToken, async (req, res) => {
  try {
    const odRequests = await query('SELECT * FROM od_requests ORDER BY created_at DESC');
    res.json(odRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch OD requests' });
  }
});

// Create OD request
app.post('/od-requests', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, totalDays, purpose, destination, description } = req.body;
    const id = uuidv4();
    
    // Get student and tutor info
    const [student] = await query('SELECT * FROM students WHERE id = ?', [req.user.id]);
    const [tutor] = await query('SELECT * FROM staff WHERE id = ?', [student.tutor_id]);
    
    await query(
      'INSERT INTO od_requests (id, student_id, student_name, student_register_number, tutor_id, tutor_name, start_date, end_date, total_days, purpose, destination, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, student.name, student.register_number, student.tutor_id, tutor.name, startDate, endDate, totalDays, purpose, destination, description]
    );
    
    res.status(201).json({ message: 'OD request created successfully', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create OD request' });
  }
});

// Update OD request status
app.put('/od-requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;
    
    // Set upload deadline when approved (including from retried status)
    let updateQuery = 'UPDATE od_requests SET status = ?, cancel_reason = ?';
    let params = [status, cancelReason || null];
    
    if (status === 'Approved') {
      const uploadDeadline = new Date();
      uploadDeadline.setDate(uploadDeadline.getDate() + 7);
      updateQuery += ', certificate_status = ?, upload_deadline = ?';
      params.push('Pending Upload', uploadDeadline);
    }
    
    // Reset details for Retried requests
    if (status === 'Retried') {
      updateQuery += ', certificate_status = NULL, upload_deadline = NULL';
    }
    
    // Handle rejection of retried requests - ensure clean status
    if (status === 'Rejected') {
      updateQuery += ', certificate_status = NULL, upload_deadline = NULL';
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(id);
    
    await query(updateQuery, params);
    
    const [updatedRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [id]);
    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update OD request status' });
  }
});

// Upload OD certificate
app.put('/od-requests/:id/certificate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { certificateUrl } = req.body;
    
    await query(
      'UPDATE od_requests SET certificate_url = ?, certificate_status = ? WHERE id = ?',
      [certificateUrl, 'Pending Verification', id]
    );
    
    const [updatedRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [id]);
    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload certificate' });
  }
});

// Verify OD certificate
app.put('/od-requests/:id/certificate/verify', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    const certificateStatus = isApproved ? 'Approved' : 'Rejected';
    
    await query(
      'UPDATE od_requests SET certificate_status = ? WHERE id = ?',
      [certificateStatus, id]
    );
    
    const [updatedRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [id]);
    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// Handle overdue certificates
app.put('/od-requests/handle-overdue-certificates', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `UPDATE od_requests 
       SET certificate_status = 'Overdue' 
       WHERE status = 'Approved' 
       AND certificate_status = 'Pending Upload' 
       AND upload_deadline < NOW()`
    );
    
    res.json({ 
      message: 'Overdue certificates processed successfully',
      overdueCount: result.affectedRows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to handle overdue certificates' });
  }
});

// OD Certificate Management Functions
async function processODCertificateReminders() {
  try {
    // Get current date for comparisons
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0];
    
    // 1. Find OD requests that need automatic rejection (end_date + 3 days has passed)
    const autoRejectCandidates = await query(
      `SELECT * FROM od_requests 
       WHERE status = 'Approved' 
       AND certificate_status = 'Pending Upload' 
       AND DATE_ADD(end_date, INTERVAL 3 DAY) < CURDATE()`
    );
    
    // Auto-reject overdue requests
    if (autoRejectCandidates.length > 0) {
      await query(
        `UPDATE od_requests 
         SET status = 'Rejected', 
             certificate_status = 'Rejected', 
             cancel_reason = 'Certificate not submitted within 3 days after OD completion' 
         WHERE status = 'Approved' 
         AND certificate_status = 'Pending Upload' 
         AND DATE_ADD(end_date, INTERVAL 3 DAY) < CURDATE()`
      );
    }
    
    // 2. Find OD requests that need daily reminders (within the 3-day window)
    const reminderCandidates = await query(
      `SELECT * FROM od_requests 
       WHERE status = 'Approved' 
       AND certificate_status = 'Pending Upload' 
       AND end_date < CURDATE() 
       AND DATE_ADD(end_date, INTERVAL 3 DAY) >= CURDATE() 
       AND (last_notification_date IS NULL OR last_notification_date < CURDATE())`
    );
    
    // Send reminders and update notification date
    for (const request of reminderCandidates) {
      // Update last notification date
      await query(
        'UPDATE od_requests SET last_notification_date = CURDATE() WHERE id = ?',
        [request.id]
      );
      
      // In a production system, send email/push notification here
    }
    
    return {
      autoRejected: autoRejectCandidates.length,
      remindersSent: reminderCandidates.length
    };
    
  } catch (error) {
    console.error('Error in OD certificate reminder job:', error);
    throw error;
  }
}

// Get OD certificate reminders for logged-in user
app.get('/notifications/od-certificate-reminders', authenticateToken, async (req, res) => {
  try {
    const reminders = await query(
      `SELECT * FROM od_requests 
       WHERE student_id = ? 
       AND status = 'Approved' 
       AND certificate_status = 'Pending Upload' 
       AND end_date < CURDATE() 
       AND DATE_ADD(end_date, INTERVAL 3 DAY) >= CURDATE()`,
      [req.user.id]
    );
    
    const reminderData = reminders.map(request => {
      const endDate = new Date(request.end_date);
      const deadline = new Date(endDate);
      deadline.setDate(deadline.getDate() + 3);
      
      const currentDate = new Date();
      const daysLeft = Math.ceil((deadline - currentDate) / (1000 * 60 * 60 * 24));
      
      return {
        id: request.id,
        purpose: request.purpose,
        destination: request.destination,
        endDate: request.end_date,
        deadline: deadline.toISOString().split('T')[0],
        daysLeft: Math.max(0, daysLeft),
        isUrgent: daysLeft <= 1
      };
    });
    
    res.json({
      reminders: reminderData,
      count: reminderData.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch certificate reminders' });
  }
});

// Manual trigger for OD certificate processing (Admin only)
app.post('/admin/process-od-certificates', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const [user] = await query(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    const result = await processODCertificateReminders();
    
    res.json({
      message: 'OD certificate processing completed',
      autoRejected: result.autoRejected,
      remindersSent: result.remindersSent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process OD certificates' });
  }
});


// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const [result] = await query('SELECT COUNT(*) as count FROM users');
    res.json({ success: true, userCount: result.count, message: 'Database connection successful' });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email by username (RPC function replacement)
app.get('/users/email-by-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check in staff table for username
    const [staffMember] = await query('SELECT email FROM staff WHERE username = ?', [username]);
    if (staffMember) {
      return res.json({ email: staffMember.email });
    }
    
    // Check in students table for username
    const [student] = await query('SELECT * FROM students WHERE username = ?', [username]);
    if (student) {
      const email = `${username}@college.portal`; // Default email format
      return res.json({ email });
    }
    
    res.status(404).json({ error: 'Username not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to lookup username' });
  }
});

// Login with username or email
app.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    let user;
    
    // Check if identifier is email or username
    if (identifier.includes('@')) {
      [user] = await query('SELECT * FROM users WHERE email = ?', [identifier]);
    } else {
      // Check in staff table for username (staff still have usernames)
      const [staffMember] = await query('SELECT * FROM staff WHERE username = ?', [identifier]);
      if (staffMember) {
        [user] = await query('SELECT * FROM users WHERE id = ?', [staffMember.id]);
      }
      // Students no longer have usernames, they must login with email
    }
    
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: { message: 'Invalid username or password' } });
    }
    
    // Invalidate all existing sessions for this user (single session enforcement)
    await invalidateUserSessions(user.id);
    
    // Clean up expired sessions
    await cleanupExpiredSessions();
    
    // Create new token and session
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '24h' });
    await createSession(user.id, token);
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email },
      message: 'Login successful. Any previous sessions have been terminated.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { message: 'Failed to login' } });
  }
});

// Logout endpoint
app.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.token).digest('hex');
    
    // Invalidate the current session
    await query(
      'UPDATE user_sessions SET is_active = 0 WHERE token_hash = ?',
      [tokenHash]
    );
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});




// Setup daily cron job for OD certificate reminders
// Runs every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  try {
    await processODCertificateReminders();
  } catch (error) {
    console.error('Error in daily OD certificate reminder cron job:', error);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

