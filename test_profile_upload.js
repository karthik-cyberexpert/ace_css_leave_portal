import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE = 'http://localhost:3002';

async function testProfileUpload() {
  try {
    console.log('🔍 Testing profile picture upload functionality...\n');

    // Step 1: Login as admin to create a test user
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.token) {
      throw new Error('Admin login failed: ' + JSON.stringify(loginData));
    }
    console.log('✅ Admin login successful');

    const adminToken = loginData.token;

    // Step 2: Create test user with tutor as test@ace.com
    console.log('\n2. Creating test user under tutor test@ace.com...');
    
    // First, find or create the tutor
    let tutorId;
    try {
      const staffResponse = await fetch(`${API_BASE}/staff`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const staff = await staffResponse.json();
      const tutor = staff.find(s => s.email === 'test@ace.com');
      
      if (!tutor) {
        console.log('Creating tutor test@ace.com...');
        const createTutorResponse = await fetch(`${API_BASE}/staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            email: 'test@ace.com',
            password: 'testpass123',
            name: 'Test Tutor',
            username: 'test_tutor',
            isAdmin: false,
            isTutor: true
          })
        });
        
        const tutorData = await createTutorResponse.json();
        if (!tutorData.id) {
          throw new Error('Failed to create tutor: ' + JSON.stringify(tutorData));
        }
        tutorId = tutorData.id;
        console.log('✅ Tutor created with ID:', tutorId);
      } else {
        tutorId = tutor.id;
        console.log('✅ Found existing tutor with ID:', tutorId);
      }
    } catch (error) {
      console.error('Error with tutor:', error.message);
      throw error;
    }

    // Create test student with unique timestamp
    const timestamp = Date.now();
    const testUserData = {
      email: `testuser${timestamp}@student.com`,
      password: 'testuser123',
      name: 'Test User Student',
      registerNumber: `TEST${timestamp}`,
      tutorId: tutorId,
      batch: '2024',
      semester: 1,
      mobile: '1234567890'
    };

    const createUserResponse = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(testUserData)
    });

    const userData = await createUserResponse.json();
    if (!userData.id) {
      console.log('User creation response:', userData);
      // User might already exist, let's try to login instead
      console.log('User might already exist, attempting to login...');
    } else {
      console.log('✅ Test user created with ID:', userData.id);
    }

    // Step 3: Login as the test user
    console.log('\n3. Logging in as test user...');
    console.log('Using email:', testUserData.email);
    const testLoginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testUserData.email,
        password: 'testuser123'
      })
    });

    const testLoginData = await testLoginResponse.json();
    if (!testLoginData.token) {
      throw new Error('Test user login failed: ' + JSON.stringify(testLoginData));
    }
    console.log('✅ Test user login successful');

    const testUserToken = testLoginData.token;

    // Step 4: Get current profile before upload
    console.log('\n4. Getting current profile...');
    const profileResponse = await fetch(`${API_BASE}/profile`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const profileData = await profileResponse.json();
    console.log('Current profile photo:', profileData.profile_photo || '(none)');

    // Step 5: Upload profile picture
    console.log('\n5. Uploading profile picture...');
    const imagePath = 'C:\\Users\\Admin\\Downloads\\watch.jpg';
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at: ${imagePath}`);
    }

    const formData = new FormData();
    const imageBuffer = fs.readFileSync(imagePath);
    formData.append('profilePhoto', imageBuffer, {
      filename: 'watch.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await fetch(`${API_BASE}/upload/profile-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error('Upload failed: ' + JSON.stringify(uploadData));
    }
    console.log('✅ Upload successful:', uploadData.filePath);

    // Step 6: Verify profile picture was saved correctly
    console.log('\n6. Verifying profile picture was saved...');
    const updatedProfileResponse = await fetch(`${API_BASE}/profile`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const updatedProfile = await updatedProfileResponse.json();
    console.log('Updated profile photo:', updatedProfile.profile_photo);

    // Step 7: Check if the image file exists on disk
    console.log('\n7. Checking if uploaded file exists on disk...');
    const filename = uploadData.filePath.split('/').pop();
    const uploadedFilePath = `backend/uploads/profile-photos/${filename}`;
    
    if (fs.existsSync(uploadedFilePath)) {
      const stats = fs.statSync(uploadedFilePath);
      console.log('✅ File exists on disk:', uploadedFilePath);
      console.log('File size:', stats.size, 'bytes');
    } else {
      console.log('❌ File does not exist on disk:', uploadedFilePath);
    }

    // Step 8: Test image access via HTTP
    console.log('\n8. Testing image access via HTTP...');
    const imageUrl = `${API_BASE}${uploadData.filePath}`;
    console.log('Trying to access:', imageUrl);
    
    const imageResponse = await fetch(imageUrl);
    if (imageResponse.ok) {
      console.log('✅ Image accessible via HTTP');
      console.log('Content-Type:', imageResponse.headers.get('content-type'));
      console.log('Content-Length:', imageResponse.headers.get('content-length'));
    } else {
      console.log('❌ Image not accessible via HTTP:', imageResponse.status, imageResponse.statusText);
    }

    // Step 9: Test getting student data to see if profile photo is included
    console.log('\n9. Testing student data endpoint...');
    const studentsResponse = await fetch(`${API_BASE}/students`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const students = await studentsResponse.json();
    const testStudent = students.find(s => s.email === testUserData.email);
    if (testStudent) {
      console.log('✅ Test student found in students endpoint!');
      console.log('Test student profile photo from students endpoint:', testStudent.profile_photo);
      console.log('Profile photo matches uploaded image:', testStudent.profile_photo === uploadData.filePath ? '✅ YES' : '❌ NO');
    } else {
      console.log('❌ Test student not found in students endpoint');
      console.log('Looking for email:', testUserData.email);
      console.log('Available students:', students.map(s => ({ email: s.email, name: s.name })));
    }

    console.log('\n🎉 Profile picture upload test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testProfileUpload();
