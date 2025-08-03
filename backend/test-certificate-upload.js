import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the test PNG image file
const testFilePath = path.join(__dirname, 'test-certificate.png');

// Check if test image exists
if (!fs.existsSync(testFilePath)) {
  console.error('Test PNG file not found. Please run: node create-test-image.js first');
  process.exit(1);
}

console.log('Using test file:', testFilePath);

// Test configuration
const API_BASE_URL = 'http://localhost:3002';
const TEST_REQUEST_ID = '63621206-c197-430c-be74-4261b51af089'; // Real OD request ID from database
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyY2EzMjZiLWU2ZTItNGY4ZS05NDEyLTA0Y2U2YTJiYWM5OSIsImlhdCI6MTc1NDAzMTA5MSwiZXhwIjoxNzU0MTE3NDkxfQ.PelEa6d3n_HQ1URQtm7Med7RUJzdplfFgkdc_ecrDEU'; // Valid token from login

async function testCertificateUpload() {
  console.log('=== Testing Certificate Upload ===');
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('certificate', fs.createReadStream(testFilePath), {
      filename: 'test-certificate.png',
      contentType: 'image/png'
    });
    
    console.log('FormData created with test file');
    
    // Make the request
    const response = await fetch(`${API_BASE_URL}/api/od-requests/${TEST_REQUEST_ID}/certificate/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      
      // Check if file exists in uploads directory
      const uploadDir = path.join(__dirname, 'uploads', 'certificates', TEST_REQUEST_ID);
      console.log('Checking upload directory:', uploadDir);
      
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        console.log('Files in upload directory:', files);
      } else {
        console.log('❌ Upload directory does not exist');
      }
    } else {
      console.log('❌ Upload failed');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Simple server health check
async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();
    console.log('Server health check:', data);
    return true;
  } catch (error) {
    console.error('Server not responding:', error.message);
    return false;
  }
}

// Debug file permissions
function debugFilePermissions() {
  console.log('=== Debugging File Permissions ===');
  
  const uploadsDir = path.join(__dirname, 'uploads');
  const certificatesDir = path.join(__dirname, 'uploads', 'certificates');
  
  console.log('Uploads directory exists:', fs.existsSync(uploadsDir));
  console.log('Certificates directory exists:', fs.existsSync(certificatesDir));
  
  // Test write permissions
  const testPermissionFile = path.join(certificatesDir, 'permission-test.txt');
  try {
    fs.writeFileSync(testPermissionFile, 'permission test');
    console.log('✅ Can write to certificates directory');
    fs.unlinkSync(testPermissionFile);
  } catch (error) {
    console.error('❌ Cannot write to certificates directory:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('Starting certificate upload debugging...\n');
  
  // Check server health
  const serverOk = await checkServerHealth();
  if (!serverOk) {
    console.log('❌ Server is not responding. Please ensure the server is running.');
    return;
  }
  
  // Debug file permissions
  debugFilePermissions();
  
  // Now test the actual upload
  console.log('\n=== Running Certificate Upload Test ===');
  await testCertificateUpload();
}

runTests();
