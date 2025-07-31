import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCertificateUpload() {
  try {
    // First login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3002/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'testupload@college.portal', // Valid student email from test user
        password: 'testpassword123' // Test user password
      }),
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✓ Login successful');

    // Get student info to create an OD request
    console.log('2. Getting student info...');
    const profileResponse = await fetch('http://localhost:3002/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!profileResponse.ok) {
      console.error('Failed to get profile:', await profileResponse.text());
      return;
    }

    console.log('✓ Got student profile');

    // Create an OD request first
    console.log('3. Creating OD request...');
    const odResponse = await fetch('http://localhost:3002/od-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        startDate: '2025-08-01',
        endDate: '2025-08-01',
        totalDays: 1,
        purpose: 'Test Certificate Upload',
        destination: 'Test Location',
        description: 'Testing certificate upload functionality'
      })
    });

    if (!odResponse.ok) {
      const errorText = await odResponse.text();
      console.error('Failed to create OD request. Status:', odResponse.status);
      console.error('Error details:', errorText);
      return;
    }

    const odData = await odResponse.json();
    const odId = odData.id;
    console.log('✓ Created OD request:', odId);

    // Approve the OD request (simulate admin approval)
    console.log('4. Approving OD request...');
    const approveResponse = await fetch(`http://localhost:3002/od-requests/${odId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'Approved'
      })
    });

    if (!approveResponse.ok) {
      console.error('Failed to approve OD request:', await approveResponse.text());
      return;
    }

    console.log('✓ OD request approved');

    // Now test certificate upload
    console.log('5. Uploading certificate...');
    const imagePath = 'C:\\Users\\Admin\\Downloads\\watch.jpg';
    
    if (!fs.existsSync(imagePath)) {
      console.error('Test image not found at:', imagePath);
      return;
    }

    const form = new FormData();
    form.append('certificate', fs.createReadStream(imagePath));

    const uploadResponse = await fetch(`http://localhost:3002/od-requests/${odId}/certificate/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    const uploadResult = await uploadResponse.text();
    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response:', uploadResult);

    if (uploadResponse.ok) {
      console.log('✓ Certificate upload successful');
      
      // Check if file exists in the expected location
      const uploadsDir = path.join(__dirname, 'uploads', 'certificates');
      console.log('6. Checking certificate directory:', uploadsDir);
      
      if (fs.existsSync(uploadsDir)) {
        const subdirs = fs.readdirSync(uploadsDir);
        console.log('Certificate subdirectories:', subdirs);
        
        subdirs.forEach(subdir => {
          const subdirPath = path.join(uploadsDir, subdir);
          if (fs.statSync(subdirPath).isDirectory()) {
            const files = fs.readdirSync(subdirPath);
            console.log(`Files in ${subdir}:`, files);
          }
        });
      } else {
        console.log('❌ Certificates directory does not exist');
      }
    } else {
      console.error('❌ Certificate upload failed');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testCertificateUpload();
