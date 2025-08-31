import { testLoginEmailService, initializeEmailService } from './utils/loginEmailService.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the parent directory
dotenv.config({ path: path.resolve('../.env') });

/**
 * Standalone Email Service Test Script
 * Run this script to test email sending independently of the main application
 * 
 * Usage:
 * node testEmailService.js
 * 
 * or with a specific test email:
 * node testEmailService.js test@example.com
 */

async function runEmailTest() {
  console.log('🚀 Starting Email Service Test...\n');
  
  try {
    // Get test email from command line argument or use default
    const testEmail = process.argv[2] || null;
    
    if (testEmail) {
      console.log(`🎯 Using custom test email: ${testEmail}`);
    } else {
      console.log('📧 Using default email from EMAIL_USER environment variable');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('           EMAIL SERVICE INITIALIZATION TEST');
    console.log('='.repeat(60));
    
    // Test initialization
    const initResult = await initializeEmailService();
    
    if (!initResult.success) {
      console.error('❌ Email service initialization failed!');
      console.error(`Error: ${initResult.error}`);
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('              EMAIL SENDING TEST');
    console.log('='.repeat(60));
    
    // Test sending email
    const emailResult = await testLoginEmailService(testEmail);
    
    if (emailResult.success) {
      console.log('\n🎉 EMAIL TEST COMPLETED SUCCESSFULLY!');
      console.log(`✅ Message ID: ${emailResult.messageId}`);
      console.log(`📧 Sent to: ${emailResult.recipient}`);
      console.log(`🕐 Timestamp: ${emailResult.timestamp}`);
      console.log('\n💡 Check your email inbox to verify the email was received.');
    } else {
      console.log('\n❌ EMAIL TEST FAILED!');
      console.log(`Error: ${emailResult.error}`);
      console.log(`Code: ${emailResult.code || 'N/A'}`);
      
      // Provide troubleshooting tips
      console.log('\n🔍 TROUBLESHOOTING TIPS:');
      console.log('1. Check your .env file has EMAIL_USER and EMAIL_PASSWORD set');
      console.log('2. Verify your Gmail app password is correct');
      console.log('3. Ensure 2-step verification is enabled in Gmail');
      console.log('4. Check your internet connection');
      console.log('5. Try running the test again in a few minutes');
    }
    
  } catch (error) {
    console.error('\n💥 UNEXPECTED ERROR OCCURRED:');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('              TEST COMPLETED');
  console.log('='.repeat(60));
}

// Check environment variables before starting
function checkEnvironment() {
  console.log('🔍 Checking environment variables...\n');
  
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
      console.log(`❌ ${varName}: Not set`);
    } else {
      console.log(`✅ ${varName}: ${varName === 'EMAIL_PASSWORD' ? '*'.repeat(value.length) : value}`);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file and ensure these variables are set.');
    process.exit(1);
  }
  
  console.log('\n✅ All required environment variables are present\n');
}

// Main execution
async function main() {
  console.log('🔧 ACE CSE Leave Portal - Email Service Test');
  console.log('=' * 50);
  
  checkEnvironment();
  await runEmailTest();
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the test
main().catch(error => {
  console.error('❌ Failed to run email test:', error);
  process.exit(1);
});
