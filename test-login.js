import fetch from 'node-fetch';

console.log('🧪 Testing Login with Updated Credentials...\n');

async function testLogin(identifier, password) {
  try {
    console.log(`🔐 Testing login for: ${identifier}`);
    console.log('🌐 Frontend URL: http://210.212.246.131:8085/auth/login');
    console.log('📡 Backend URL: http://210.212.246.131:3009/api/auth/login\n');
    
    // Test direct backend first
    console.log('1️⃣ Testing direct backend API...');
    const backendResponse = await fetch('http://210.212.246.131:3009/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: identifier,
        password: password
      })
    });
    
    console.log(`   Status: ${backendResponse.status} ${backendResponse.statusText}`);
    
    if (backendResponse.ok) {
      const backendData = await backendResponse.json();
      console.log('   ✅ Direct backend login successful!');
      console.log(`   🎫 Token received: ${backendData.token ? 'YES' : 'NO'}`);
      console.log(`   👤 User: ${backendData.user?.email || 'N/A'}\n`);
    } else {
      const errorData = await backendResponse.json();
      console.log('   ❌ Direct backend login failed');
      console.log(`   Error: ${errorData.error}\n`);
      return false;
    }
    
    // Test through frontend proxy
    console.log('2️⃣ Testing frontend proxy...');
    const frontendResponse = await fetch('http://210.212.246.131:8085/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: identifier,
        password: password
      })
    });
    
    console.log(`   Status: ${frontendResponse.status} ${frontendResponse.statusText}`);
    
    if (frontendResponse.ok) {
      const frontendData = await frontendResponse.json();
      console.log('   ✅ Frontend proxy login successful!');
      console.log(`   🎫 Token received: ${frontendData.token ? 'YES' : 'NO'}`);
      console.log(`   👤 User: ${frontendData.user?.email || 'N/A'}`);
      return true;
    } else {
      const errorData = await frontendResponse.json();
      console.log('   ❌ Frontend proxy login failed');
      console.log(`   Error: ${errorData.error}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting login tests...\n');
  
  const testCredentials = [
    { identifier: 'admin@college.edu', password: 'admin123' },
    { identifier: 'admin', password: 'admin123' }
  ];
  
  let successCount = 0;
  
  for (const creds of testCredentials) {
    console.log(`\n${'='.repeat(50)}`);
    const success = await testLogin(creds.identifier, creds.password);
    if (success) successCount++;
    console.log(`${'='.repeat(50)}\n`);
  }
  
  console.log('📊 TEST RESULTS:');
  console.log(`✅ Successful: ${successCount}/${testCredentials.length}`);
  console.log(`❌ Failed: ${testCredentials.length - successCount}/${testCredentials.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 LOGIN IS WORKING!');
    console.log('🌐 Go to: http://210.212.246.131:8085');
    console.log('📧 Use either:');
    console.log('   • Email: admin@college.edu');
    console.log('   • Username: admin');
    console.log('🔑 Password: admin123');
  } else {
    console.log('\n❌ All login tests failed. Check server logs for details.');
  }
}

runTests().catch(console.error);
