const mysql = require('mysql2/promise');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'cyber_security_leave_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00'
};

const jwtSecret = 'your_super_secret_jwt_key_change_this_in_production';

async function setupTestEnvironment() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('Setting up test environment...');
    
    // Clean up existing test data
    await connection.execute("DELETE FROM user_sessions WHERE user_id IN ('999', '998', '997')");
    await connection.execute("DELETE FROM od_requests WHERE student_id IN ('999', '998')");
    await connection.execute("DELETE FROM students WHERE id IN ('999', '998')");
    await connection.execute("DELETE FROM staff WHERE id IN ('997')");
    await connection.execute("DELETE FROM users WHERE id IN ('999', '998', '997')");
    
    // Create test tutor
    await connection.execute(`
      INSERT INTO users (id, first_name, last_name, email, password_hash, is_tutor) 
      VALUES ('997', 'Test', 'Tutor', 'tutor@test.com', '$2a$10$test', 1)
    `);
    
    await connection.execute(`
      INSERT INTO staff (id, name, email, username, is_tutor) 
      VALUES ('997', 'Test Tutor', 'tutor@test.com', 'testtutor', 1)
    `);
    
    // Create test student
    // Note: The users table doesn't have is_student column, so we'll skip that
    await connection.execute(`
      INSERT INTO users (id, first_name, last_name, email, password_hash) 
      VALUES ('999', 'Test', 'Student', 'student@test.com', '$2a$10$test')
    `);
    
    await connection.execute(`
      INSERT INTO students (id, name, email, register_number, batch, tutor_id, username, mobile) 
      VALUES ('999', 'Test Student', 'student@test.com', 'TEST999', '2024', '997', 'teststudent', '1234567890')
    `);
    
    console.log('✓ Test users created');
    
    // Create test OD request
    const odId = '52ca326b-e6e2-4f8e-9412-04ce6a2bac99';
    await connection.execute(`
      INSERT INTO od_requests (id, student_id, student_name, student_register_number, tutor_id, tutor_name, start_date, end_date, total_days, purpose, destination, status, certificate_status, created_at) 
      VALUES (?, '999', 'Test Student', 'TEST999', '997', 'Test Tutor', '2024-08-05', '2024-08-06', 2, 'Technical Conference', 'Conference Center', 'Pending', 'Pending Upload', NOW())
    `, [odId]);
    
    console.log('✓ OD request created with ID:', odId);
    
    // Generate JWT tokens and create sessions
    const studentToken = jwt.sign({ id: '999', email: 'student@test.com' }, jwtSecret, { expiresIn: '1h' });
    const tutorToken = jwt.sign({ id: '997', email: 'tutor@test.com' }, jwtSecret, { expiresIn: '1h' });
    
    // Create sessions for both users
    const crypto = require('crypto');
    const { v4: uuidv4 } = require('uuid');
    
    // Create student session
    const studentSessionId = uuidv4();
    const studentTokenHash = crypto.createHash('sha256').update(studentToken).digest('hex');
    const studentExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await connection.execute(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at, is_active) VALUES (?, ?, ?, ?, 1)',
      [studentSessionId, '999', studentTokenHash, studentExpiresAt]
    );
    
    // Create tutor session
    const tutorSessionId = uuidv4();
    const tutorTokenHash = crypto.createHash('sha256').update(tutorToken).digest('hex');
    const tutorExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await connection.execute(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at, is_active) VALUES (?, ?, ?, ?, 1)',
      [tutorSessionId, '997', tutorTokenHash, tutorExpiresAt]
    );
    
    console.log('✓ JWT tokens and sessions created');
    
    // Step 1: Approve the OD request as tutor
    console.log('\nStep 1: Approving OD request as tutor...');
    try {
      const approveResponse = await axios.put(`http://localhost:3002/od-requests/${odId}/status`, {
        status: 'Approved',
        tutorComments: 'Approved for testing'
      }, {
        headers: {
          'Authorization': `Bearer ${tutorToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✓ OD request approved:', approveResponse.data.status);
    } catch (error) {
      console.error('✗ Failed to approve OD request:', error.response?.data || error.message);
    }
    
    // Step 2: Create a test certificate file
    const testCertPath = path.join(__dirname, 'test-certificate.pdf');
    if (!fs.existsSync(testCertPath)) {
      fs.writeFileSync(testCertPath, 'This is a test certificate file content');
    }
    console.log('✓ Test certificate file created');
    
    // Step 3: Upload certificate as student
    console.log('\nStep 2: Uploading certificate as student...');
    try {
      const form = new FormData();
      form.append('certificate', fs.createReadStream(testCertPath), {
        filename: 'test-certificate.pdf',
        contentType: 'application/pdf'
      });
      
      const uploadResponse = await axios.post(`http://localhost:3002/api/od-requests/${odId}/certificate/upload`, form, {
        headers: {
          'Authorization': `Bearer ${studentToken}`,
          ...form.getHeaders()
        }
      });
      
      console.log('✓ Certificate uploaded successfully');
      console.log('Response:', uploadResponse.data);
    } catch (error) {
      console.error('✗ Failed to upload certificate:', error.response?.data || error.message);
    }
    
    // Step 4: Check the final status
    console.log('\nStep 3: Checking final OD request status...');
    const [finalStatus] = await connection.execute('SELECT * FROM od_requests WHERE id = ?', [odId]);
    console.log('Final OD Request Status:', {
      id: finalStatus.id,
      status: finalStatus.status,
      certificate_status: finalStatus.certificate_status,
      certificate_url: finalStatus.certificate_url
    });
    
    // Step 5: Test tutor viewing the certificate
    console.log('\nStep 4: Testing tutor access to view certificate...');
    try {
      const viewResponse = await axios.get(`http://localhost:3002/api/od-requests/${odId}`, {
        headers: {
          'Authorization': `Bearer ${tutorToken}`
        }
      });
      console.log('✓ Tutor can view OD request with certificate');
      console.log('Certificate info:', {
        certificate_url: viewResponse.data.certificate_url,
        certificate_status: viewResponse.data.certificate_status
      });
    } catch (error) {
      console.error('✗ Failed to view OD request:', error.response?.data || error.message);
    }
    
    console.log('\n=== Test completed successfully! ===');
    
    // Clean up test file
    if (fs.existsSync(testCertPath)) {
      fs.unlinkSync(testCertPath);
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await connection.end();
  }
}

setupTestEnvironment();
