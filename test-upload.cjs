const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

async function testCertificateUpload() {
    try {
        console.log('Starting certificate upload test...');
        
        // Login first
        const loginData = {
            identifier: "test1@gmail.com",
            password: "123456"
        };
        
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:3002/auth/login', loginData);
        const token = loginResponse.data.token;
        console.log('Login successful, got token:', token.substring(0, 20) + '...');
        
        // Create OD request
        const odData = {
            startDate: "2024-02-20",
            endDate: "2024-02-20", 
            totalDays: 1,
            purpose: "Test Certificate Upload",
            destination: "Test Location",
            description: "Testing certificate upload functionality"
        };
        
        console.log('Creating OD request...');
        const odResponse = await axios.post('http://localhost:3002/od-requests', odData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const odRequestId = odResponse.data.id;
        console.log('OD request created with ID:', odRequestId);
        
        // Upload certificate
        const filePath = 'C:\\Users\\earce\\Downloads\\logo33.png';
        
        if (!fs.existsSync(filePath)) {
            throw new Error('Test file not found: ' + filePath);
        }
        
        console.log('Preparing file upload...');
        const form = new FormData();
        form.append('certificate', fs.createReadStream(filePath), {
            filename: 'logo33.png',
            contentType: 'image/png'
        });
        
        const uploadUrl = `http://localhost:3002/api/od-requests/${odRequestId}/certificate/upload`;
        console.log('Uploading to:', uploadUrl);
        
        const uploadResponse = await axios.post(uploadUrl, form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });
        
        console.log('Upload successful!');
        console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));
        
        // Test certificate viewing
        if (uploadResponse.data.certificate_url) {
            const filename = path.basename(uploadResponse.data.certificate_url);
            const viewUrl = `http://localhost:3002/api/certificate/${odRequestId}/${filename}`;
            console.log('Testing certificate viewing at:', viewUrl);
            
            const viewResponse = await axios.get(viewUrl, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'arraybuffer'
            });
            
            console.log('Certificate viewing successful!');
            console.log('Response headers:', viewResponse.headers);
            console.log('Content length:', viewResponse.data.length);
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testCertificateUpload();
