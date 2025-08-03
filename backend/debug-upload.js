import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

// Test script to debug certificate upload
const API_BASE_URL = 'http://localhost:3002';

async function testCertificateUpload() {
  try {
    console.log('=== Certificate Upload Debug Test ===');
    
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'test@gmail.com',
        password: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      const loginError = await loginResponse.text();
      console.error('Login failed:', loginError);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login successful, got token:', token.substring(0, 20) + '...');
    
    // Get user's OD requests
    console.log('2. Getting OD requests...');
    const odResponse = await fetch(`${API_BASE_URL}/od-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!odResponse.ok) {
      console.error('Failed to get OD requests:', await odResponse.text());
      return;
    }
    
    const odRequests = await odResponse.json();
    console.log('Found OD requests:', odRequests.length);
    
    if (odRequests.length === 0) {
      console.log('No OD requests found. Creating a test OD request...');
      
      // Create a test OD request
      const createODResponse = await fetch(`${API_BASE_URL}/od-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: '2024-01-15',
          endDate: '2024-01-15',
          totalDays: 1,
          purpose: 'Test Purpose',
          destination: 'Test Destination',
          description: 'Test OD request for certificate upload'
        })
      });
      
      if (!createODResponse.ok) {
        console.error('Failed to create OD request:', await createODResponse.text());
        return;
      }
      
      // Update the request to approved status
      const createdOD = await createODResponse.json();
      console.log('Created OD request:', createdOD.id);
      
      // Approve the OD request
      const approveResponse = await fetch(`${API_BASE_URL}/od-requests/${createdOD.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Approved'
        })
      });
      
      if (!approveResponse.ok) {
        console.error('Failed to approve OD request:', await approveResponse.text());
        return;
      }
      
      console.log('OD request approved');
      
      // Refresh OD requests
      const newOdResponse = await fetch(`${API_BASE_URL}/od-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const newOdRequests = await newOdResponse.json();
      odRequests.length = 0;
      odRequests.push(...newOdRequests);
    }
    
    // Find an approved OD request
    const approvedOD = odRequests.find(od => od.status === 'Approved');
    if (!approvedOD) {
      console.error('No approved OD request found');
      return;
    }
    
    console.log('Using OD request:', approvedOD.id, 'Status:', approvedOD.status);
    
    // Create a test file
    console.log('3. Creating test certificate file...');
    const testContent = 'This is a test certificate file for debugging upload issues.';
    const testFileName = 'test-certificate.txt';
    fs.writeFileSync(testFileName, testContent);
    console.log('Test file created:', testFileName);
    
    // Test the upload
    console.log('4. Testing certificate upload...');
    
    const formData = new FormData();
    formData.append('certificate', fs.createReadStream(testFileName), {
      filename: testFileName,
      contentType: 'text/plain'
    });
    
    console.log('FormData created with certificate field');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/api/od-requests/${approvedOD.id}/certificate/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response ok:', uploadResponse.ok);
    
    const responseText = await uploadResponse.text();
    console.log('Upload response body:', responseText);
    
    if (uploadResponse.ok) {
      console.log('✅ Certificate upload successful!');
      
      // Parse the response
      try {
        const responseData = JSON.parse(responseText);
        console.log('Certificate URL:', responseData.certificateUrl);
        
        // Test viewing the certificate
        console.log('5. Testing certificate viewing...');
        const filename = responseData.certificateUrl.split('/').pop();
        const viewResponse = await fetch(`${API_BASE_URL}/api/certificate/${approvedOD.id}/${filename}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('View response status:', viewResponse.status);
        if (viewResponse.ok) {
          console.log('✅ Certificate viewing successful!');
        } else {
          console.log('❌ Certificate viewing failed:', await viewResponse.text());
        }
        
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
    } else {
      console.log('❌ Certificate upload failed');
      
      // Try to parse error response
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error details:', errorData);
      } catch (parseError) {
        console.error('Raw error response:', responseText);
      }
    }
    
    // Cleanup
    if (fs.existsSync(testFileName)) {
      fs.unlinkSync(testFileName);
      console.log('Test file cleaned up');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testCertificateUpload();
