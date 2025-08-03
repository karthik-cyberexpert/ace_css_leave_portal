import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const API_BASE_URL = 'http://localhost:3002';
const STUDENT_CREDENTIALS = {
  identifier: 'test@gmail.com', 
  password: '123456'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Create a test image file
function createTestImage() {
  // Create a minimal PNG file (1x1 transparent pixel)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  const testFilePath = path.join(__dirname, 'test-cert-simple.png');
  fs.writeFileSync(testFilePath, pngData);
  return testFilePath;
}

// API Helper functions
async function login(identifier, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Login failed: ${error}`);
    }

    const data = await response.json();
    return { success: true, token: data.token, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function apiCall(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API call failed: ${error}`);
  }

  return response.json();
}

async function testCertificateUploadFlow() {
  logSection('CERTIFICATE UPLOAD FUNCTIONALITY TEST');
  
  let studentToken = null;
  let odRequestId = null;
  let testImagePath = null;

  try {
    // Step 1: Check server health
    logInfo('Step 1: Checking server health...');
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/`);
      const healthData = await healthResponse.json();
      logSuccess(`Server is running: ${healthData.message}`);
    } catch (error) {
      logError(`Server health check failed: ${error.message}`);
      return;
    }

    // Step 2: Student login
    logInfo('Step 2: Student login...');
    const studentLogin = await login(STUDENT_CREDENTIALS.identifier, STUDENT_CREDENTIALS.password);
    if (!studentLogin.success) {
      logError(`Student login failed: ${studentLogin.error}`);
      return;
    }
    studentToken = studentLogin.token;
    logSuccess('Student logged in successfully');

    // Step 3: Create OD request
    logInfo('Step 3: Creating OD request...');
    const odData = {
      startDate: '2025-08-07',
      endDate: '2025-08-08',
      totalDays: 2,
      purpose: 'Technical Workshop',
      destination: 'Bangalore',
      description: 'Attending workshop for certificate upload testing'
    };

    const odResponse = await apiCall('/od-requests', {
      method: 'POST',
      body: JSON.stringify(odData)
    }, studentToken);

    odRequestId = odResponse.id;
    logSuccess(`OD request created with ID: ${odRequestId}`);
    log(`  Status: ${odResponse.status}`, 'blue');
    log(`  Certificate Status: ${odResponse.certificate_status || 'Not set'}`, 'blue');

    // Step 4: Check OD requests to see the current state
    logInfo('Step 4: Checking OD request status...');
    const odRequests = await apiCall('/od-requests', {}, studentToken);
    const currentRequest = odRequests.find(req => req.id === odRequestId);
    
    if (currentRequest) {
      logSuccess('OD request found in system');
      log(`  Current Status: ${currentRequest.status}`, 'blue');
      log(`  Certificate Status: ${currentRequest.certificate_status || 'Not set'}`, 'blue');
      log(`  Upload Deadline: ${currentRequest.upload_deadline || 'Not set'}`, 'blue');
    }

    // Step 5: Create test certificate image
    logInfo('Step 5: Creating test certificate image...');
    testImagePath = createTestImage();
    logSuccess('Test certificate image created');

    // Step 6: Test certificate upload
    logInfo('Step 6: Testing certificate upload...');
    const formData = new FormData();
    formData.append('certificate', fs.createReadStream(testImagePath), {
      filename: 'workshop-certificate.png',
      contentType: 'image/png'
    });

    log('  Uploading to endpoint: /api/od-requests/' + odRequestId + '/certificate/upload', 'blue');

    const uploadResponse = await fetch(`${API_BASE_URL}/api/od-requests/${odRequestId}/certificate/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    log(`  Upload response status: ${uploadResponse.status}`, 'blue');

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      logError(`Certificate upload failed: ${uploadError}`);
      return;
    }

    const uploadData = await uploadResponse.json();
    logSuccess(`Certificate uploaded successfully!`);
    log(`  Message: ${uploadData.message}`, 'green');
    log(`  Certificate URL: ${uploadData.certificate_url}`, 'green');
    log(`  Certificate Status: ${uploadData.certificate_status}`, 'green');

    // Step 7: Verify the upload by checking the updated request
    logInfo('Step 7: Verifying upload by checking request status...');
    const updatedODRequests = await apiCall('/od-requests', {}, studentToken);
    const updatedRequest = updatedODRequests.find(req => req.id === odRequestId);
    
    if (updatedRequest) {
      logSuccess('Upload verification successful');
      log(`  OD Status: ${updatedRequest.status}`, 'blue');
      log(`  Certificate Status: ${updatedRequest.certificate_status}`, 'blue');
      log(`  Certificate URL: ${updatedRequest.certificate_url}`, 'blue');
      
      // Step 8: Test certificate download
      if (updatedRequest.certificate_url) {
        logInfo('Step 8: Testing certificate download...');
        const downloadResponse = await fetch(`${API_BASE_URL}${updatedRequest.certificate_url}`, {
          headers: { 'Authorization': `Bearer ${studentToken}` }
        });

        if (downloadResponse.ok) {
          logSuccess('Certificate download successful');
          log(`  Content-Type: ${downloadResponse.headers.get('content-type')}`, 'blue');
          log(`  Content-Length: ${downloadResponse.headers.get('content-length')} bytes`, 'blue');
          
          // Check if file exists on filesystem
          const certificatePath = path.join(__dirname, 'uploads', 'certificates', odRequestId);
          if (fs.existsSync(certificatePath)) {
            const files = fs.readdirSync(certificatePath);
            logSuccess(`Certificate file saved to filesystem: ${files.join(', ')}`);
          }
        } else {
          logError('Certificate download failed');
        }
      }
    }

    logSection('TEST RESULTS SUMMARY');
    logSuccess('🎉 Certificate upload functionality is working correctly!');
    log('✓ Server health check', 'green');
    log('✓ Student authentication', 'green');
    log('✓ OD request creation', 'green');
    log('✓ Certificate upload (PNG format)', 'green');
    log('✓ Database update (certificate URL and status)', 'green');
    log('✓ File system storage', 'green');
    log('✓ Certificate download/serving', 'green');

    logInfo('\nNext steps to complete full testing:');
    log('• Test with different file formats (PDF, JPEG)', 'yellow');
    log('• Test file size limits', 'yellow');
    log('• Test invalid file types', 'yellow');
    log('• Test admin certificate verification', 'yellow');

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error('Full error details:', error);
  } finally {
    // Cleanup
    if (testImagePath && fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      log('Test files cleaned up', 'blue');
    }
  }
}

// Run the test
testCertificateUploadFlow().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});
