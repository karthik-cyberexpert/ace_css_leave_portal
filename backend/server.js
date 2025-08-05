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

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads', 'profile-photos');
const certificatesDir = path.join(__dirname, 'uploads', 'certificates');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

// Import Sharp for image processing (ES module)
import sharp from 'sharp';

// Configure multer for profile photo uploads
const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// Utility function to convert images to JPG and save as profile.jpg
async function processAndSaveProfileImage(tempFilePath, userProfileDir) {
  const finalFilePath = path.join(userProfileDir, 'profile.jpg');
  await sharp(tempFilePath)
    .jpeg({ quality: 90 })
    .toFile(finalFilePath);
  fs.unlinkSync(tempFilePath); // Remove the temp file
  return finalFilePath;
}

// Simple certificate storage - we'll handle directory creation in the route
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a temporary directory, we'll move the file later
    cb(null, certificatesDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, fileExtension);
    cb(null, `certificate-${timestamp}-${originalName}${fileExtension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept image files and PDFs for certificates
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed!'), false);
  }
};

// Create separate multer instances for different upload types
const profileUpload = multer({ 
  storage: profilePhotoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const certificateUpload = multer({ 
  storage: certificateStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for certificates
  }
});

const app = express();
// Configure CORS to allow file uploads
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// IMPORTANT: Don't use express.json() globally as it can interfere with file uploads
// We'll add it selectively to non-file-upload routes

// Gravatar utility functions
function getGravatarUrl(email, size = 200) {
  if (!email) return null;
  
  // Convert email to lowercase and trim whitespace
  const normalizedEmail = email.toLowerCase().trim();
  
  // Create MD5 hash of the email
  const hash = crypto.createHash('md5').update(normalizedEmail).digest('hex');
  
  // Build Gravatar URL with identicon as default
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=g`;
}

function getBestProfilePicture(customImageUrl, email, size = 200) {
  // First priority: custom uploaded image
  if (customImageUrl) {
    return customImageUrl;
  }
  
  // Second priority: Gravatar
  if (email) {
    return getGravatarUrl(email, size);
  }
  
  // No profile picture available
  return null;
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Certificate preview endpoint (for inline viewing)
app.get('/api/certificate/:requestId/preview', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Verify the OD request exists and the user has permission to view it
    const [odRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [requestId]);
    if (!odRequest) {
      return res.status(404).json({ error: 'OD request not found' });
    }
    
    // Get user info to check permissions
    const [user] = await query('SELECT is_admin, is_tutor FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has permission to view this certificate
    const canView = user.is_admin || 
                   user.is_tutor || 
                   odRequest.student_id === req.user.id;
                   
    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if certificate exists
    if (!odRequest.certificate_url) {
      return res.status(404).json({ error: 'No certificate uploaded for this request' });
    }
    
    // Extract the path from the certificate URL stored in database
    const relativePath = odRequest.certificate_url.replace('/uploads/', '');
    const filePath = path.join(__dirname, 'uploads', relativePath);
    
    console.log(`Looking for certificate at: ${filePath}`);
    console.log(`Request ID: ${requestId}, Student ID: ${odRequest.student_id}`);
    console.log(`Certificate URL from DB: ${odRequest.certificate_url}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Certificate file not found' });
    }
    
    // Get file extension to determine content type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }
    
    // Set headers for inline viewing (preview)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Certificate preview error:', error);
    res.status(500).json({ error: 'Failed to preview certificate' });
  }
});

// Certificate download endpoint (for downloading)
app.get('/api/certificate/:requestId/download', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Verify the OD request exists and the user has permission to view it
    const [odRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [requestId]);
    if (!odRequest) {
      return res.status(404).json({ error: 'OD request not found' });
    }
    
    // Get user info to check permissions
    const [user] = await query('SELECT is_admin, is_tutor FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has permission to view this certificate
    const canView = user.is_admin || 
                   user.is_tutor || 
                   odRequest.student_id === req.user.id;
                   
    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if certificate exists
    if (!odRequest.certificate_url) {
      return res.status(404).json({ error: 'No certificate uploaded for this request' });
    }
    
    // Get student info for filename
    const [student] = await query('SELECT batch, register_number, name FROM students WHERE id = ?', [odRequest.student_id]);
    
    // Extract the path from the certificate URL stored in database
    const relativePath = odRequest.certificate_url.replace('/uploads/', '');
    const filePath = path.join(__dirname, 'uploads', relativePath);
    
    console.log(`Downloading certificate from: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Certificate file not found' });
    }
    
    // Get file extension and original filename
    const ext = path.extname(filePath);
    const downloadFilename = `${student.name.replace(/\s+/g, '_')}_${student.register_number}_OD_Certificate${ext}`;
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

// Legacy certificate viewing endpoint (deprecated - kept for backward compatibility)
app.get('/api/certificate/:requestId/:filename', authenticateToken, async (req, res) => {
  try {
    const { requestId, filename } = req.params;
    
    // Verify the OD request exists and the user has permission to view it
    const [odRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [requestId]);
    if (!odRequest) {
      return res.status(404).json({ error: 'OD request not found' });
    }
    
    // Get user info to check permissions
    const [user] = await query('SELECT is_admin, is_tutor FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has permission to view this certificate
    const canView = user.is_admin || 
                   user.is_tutor || 
                   odRequest.student_id === req.user.id;
                   
    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Construct file path using the certificate URL from database
    const [student] = await query('SELECT batch, register_number FROM students WHERE id = ?', [odRequest.student_id]);
    
    // Extract the path from the certificate URL stored in database
    let filePath;
    if (odRequest.certificate_url) {
      // Remove the leading '/uploads' from the URL to get the relative path
      const relativePath = odRequest.certificate_url.replace('/uploads/', '');
      filePath = path.join(__dirname, 'uploads', relativePath);
    } else {
      // Fallback to new structure if no certificate_url
      filePath = path.join(__dirname, 'uploads', student.batch, student.register_number.toString(), 'certificate', filename);
    }
    
    console.log(`Looking for certificate at: ${filePath}`);
    console.log(`Request ID: ${requestId}, Student ID: ${odRequest.student_id}, Filename: ${filename}`);
    console.log(`Certificate URL from DB: ${odRequest.certificate_url}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Certificate file not found' });
    }
    
    // Set appropriate headers based on file type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Certificate viewing error:', error);
    res.status(500).json({ error: 'Failed to retrieve certificate' });
  }
});

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

// Add express.json() middleware for non-file-upload routes
// This must come after the file upload routes to avoid interfering with multipart form data
app.use('/api/od-requests/:id/certificate', (req, res, next) => {
  // Skip express.json for file upload endpoints
  if (req.method === 'POST') {
    return next();
  }
  express.json()(req, res, next);
});

// Apply express.json to all other routes
app.use(express.json());

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
    
    // Add the best profile picture URL (custom or Gravatar)
    user.profile_photo = getBestProfilePicture(user.profile_photo, user.email);
    
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
    
    // Add Gravatar profile pictures and calculate dynamic leave_taken for students
    const studentsWithUpdatedData = await Promise.all(students.map(async (student) => {
      const dynamicLeaveTaken = await calculateLeaveTaken(student.id);
      return {
        ...student,
        leave_taken: dynamicLeaveTaken, // Override with dynamic calculation
        profile_photo: getBestProfilePicture(student.profile_photo, student.email)
      };
    }));
    
    res.json(studentsWithUpdatedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get specific student by ID
app.get('/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [student] = await query('SELECT * FROM students WHERE id = ?', [id]);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Calculate dynamic leave_taken and add profile picture
    const dynamicLeaveTaken = await calculateLeaveTaken(student.id);
    const studentWithUpdatedData = {
      ...student,
      leave_taken: dynamicLeaveTaken, // Override with dynamic calculation
      profile_photo: getBestProfilePicture(student.profile_photo, student.email)
    };
    
    res.json(studentWithUpdatedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Get all staff
app.get('/staff', authenticateToken, async (req, res) => {
  try {
    const staff = await query('SELECT * FROM staff ORDER BY name');
    
    // Add Gravatar profile pictures for staff without custom photos
    const staffWithProfilePictures = staff.map(staffMember => ({
      ...staffMember,
      profile_photo: getBestProfilePicture(staffMember.profile_photo, staffMember.email)
    }));
    
    res.json(staffWithProfilePictures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Upload profile photo
app.post('/upload/profile-photo', authenticateToken, profileUpload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    
    // First, check what type of user this is
    const [user] = await query('SELECT is_admin, is_tutor FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userProfileDir;
    let profilePhotoUrl;
    
    if (user.is_admin || user.is_tutor) {
      // For staff members (tutors/admins)
      const [staff] = await query('SELECT name FROM staff WHERE id = ?', [userId]);
      if (!staff) {
        return res.status(404).json({ error: 'Staff record not found' });
      }
      
      if (user.is_admin) {
        // For admins, use simple structure: uploads/Admin/profile.png
        userProfileDir = path.join(__dirname, 'uploads', 'Admin');
        profilePhotoUrl = `/uploads/Admin/profile.png`;
      } else {
        // For tutors, use simplified structure: uploads/{tutor_name}/profile.png
        const sanitizedName = staff.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
        userProfileDir = path.join(__dirname, 'uploads', sanitizedName);
        profilePhotoUrl = `/uploads/${sanitizedName}/profile.png`;
      }
    } else {
      // For students, use batch/rollnumber structure
      const [student] = await query('SELECT batch, register_number FROM students WHERE id = ?', [userId]);
      if (!student) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      
      // Create directory structure: uploads/{batch}/{rollnumber}/profile/
      userProfileDir = path.join(__dirname, 'uploads', student.batch, student.register_number.toString(), 'profile');
      profilePhotoUrl = `/uploads/${student.batch}/${student.register_number}/profile/profile.png`;
    }
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(userProfileDir)) {
      fs.mkdirSync(userProfileDir, { recursive: true });
    }

    // Check if old profile photo exists and delete it
    const finalFilePath = path.join(userProfileDir, 'profile.png');
    if (fs.existsSync(finalFilePath)) {
      try {
        fs.unlinkSync(finalFilePath);
        console.log(`Deleted old profile photo: ${finalFilePath}`);
      } catch (deleteError) {
        console.warn('Failed to delete old profile photo:', deleteError);
      }
    }

    // Process and save the new image as profile.png
    const tempFilePath = req.file.path;
    await sharp(tempFilePath)
      .png({ quality: 90 }) // Convert to PNG format
      .toFile(finalFilePath);
    
    // Remove the temporary file
    fs.unlinkSync(tempFilePath);

    // Update the user's profile photo in the database
    try {
      // Update the users table with the new profile photo
      await query('UPDATE users SET profile_photo = ? WHERE id = ?', [profilePhotoUrl, userId]);

      // Also update the appropriate table (students or staff)
      if (user.is_admin || user.is_tutor) {
        // Update staff table
        await query('UPDATE staff SET profile_photo = ? WHERE id = ?', [profilePhotoUrl, userId]);
      } else {
        // Update students table
        await query('UPDATE students SET profile_photo = ? WHERE id = ?', [profilePhotoUrl, userId]);
      }

      console.log(`Profile photo updated for user ${userId}: ${profilePhotoUrl}`);

    } catch (dbError) {
      console.error('Database update error:', dbError);
      // If database update fails, we should delete the uploaded file
      try {
        fs.unlinkSync(finalFilePath);
      } catch (deleteError) {
        console.error('Failed to delete uploaded file after database error:', deleteError);
      }
      return res.status(500).json({ error: 'Failed to update profile photo in database' });
    }

    res.json({ 
      message: 'Profile photo uploaded and updated successfully', 
      filePath: profilePhotoUrl 
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Remove profile photo
app.delete('/upload/profile-photo', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current profile photo path and user type
    const [user] = await query('SELECT profile_photo, is_admin, is_tutor FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentPhotoPath = user.profile_photo;
    
    // Update database to remove profile photo
    try {
      // Update the users table to remove profile photo
      await query('UPDATE users SET profile_photo = NULL WHERE id = ?', [userId]);
      
      // Also update the appropriate table (students or staff)
      if (user.is_admin || user.is_tutor) {
        // Update staff table
        await query('UPDATE staff SET profile_photo = NULL WHERE id = ?', [userId]);
      } else {
        // Update students table
        await query('UPDATE students SET profile_photo = NULL WHERE id = ?', [userId]);
      }
      
      console.log(`Profile photo removed for user ${userId}`);
      
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return res.status(500).json({ error: 'Failed to remove profile photo from database' });
    }
    
    // Delete the physical file if it exists
    if (currentPhotoPath && currentPhotoPath.startsWith('/uploads/')) {
      try {
        // Construct the full file path from the URL
        const relativePath = currentPhotoPath.replace('/uploads/', '');
        const fullPath = path.join(__dirname, 'uploads', relativePath);
        
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted profile photo file: ${fullPath}`);
          
          // Try to remove the parent directory if it's empty (but not for admin)
          if (!currentPhotoPath.includes('/Admin/')) {
            try {
              const parentDir = path.dirname(fullPath);
              const files = fs.readdirSync(parentDir);
              if (files.length === 0) {
                fs.rmdirSync(parentDir);
                console.log(`Removed empty directory: ${parentDir}`);
                
                // Try to remove the student's main directory if it's empty too
                const studentDir = path.dirname(parentDir);
                const studentFiles = fs.readdirSync(studentDir);
                if (studentFiles.length === 0) {
                  fs.rmdirSync(studentDir);
                  console.log(`Removed empty student directory: ${studentDir}`);
                }
              }
            } catch (dirError) {
              console.warn('Could not remove empty directories:', dirError);
            }
          }
        }
      } catch (fileError) {
        console.warn('Failed to delete profile photo file:', fileError);
        // Don't fail the request if file deletion fails
      }
    }
    
    res.json({ 
      message: 'Profile photo removed successfully'
    });
    
  } catch (error) {
    console.error('Remove profile photo error:', error);
    res.status(500).json({ error: 'Failed to remove profile photo' });
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
    const username = email.split('@')[0]; // Generate username from email
    try {
      await query(
        'INSERT INTO students (id, name, register_number, tutor_id, batch, semester, email, mobile, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, registerNumber, tutorId, batch, semester, email, mobile, username]
      );
    } catch (error) {
      // If username column doesn't exist, try without it
      if (error.message.includes('Unknown column') && error.message.includes('username')) {
        await query(
          'INSERT INTO students (id, name, register_number, tutor_id, batch, semester, email, mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, name, registerNumber, tutorId, batch, semester, email, mobile]
        );
      } else {
        throw error;
      }
    }

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

// Create a new batch
app.post('/batches', authenticateToken, async (req, res) => {
  try {
    const { startYear } = req.body;
    const id = startYear.toString();
    const endYear = startYear + 4;
    const name = `${startYear}-${endYear}`;

    await query(
      'INSERT INTO batches (id, start_year, end_year, name, is_active) VALUES (?, ?, ?, ?, ?)',
      [id, startYear, endYear, name, true]
    );

    res.status(201).json({ message: 'Batch created successfully', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create batch', details: error.message });
  }
});

// Update a batch
app.put('/batches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    await query(`UPDATE batches SET ${setClause} WHERE id = ?`, values);
    
    const [updatedBatch] = await query('SELECT * FROM batches WHERE id = ?', [id]);
    res.json(updatedBatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update batch', details: error.message });
  }
});

// Delete a batch
app.delete('/batches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM batches WHERE id = ?', [id]);
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete batch', details: error.message });
  }
});

// Get all batches
app.get('/batches', authenticateToken, async (req, res) => {
  try {
    const batches = await query('SELECT * FROM batches ORDER BY start_year');
    res.json(batches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve batches', details: error.message });
  }
});

// Update student profile (direct update)
app.put('/students/sync-batch-status/:batchId', authenticateToken, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { isActive } = req.body;

    // Update all students in this batch to have the correct active status
    const [result] = await query(
      'UPDATE students SET is_active = ? WHERE batch = ?',
      [isActive, batchId]
    );

    if (result.affectedRows > 0) {
      res.json({ message: `${result.affectedRows} students updated`, updatedCount: result.affectedRows });
    } else {
      res.status(404).json({ error: 'No students found for this batch' });
    }
  } catch (error) {
    console.error('Failed to update students status:', error);
    res.status(500).json({ error: 'Failed to update students status' });
  }
});

app.put('/students/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, mobile, password } = req.body;
    
    // Update students table
    const studentUpdates = {};
    if (email) studentUpdates.email = email;
    if (mobile) studentUpdates.mobile = mobile;
    
    if (Object.keys(studentUpdates).length > 0) {
      const setClause = Object.keys(studentUpdates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(studentUpdates);
      values.push(id);
      await query(`UPDATE students SET ${setClause} WHERE id = ?`, values);
    }
    
    // Update users table for email and password changes
    if (email) {
      await query('UPDATE users SET email = ? WHERE id = ?', [email, id]);
    }
    
    // Update password if provided
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    }
    
    // Send notifications to tutor and admin
    try {
      const [student] = await query('SELECT * FROM students WHERE id = ?', [id]);
      if (student) {
        const [tutor] = await query('SELECT * FROM staff WHERE id = ?', [student.tutor_id]);
        
        // Create notification message
        const changes = [];
        if (email) changes.push(`Email to ${email}`);
        if (mobile) changes.push(`Mobile to ${mobile}`);
        const notificationMessage = `Student ${student.name} updated their profile: ${changes.join(', ')}`;
        
        console.log('Profile update notification:', notificationMessage);
        // Here you could implement actual email/push notifications
      }
    } catch (notificationError) {
      console.warn('Failed to send notification:', notificationError);
    }
    
    const [updatedStudent] = await query('SELECT * FROM students WHERE id = ?', [id]);
    res.json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update student profile' });
  }
});

// Update staff profile (direct update)
app.put('/staff/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, mobile, password } = req.body;
    
    // Update staff table
    const staffUpdates = {};
    if (email) staffUpdates.email = email;
    if (mobile) staffUpdates.mobile = mobile;
    
    if (Object.keys(staffUpdates).length > 0) {
      const setClause = Object.keys(staffUpdates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(staffUpdates);
      values.push(id);
      await query(`UPDATE staff SET ${setClause} WHERE id = ?`, values);
    }
    
    // Update users table for email and password changes
    if (email) {
      await query('UPDATE users SET email = ? WHERE id = ?', [email, id]);
    }
    
    // Update password if provided
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    }
    
    // Send notifications to admin (if user is tutor)
    try {
      const [staff] = await query('SELECT * FROM staff WHERE id = ?', [id]);
      if (staff && staff.is_tutor && !staff.is_admin) {
        // Create notification message for admin
        const changes = [];
        if (email) changes.push(`Email to ${email}`);
        if (mobile) changes.push(`Mobile to ${mobile}`);
        const notificationMessage = `Tutor ${staff.name} updated their profile: ${changes.join(', ')}`;
        
        console.log('Tutor profile update notification:', notificationMessage);
        // Here you could implement actual email/push notifications to admin
      }
    } catch (notificationError) {
      console.warn('Failed to send notification:', notificationError);
    }
    
    const [updatedStaff] = await query('SELECT * FROM staff WHERE id = ?', [id]);
    res.json(updatedStaff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update staff profile' });
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

// Create leave request with date validation
app.post('/leave-requests', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, totalDays, subject, description } = req.body;
    const id = uuidv4();

    // Check for overlapping leave or OD requests
    const overlapCheck = await query(
      `SELECT COUNT(*) as overlapCount
       FROM leave_requests
       WHERE student_id = ? AND status IN ('Approved', 'Pending')
       AND GREATEST(?, start_date) <= LEAST(?, end_date)`,
      [req.user.id, startDate, endDate]
    );

    const odOverlapCheck = await query(
      `SELECT COUNT(*) as overlapCount
       FROM od_requests
       WHERE student_id = ? AND status IN ('Approved', 'Pending')
       AND GREATEST(?, start_date) <= LEAST(?, end_date)`,
      [req.user.id, startDate, endDate]
    );

    if (overlapCheck[0].overlapCount > 0 || odOverlapCheck[0].overlapCount > 0) {
      return res.status(400).json({ error: 'Leave or OD request for these dates already exists.' });
    }

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
    
    // NOTE: We no longer update the static leave_taken field in students table
    // since we now calculate it dynamically from approved leave requests
    
    // Update the leave request
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    await query(`UPDATE leave_requests SET ${setClause} WHERE id = ?`, values);
    
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

// Create OD request with date validation
app.post('/od-requests', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, totalDays, purpose, destination, description } = req.body;
    const id = uuidv4();

    // Check for overlapping leave or OD requests
    const leaveOverlapCheck = await query(
      `SELECT COUNT(*) as overlapCount
       FROM leave_requests
       WHERE student_id = ? AND status IN ('Approved', 'Pending')
       AND GREATEST(?, start_date) <= LEAST(?, end_date)`,
      [req.user.id, startDate, endDate]
    );

    const odOverlapCheck = await query(
      `SELECT COUNT(*) as overlapCount
       FROM od_requests
       WHERE student_id = ? AND status IN ('Approved', 'Pending')
       AND GREATEST(?, start_date) <= LEAST(?, end_date)`,
      [req.user.id, startDate, endDate]
    );

    if (leaveOverlapCheck[0].overlapCount > 0 || odOverlapCheck[0].overlapCount > 0) {
      return res.status(400).json({ error: 'Leave or OD request for these dates already exists.' });
    }

    // Get student and tutor info
    const [student] = await query('SELECT * FROM students WHERE id = ?', [req.user.id]);
    if (!student || !student.tutor_id) {
      console.error('No student or tutor ID found');
      return res.status(500).json({ error: 'Student or tutor information is missing' });
    }

    const [tutor] = await query('SELECT * FROM staff WHERE id = ?', [student.tutor_id]);
    if (!tutor) {
      console.error('Tutor not found for ID:', student.tutor_id);
      return res.status(500).json({ error: 'Tutor not found' });
    }

    await query(
      'INSERT INTO od_requests (id, student_id, student_name, student_register_number, tutor_id, tutor_name, start_date, end_date, total_days, purpose, destination, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, student.name, student.register_number, student.tutor_id, tutor.name, startDate, endDate, totalDays, purpose, destination, description]
    );

    res.status(201).json({ message: 'OD request created successfully', id });
  } catch (error) {
    console.error('OD request creation error:', error);
    res.status(500).json({ error: 'Failed to create OD request', details: error.message });
  }
});

// Update OD request status
// IMPORTANT: OD (Official Duty) requests do NOT affect student leave_taken count.
// Only leave requests affect the leave_taken field in the students table.
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
    
    // NOTE: We deliberately do NOT update student.leave_taken here because
    // OD requests are separate from leave requests and should not count as leave days.
    await query(updateQuery, params);
    
    const [updatedRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [id]);
    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update OD request status' });
  }
});

// Profile Change Request endpoints

// Get all profile change requests (Admin only)
app.get('/profile-change-requests', authenticateToken, async (req, res) => {
  try {
    const profileChangeRequests = await query('SELECT * FROM profile_change_requests ORDER BY requested_at DESC');
    res.json(profileChangeRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile change requests' });
  }
});

// Create profile change request
app.post('/profile-change-requests', authenticateToken, async (req, res) => {
  try {
    const { changeType, currentValue, requestedValue, reason } = req.body;
    const id = uuidv4();
    
    // Get student and tutor info
    const [student] = await query('SELECT * FROM students WHERE id = ?', [req.user.id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const [tutor] = await query('SELECT * FROM staff WHERE id = ?', [student.tutor_id]);
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }
    
    // Check if there's already a pending request for the same change type
    const [existingRequest] = await query(
      'SELECT * FROM profile_change_requests WHERE student_id = ? AND change_type = ? AND status = "Pending"',
      [req.user.id, changeType]
    );
    
    if (existingRequest) {
      return res.status(400).json({ error: `You already have a pending ${changeType} change request` });
    }
    
    await query(
      `INSERT INTO profile_change_requests 
       (id, student_id, student_name, student_register_number, tutor_id, tutor_name, 
        change_type, current_value, requested_value, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, student.name, student.register_number, student.tutor_id, tutor.name, 
       changeType, currentValue, requestedValue, reason]
    );
    
    const [newRequest] = await query('SELECT * FROM profile_change_requests WHERE id = ?', [id]);
    res.status(201).json({ message: 'Profile change request created successfully', request: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create profile change request' });
  }
});

// Update profile change request status (Tutor/Admin only)
app.put('/profile-change-requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComments } = req.body;
    
    // Get current user info to check if they're tutor or admin
    const [userProfile] = await query('SELECT is_admin, is_tutor FROM users WHERE id = ?', [req.user.id]);
    if (!userProfile || (!userProfile.is_admin && !userProfile.is_tutor)) {
      return res.status(403).json({ error: 'Access denied. Only tutors and admins can review profile change requests.' });
    }
    
    // Get the request details
    const [request] = await query('SELECT * FROM profile_change_requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ error: 'Profile change request not found' });
    }
    
    // If tutor is trying to approve, check if it's their student
    if (userProfile.is_tutor && !userProfile.is_admin) {
      if (request.tutor_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only review requests from your own students' });
      }
    }
    
    // Get reviewer info
    const [reviewer] = await query('SELECT * FROM staff WHERE id = ?', [req.user.id]);
    const reviewerName = reviewer ? reviewer.name : 'Unknown';
    
    // Update the request status
    await query(
      `UPDATE profile_change_requests 
       SET status = ?, admin_comments = ?, reviewed_at = NOW(), reviewed_by = ?, reviewer_name = ? 
       WHERE id = ?`,
      [status, adminComments || null, req.user.id, reviewerName, id]
    );
    
    // If approved, update the student's actual profile
    if (status === 'Approved') {
      let updateQuery = '';
      let updateValue = request.requested_value;
      
      switch (request.change_type) {
        case 'email':
          updateQuery = 'UPDATE students SET email = ? WHERE id = ?';
          // Also update in users table
          await query('UPDATE users SET email = ? WHERE id = ?', [updateValue, request.student_id]);
          break;
        case 'mobile':
          updateQuery = 'UPDATE students SET mobile = ? WHERE id = ?';
          break;
        case 'password':
          // TODO: remove this package import if it's not a breaking change
          //const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(updateValue, 10);
          updateQuery = 'UPDATE users SET password_hash = ? WHERE id = ?';
          updateValue = hashedPassword;
          break;
        default:
          return res.status(400).json({ error: 'Invalid change type' });
      }
      
      await query(updateQuery, [updateValue, request.student_id]);
    }
    
    const [updatedRequest] = await query('SELECT * FROM profile_change_requests WHERE id = ?', [id]);
    res.json({ message: 'Profile change request updated successfully', request: updatedRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile change request status' });
  }
});

// Improved Upload OD certificate (file upload)
app.post('/api/od-requests/:id/certificate/upload', authenticateToken, certificateUpload.single('certificate'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Start uploading certificate for OD request ID: ${id}`);

    if (!req.file) {
      return res.status(400).json({ error: 'No certificate file uploaded' });
    }

    const { filename: tempFilename, path: tempFilePath } = req.file;
    console.log(`Uploaded file details: ${JSON.stringify(req.file)}`);

    // Get the OD request to verify it exists and get student info
    const [odRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [id]);
    if (!odRequest) {
      return res.status(404).json({ error: 'OD request not found' });
    }

    // Verify the user owns this OD request
    if (odRequest.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create directory using the student's batch and register number for organization
    const [student] = await query('SELECT batch, register_number FROM students WHERE id = ?', [req.user.id]);

    // Create date-based subdirectory with new structure: uploads/{batch}/{rollnumber}/certificate/{date}
    const uploadDate = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 10);
    const studentDir = path.join(__dirname, 'uploads', student.batch, student.register_number.toString(), 'certificate', uploadDate);
    
    if (!fs.existsSync(studentDir)) {
      fs.mkdirSync(studentDir, { recursive: true });
      console.log(`Created directory: ${studentDir}`);
    }

    // Create a more descriptive filename
    const fileExtension = path.extname(tempFilename);
    const descriptiveFilename = `od-${id}${fileExtension}`;
    
    const finalFilePath = path.join(studentDir, descriptiveFilename);
    fs.renameSync(tempFilePath, finalFilePath);

    console.log(`Certificate successfully stored in: ${finalFilePath}`);

    const certificateUrl = `/uploads/${student.batch}/${student.register_number.toString()}/certificate/${uploadDate}/${descriptiveFilename}`;
    await query('UPDATE od_requests SET certificate_url = ?, certificate_status = ? WHERE id = ?',
      [certificateUrl, 'Pending Verification', id]);

    const [updatedRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [id]);
    res.json({ 
      ...updatedRequest, 
      certificate_url: certificateUrl,
      message: 'Certificate uploaded successfully and is now pending verification'
    });
  } catch (error) {
    console.error('Certificate upload failed:', error);
    res.status(500).json({ error: 'Failed to process certificate upload', details: error.message });
  }
});

// Upload OD certificate (URL)
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
    
      // Auto-reject overdue requests and reset leave taken if it was added for OD
      for (const request of autoRejectCandidates) {
        await query(
          `UPDATE od_requests 
           SET status = 'Rejected', 
               certificate_status = 'Rejected', 
               cancel_reason = 'Certificate not submitted within 3 days after OD completion' 
           WHERE id = ?`,
          [request.id]
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

// Function to calculate dynamic leave taken based on unique calendar days
async function calculateLeaveTaken(studentId) {
  try {
    // Debug: Log all leave requests for this student
    const allLeaves = await query(
      `SELECT id, status, start_date, end_date, total_days, created_at
       FROM leave_requests
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [studentId]
    );
    console.log(`Debug - All leave requests for student ${studentId}:`, allLeaves);

    // Calculate unique calendar days on leave up to today
    // This handles overlapping leave requests correctly by counting distinct days
    const [uniqueLeaveDays] = await query(
      `SELECT COUNT(DISTINCT leave_date) as leaveTaken
       FROM (
         SELECT DATE(start_date + INTERVAL (n.num) DAY) as leave_date
         FROM leave_requests lr
         CROSS JOIN (
           SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
           UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
           UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
           UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
           UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
           UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29
           UNION SELECT 30
         ) n
         WHERE lr.student_id = ?
         AND lr.status = 'Approved'
         AND DATE(start_date + INTERVAL (n.num) DAY) <= DATE(end_date)
         AND DATE(start_date + INTERVAL (n.num) DAY) <= CURDATE()
       ) unique_dates`
    , [studentId]);

    console.log(`Debug - Unique leave days for student ${studentId}: ${uniqueLeaveDays.leaveTaken} days`);
    return uniqueLeaveDays.leaveTaken;
  } catch (error) {
    console.error('Error calculating leave taken:', error);
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

// Admin utility to audit and fix student leave counts (Admin only)
app.post('/admin/audit-leave-counts', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const [user] = await query(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    // Find students with incorrect leave counts
    const studentsWithIssues = await query(`
      SELECT 
        s.id,
        s.name,
        s.leave_taken as current_count,
        COALESCE(SUM(CASE WHEN lr.status = 'Approved' THEN lr.total_days ELSE 0 END), 0) as correct_count
      FROM students s 
      LEFT JOIN leave_requests lr ON s.id = lr.student_id 
      GROUP BY s.id, s.name, s.leave_taken 
      HAVING s.leave_taken != correct_count
    `);
    
    const fixedStudents = [];
    
    // Fix each student's leave count
    for (const student of studentsWithIssues) {
      await query(
        'UPDATE students SET leave_taken = ? WHERE id = ?',
        [student.correct_count, student.id]
      );
      
      fixedStudents.push({
        name: student.name,
        old_count: student.current_count,
        new_count: student.correct_count,
        difference: student.current_count - student.correct_count
      });
    }
    
    res.json({
      message: `Leave count audit completed. Fixed ${fixedStudents.length} students.`,
      fixed_students: fixedStudents,
      total_fixed: fixedStudents.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to audit leave counts' });
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

// Temporary test endpoint to get sample users
app.get('/test-users', async (req, res) => {
  try {
    const users = await query('SELECT id, email, first_name, last_name, is_admin, is_tutor FROM users LIMIT 5');
    const students = await query('SELECT id, register_number, name, email FROM students LIMIT 3');
    res.json({ 
      success: true,
      users: users,
      students: students
    });
  } catch (error) {
    console.error('Failed to fetch test users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch test users',
      details: error.message 
    });
  }
});

// Temporary endpoint to create test user
app.post('/create-test-user', async (req, res) => {
  try {
    const testEmail = 'testupload@college.portal';
    const testPassword = 'testpassword123';
    const testRegNumber = '9999';
    const testName = 'Test Upload User';
    
    // Check if user already exists
    const [existingUser] = await query('SELECT id FROM users WHERE email = ?', [testEmail]);
    if (existingUser) {
      return res.json({ 
        success: true, 
        message: 'Test user already exists',
        email: testEmail,
        password: testPassword,
        register_number: testRegNumber
      });
    }
    
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    // Insert into users table
    await query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [id, testEmail, passwordHash, 'Test Upload', 'User']
    );
    
    // Insert into students table
    await query(
      'INSERT INTO students (id, name, register_number, email, tutor_id, batch, semester, mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, testName, testRegNumber, testEmail, '2ef0a367-4cb8-4865-b65f-1def7b8161d2', 'Test', 1, '1234567890']
    );
    
    res.json({ 
      success: true, 
      message: 'Test user created successfully',
      email: testEmail,
      password: testPassword,
      register_number: testRegNumber
    });
  } catch (error) {
    console.error('Failed to create test user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create test user',
      details: error.message 
    });
  }
});

// Temporary endpoint to create staff record for tutor
app.post('/create-staff-for-tutor', async (req, res) => {
  try {
    const tutorId = '2ef0a367-4cb8-4865-b65f-1def7b8161d2';
    
    // Check if staff record already exists
    const [existingStaff] = await query('SELECT id FROM staff WHERE id = ?', [tutorId]);
    if (existingStaff) {
      return res.json({ 
        success: true, 
        message: 'Staff record already exists for tutor'
      });
    }
    
    // Get user info for the tutor
    const [tutorUser] = await query('SELECT * FROM users WHERE id = ?', [tutorId]);
    if (!tutorUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tutor user not found'
      });
    }
    
    // Insert into staff table
    await query(
      'INSERT INTO staff (id, name, email, username, is_admin, is_tutor) VALUES (?, ?, ?, ?, ?, ?)',
      [tutorId, `${tutorUser.first_name} ${tutorUser.last_name}`, tutorUser.email, 'tutor1', tutorUser.is_admin, tutorUser.is_tutor]
    );
    
    res.json({ 
      success: true, 
      message: 'Staff record created for tutor successfully'
    });
  } catch (error) {
    console.error('Failed to create staff record:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create staff record',
      details: error.message 
    });
  }
});

// Temporary endpoint to get test user details
app.get('/test-student-details', async (req, res) => {
  try {
    const testEmail = 'testupload@college.portal';
    
    // Get user info
    const [user] = await query('SELECT * FROM users WHERE email = ?', [testEmail]);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Test user not found'
      });
    }
    
    // Get student info
    const [student] = await query('SELECT * FROM students WHERE id = ?', [user.id]);
    
    // Get tutor info if exists
    let tutor = null;
    if (student && student.tutor_id) {
      [tutor] = await query('SELECT * FROM staff WHERE id = ?', [student.tutor_id]);
    }
    
    res.json({ 
      success: true,
      user: user,
      student: student,
      tutor: tutor
    });
  } catch (error) {
    console.error('Failed to get test student details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get test student details',
      details: error.message 
    });
  }
});

// Temporary endpoint to assign tutor to test student
app.post('/assign-tutor-to-test-student', async (req, res) => {
  try {
    console.log('Assigning tutor to test student...');
    
    const tutorEmail = 'test@ace.com';
    const testEmail = 'testupload@college.portal';
    
    // Find the tutor by email in users table
    const [tutorUser] = await query('SELECT id FROM users WHERE email = ?', [tutorEmail]);
    
    if (!tutorUser) {
      return res.json({ success: false, error: `Tutor user not found with email ${tutorEmail}` });
    }
    
    const tutorId = tutorUser.id;
    console.log('Found tutor ID:', tutorId);
    
    // Check if student record exists
    const [existingStudent] = await query('SELECT * FROM students WHERE email = ?', [testEmail]);
    
    if (!existingStudent) {
      // Get test user info to create student record
      const [testUser] = await query('SELECT * FROM users WHERE email = ?', [testEmail]);
      if (!testUser) {
        return res.json({ success: false, error: 'Test user not found' });
      }
      
      // Create student record if it doesn't exist
      await query(
        'INSERT INTO students (id, name, register_number, email, tutor_id, batch, semester, mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [testUser.id, `${testUser.first_name} ${testUser.last_name}`, 'TEST001', testEmail, tutorId, 'Test', 1, '1234567890']
      );
      console.log('Created new student record with tutor assigned');
    } else {
      // Update existing student record
      await query('UPDATE students SET tutor_id = ? WHERE email = ?', [tutorId, testEmail]);
      console.log('Updated existing student record with tutor');
    }
    
    res.json({ success: true, message: 'Tutor assigned successfully', tutorId: tutorId });
  } catch (error) {
    console.error('Error assigning tutor to test student:', error);
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
      return res.status(401).json({ error: 'Invalid username or password' });
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
    res.status(500).json({ error: 'Failed to login' });
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

// Profile change notifications endpoint
app.post('/notifications/profile-change', authenticateToken, async (req, res) => {
  try {
    const { changeType, oldValue, newValue, reason, message } = req.body;
    
    // Get current user info
    const [currentUserProfile] = await query('SELECT is_admin, is_tutor FROM users WHERE id = ?', [req.user.id]);
    const isStudent = !currentUserProfile.is_admin && !currentUserProfile.is_tutor;
    
    if (isStudent) {
      // Student profile change - notify tutor and admin
      const [student] = await query('SELECT * FROM students WHERE id = ?', [req.user.id]);
      if (student) {
        console.log(`NOTIFICATION: Student ${student.name} changed their ${changeType} from '${oldValue}' to '${newValue}'. Reason: ${reason}`);
        // Here you would implement actual email/push notifications to tutor and admin
      }
    } else if (currentUserProfile.is_tutor && !currentUserProfile.is_admin) {
      // Tutor profile change - notify admin
      const [tutor] = await query('SELECT * FROM staff WHERE id = ?', [req.user.id]);
      if (tutor) {
        console.log(`NOTIFICATION: Tutor ${tutor.name} changed their ${changeType} from '${oldValue}' to '${newValue}'. Reason: ${reason}`);
        // Here you would implement actual email/push notifications to admin
      }
    }
    
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending profile change notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
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

// Weekly Leave Data Endpoint
app.get('/api/leave-data/weekly', authenticateToken, async (req, res) => {
  try {
    const approvedLeaves = await query('SELECT * FROM leave_requests WHERE status = "Approved"');
    const students = await query('SELECT id, batch FROM students');

    const weeklyData = {};
    const today = new Date();

    approvedLeaves.forEach(leave => {
      const student = students.find(s => s.id === leave.student_id);
      if (!student) return;

      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);

      const currDate = new Date(leaveStart);
      while (currDate <= leaveEnd) {
        if (currDate > today) {
          break; // Skip future dates
        }
        const week = `${currDate.getFullYear()}-W${getWeekOfYear(currDate)}`;
        if (!weeklyData[week]) {
          weeklyData[week] = {};
        }
        if (!weeklyData[week][student.batch]) {
          weeklyData[week][student.batch] = 0;
        }
        weeklyData[week][student.batch] += 1;
        currDate.setDate(currDate.getDate() + 1);
      }
    });

    res.json(weeklyData);
  } catch (error) {
    console.error('Failed to fetch weekly leave data:', error);
    res.status(500).json({ error: 'Failed to fetch weekly leave data' });
  }
});

// Daily Leave Data Endpoint
app.get('/api/leave-data/daily', authenticateToken, async (req, res) => {
  try {
    const approvedLeaves = await query('SELECT * FROM leave_requests WHERE status = "Approved"');
    const students = await query('SELECT id FROM students');

    const dailyData = {};
    const today = new Date();

    approvedLeaves.forEach(leave => {
      const student = students.find(s => s.id === leave.student_id);
      if (!student) return;

      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);

      const currDate = new Date(leaveStart);
      while (currDate <= leaveEnd) {
        if (currDate > today) {
          break; // Skip future dates
        }
        const date = currDate.toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = 0;
        }
        dailyData[date] += 1;
        currDate.setDate(currDate.getDate() + 1);
      }
    });

    res.json(dailyData);
  } catch (error) {
    console.error('Failed to fetch daily leave data:', error);
    res.status(500).json({ error: 'Failed to fetch daily leave data' });
  }
});

// Profile Photo Upload Endpoint
app.post('/api/profile-photo', authenticateToken, profileUpload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    
    // First, check what type of user this is
    const [user] = await query('SELECT is_admin, is_tutor FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userProfileDir;
    let profilePhotoUrl;
    
    if (user.is_admin || user.is_tutor) {
      // For staff members (tutors/admins)
      const [staff] = await query('SELECT name FROM staff WHERE id = ?', [userId]);
      if (!staff) {
        return res.status(404).json({ error: 'Staff record not found' });
      }
      
      if (user.is_admin) {
        // For admins, use simple structure: uploads/Admin/profile.png
        userProfileDir = path.join(__dirname, 'uploads', 'Admin');
        profilePhotoUrl = `/uploads/Admin/profile.png`;
      } else {
        // For tutors, use simplified structure: uploads/{tutor_name}/profile.png
        const sanitizedName = staff.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
        userProfileDir = path.join(__dirname, 'uploads', sanitizedName);
        profilePhotoUrl = `/uploads/${sanitizedName}/profile.png`;
      }
    } else {
      // For students, use batch/rollnumber structure
      const [student] = await query('SELECT batch, register_number FROM students WHERE id = ?', [userId]);
      if (!student) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      
      // Create directory structure: uploads/{batch}/{rollnumber}/profile/
      userProfileDir = path.join(__dirname, 'uploads', student.batch, student.register_number.toString(), 'profile');
      profilePhotoUrl = `/uploads/${student.batch}/${student.register_number}/profile/profile.png`;
    }
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(userProfileDir)) {
      fs.mkdirSync(userProfileDir, { recursive: true });
    }

    // Check if old profile photo exists and delete it
    const finalFilePath = path.join(userProfileDir, 'profile.png');
    if (fs.existsSync(finalFilePath)) {
      try {
        fs.unlinkSync(finalFilePath);
        console.log(`Deleted old profile photo: ${finalFilePath}`);
      } catch (deleteError) {
        console.warn('Failed to delete old profile photo:', deleteError);
      }
    }

    // Process and save the new image as profile.png
    const tempFilePath = req.file.path;
    await sharp(tempFilePath)
      .png({ quality: 90 }) // Convert to PNG format
      .toFile(finalFilePath);
    
    // Remove the temporary file
    fs.unlinkSync(tempFilePath);

    // Update the user's profile photo in the database
    try {
      // Update the users table with the new profile photo
      await query('UPDATE users SET profile_photo = ? WHERE id = ?', [profilePhotoUrl, userId]);

      // Also update the appropriate table (students or staff)
      if (user.is_admin || user.is_tutor) {
        // Update staff table
        await query('UPDATE staff SET profile_photo = ? WHERE id = ?', [profilePhotoUrl, userId]);
      } else {
        // Update students table
        await query('UPDATE students SET profile_photo = ? WHERE id = ?', [profilePhotoUrl, userId]);
      }

      console.log(`Profile photo updated for user ${userId}: ${profilePhotoUrl}`);

    } catch (dbError) {
      console.error('Database update error:', dbError);
      // If database update fails, we should delete the uploaded file
      try {
        fs.unlinkSync(finalFilePath);
      } catch (deleteError) {
        console.error('Failed to delete uploaded file after database error:', deleteError);
      }
      return res.status(500).json({ error: 'Failed to update profile photo in database' });
    }

    res.json({ 
      message: 'Profile photo uploaded and updated successfully', 
      path: profilePhotoUrl 
    });

  } catch (error) {
    console.error('Profile photo upload failed:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});


// Helper function to get week of year
function getWeekOfYear(date) {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
}

// Debug endpoint to test leave calculation for specific student
app.get('/debug/student/:id/leave-calculation', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get student info
    const [student] = await query('SELECT * FROM students WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get all leave requests for this student
    const allLeaves = await query(
      `SELECT id, status, start_date, end_date, total_days, created_at, 
              DATE(start_date) as start_date_only, DATE(NOW()) as today_date,
              CASE WHEN DATE(start_date) <= DATE(NOW()) THEN 'INCLUDED' ELSE 'EXCLUDED' END as inclusion_status
       FROM leave_requests
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [id]
    );
    
    // Get approved leaves within date range
    const [approvedLeaves] = await query(
      `SELECT COALESCE(SUM(total_days), 0) as leaveTaken,
              COUNT(*) as approvedCount
       FROM leave_requests
       WHERE student_id = ?
       AND status = 'Approved'
       AND DATE(start_date) <= DATE(NOW())`,
      [id]
    );
    
    // Calculate using the function
    const dynamicLeaveTaken = await calculateLeaveTaken(id);
    
    res.json({
      student: {
        id: student.id,
        name: student.name,
        register_number: student.register_number,
        stored_leave_taken: student.leave_taken
      },
      current_date: new Date().toISOString().split('T')[0],
      all_leave_requests: allLeaves,
      approved_summary: {
        total_approved_days: approvedLeaves.leaveTaken,
        approved_requests_count: approvedLeaves.approvedCount
      },
      dynamic_calculation_result: dynamicLeaveTaken,
      matches_expected: dynamicLeaveTaken === approvedLeaves.leaveTaken
    });
  } catch (error) {
    console.error('Debug leave calculation error:', error);
    res.status(500).json({ error: 'Failed to debug leave calculation', details: error.message });
  }
});

// Create test tutor endpoint
app.post('/create-test-tutor', async (req, res) => {
  try {
    const testEmail = 'testtutor@college.portal';
    const testPassword = 'testpassword123';
    const testName = 'Test Tutor';
    
    // Check if user already exists
    const [existingUser] = await query('SELECT id FROM users WHERE email = ?', [testEmail]);
    if (existingUser) {
      return res.json({ 
        success: true, 
        message: 'Test tutor already exists',
        email: testEmail,
        password: testPassword,
        id: existingUser.id
      });
    }
    
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    // Insert into users table
    await query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_tutor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, testEmail, passwordHash, 'Test', 'Tutor', false, true]
    );
    
    // Insert into staff table
    await query(
      'INSERT INTO staff (id, name, email, username, is_admin, is_tutor) VALUES (?, ?, ?, ?, ?, ?)',
      [id, testName, testEmail, 'testtutor', false, true]
    );
    
    res.json({ 
      success: true, 
      message: 'Test tutor created successfully',
      email: testEmail,
      password: testPassword,
      id: id
    });
  } catch (error) {
    console.error('Failed to create test tutor:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create test tutor',
      details: error.message 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

