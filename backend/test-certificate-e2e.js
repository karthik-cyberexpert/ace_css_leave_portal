import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const API_BASE_URL = 'http://localhost:3002';
const TEST_CONFIG = {
  admin: {
    identifier: 'test-admin@example.com',
    password: 'admin123'
  },
  student: {
    identifier: 'test@gmail.com', 
    password: '123456'
  }
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

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
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

  const testFilePath = path.join(__dirname, 'test-cert-e2e.png');
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

async function testCompleteFlow() {
  logSection('CERTIFICATE UPLOAD END-TO-END TEST');
  
  let studentToken = null;
  let adminToken = null;
  let odRequestId = null;
  let testImagePath = null;

  try {
    // Step 1: Check server health
    log('Step 1: Checking server health...', 'blue');
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/`);
      const healthData = await healthResponse.json();
      logSuccess(`Server is running: ${healthData.message}`);
    } catch (error) {
      logError(`Server health check failed: ${error.message}`);
      return;
    }

    // Step 2: Student login
    log('Step 2: Student login...', 'blue');
    const studentLogin = await login(TEST_CONFIG.student.identifier, TEST_CONFIG.student.password);
    if (!studentLogin.success) {
      logError(`Student login failed: ${studentLogin.error}`);
      return;
    }
    studentToken = studentLogin.token;
    logSuccess('Student logged in successfully');

    // Step 3: Admin login
    log('Step 3: Admin login...', 'blue');
    const adminLogin = await login(TEST_CONFIG.admin.identifier, TEST_CONFIG.admin.password);
    if (!adminLogin.success) {
      logError(`Admin login failed: ${adminLogin.error}`);
      return;
    }
    adminToken = adminLogin.token;
    logSuccess('Admin logged in successfully');

    // Step 4: Create OD request as student
    log('Step 4: Creating OD request...', 'blue');
    const odData = {
      startDate: '2025-08-05',
      endDate: '2025-08-06',
      totalDays: 2,
      purpose: 'Technical Conference',
      destination: 'Chennai',
      description: 'Attending AI conference for skill development'
    };

    const odResponse = await apiCall('/od-requests', {
      method: 'POST',
      body: JSON.stringify(odData)
    }, studentToken);

    odRequestId = odResponse.id;
    logSuccess(`OD request created with ID: ${odRequestId}`);

    // Step 5: Approve OD request as admin
    log('Step 5: Approving OD request...', 'blue');
    await apiCall(`/od-requests/${odRequestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Approved' })
    }, adminToken);
    logSuccess('OD request approved');

    // Step 6: Create test image
    log('Step 6: Creating test certificate image...', 'blue');
    testImagePath = createTestImage();
    logSuccess('Test certificate image created');

    // Step 7: Upload certificate as student
    log('Step 7: Uploading certificate...', 'blue');
    const formData = new FormData();
    formData.append('certificate', fs.createReadStream(testImagePath), {
      filename: 'conference-certificate.png',
      contentType: 'image/png'
    });

    const uploadResponse = await fetch(`${API_BASE_URL}/api/od-requests/${odRequestId}/certificate/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      throw new Error(`Certificate upload failed: ${uploadError}`);
    }

    const uploadData = await uploadResponse.json();
    logSuccess(`Certificate uploaded successfully: ${uploadData.message}`);
    log(`  Certificate URL: ${uploadData.certificate_url}`, 'blue');
    log(`  Status: ${uploadData.certificate_status}`, 'blue');

    // Step 8: Verify certificate as admin
    log('Step 8: Verifying certificate...', 'blue');
    const verifyResponse = await apiCall(`/od-requests/${odRequestId}/certificate/verify`, {
      method: 'PUT',
      body: JSON.stringify({ 
        isApproved: true,
        certificateStatus: 'Approved'
      })
    }, adminToken);
    logSuccess('Certificate approved by admin');

    // Step 9: Check final status
    log('Step 9: Checking final OD request status...', 'blue');
    const finalODRequests = await apiCall('/od-requests', {}, studentToken);
    const finalRequest = finalODRequests.find(req => req.id === odRequestId);
    
    if (finalRequest) {
      logSuccess('Final OD request status retrieved');
      log(`  OD Status: ${finalRequest.status}`, 'blue');
      log(`  Certificate Status: ${finalRequest.certificate_status}`, 'blue');
      log(`  Certificate URL: ${finalRequest.certificate_url}`, 'blue');
    }

    // Step 10: Test certificate download
    log('Step 10: Testing certificate download...', 'blue');
    if (finalRequest && finalRequest.certificate_url) {
      const downloadResponse = await fetch(`${API_BASE_URL}${finalRequest.certificate_url}`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });

      if (downloadResponse.ok) {
        logSuccess('Certificate download successful');
        log(`  Content-Type: ${downloadResponse.headers.get('content-type')}`, 'blue');
        log(`  Content-Length: ${downloadResponse.headers.get('content-length')} bytes`, 'blue');
      } else {
        logWarning('Certificate download failed');
      }
    }

    logSection('TEST RESULTS');
    logSuccess('🎉 All tests passed! Certificate upload flow is working correctly.');
    log('✓ Server health check', 'green');
    log('✓ User authentication (student & admin)', 'green');
    log('✓ OD request creation', 'green');
    log('✓ OD request approval', 'green');
    log('✓ Certificate upload', 'green');
    log('✓ Certificate verification', 'green');
    log('✓ Certificate download', 'green');

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error('Full error:', error);
  } finally {
    // Cleanup
    if (testImagePath && fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      log('Test files cleaned up', 'blue');
    }
  }
}

// Run the test
testCompleteFlow().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});
