import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

console.log('🧪 Starting backend API test...');

let serverProcess = null;

// Function to test health endpoint
async function testHealthEndpoint() {
  try {
    console.log('🔍 Testing health endpoint...');
    const response = await fetch('http://localhost:3009/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health endpoint working:', data);
      return true;
    } else {
      console.log('❌ Health endpoint returned status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
    return false;
  }
}

// Function to test login endpoint
async function testLoginEndpoint() {
  try {
    console.log('🔍 Testing login endpoint...');
    const response = await fetch('http://localhost:3009/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        identifier: 'test@example.com', 
        password: 'wrongpassword' 
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401 && data.error) {
      console.log('✅ Login endpoint working (correctly rejecting invalid credentials)');
      return true;
    } else {
      console.log('❌ Login endpoint unexpected response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Login endpoint failed:', error.message);
    return false;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting production server...');
    
    // Start the server
    serverProcess = spawn('node', ['backend/server.production.js'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    let serverStarted = false;
    
    // Listen for server output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output.trim());
      if (output.includes('🚀 ACE CSS Leave Portal Server running')) {
        serverStarted = true;
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.log('Server Error:', data.toString().trim());
    });
    
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    let attempts = 0;
    while (!serverStarted && attempts < 30) {
      await setTimeout(1000);
      attempts++;
      
      // Try health check to see if server is ready
      if (attempts > 5) {
        const healthOk = await testHealthEndpoint();
        if (healthOk) {
          serverStarted = true;
          break;
        }
      }
    }
    
    if (!serverStarted) {
      throw new Error('Server did not start within 30 seconds');
    }
    
    console.log('✅ Server started successfully!');
    
    // Run tests
    const healthTest = await testHealthEndpoint();
    await setTimeout(1000);
    
    const loginTest = await testLoginEndpoint();
    
    // Summary
    console.log('\n📊 Test Results:');
    console.log('- Health endpoint:', healthTest ? '✅ PASS' : '❌ FAIL');
    console.log('- Login endpoint:', loginTest ? '✅ PASS' : '❌ FAIL');
    
    if (healthTest && loginTest) {
      console.log('\n🎉 All tests passed! Backend API is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up
    if (serverProcess) {
      console.log('\n🔄 Stopping server...');
      serverProcess.kill('SIGINT');
      
      // Wait for graceful shutdown
      await setTimeout(2000);
      
      if (!serverProcess.killed) {
        console.log('🔪 Force killing server...');
        serverProcess.kill('SIGKILL');
      }
    }
    
    console.log('🏁 Test completed.');
    process.exit(0);
  }
}

runTests();
