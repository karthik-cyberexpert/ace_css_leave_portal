import { sendLoginNotification } from './utils/loginEmailServiceDev.js';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'college_portal',
  port: process.env.DB_PORT || 3306
};

async function testRealLogin() {
  console.log('🔐 Testing Real Login Process...\n');
  
  // Test credentials provided
  const testEmail = 'karthisathya308@gmail.com';
  const testPassword = '1234567890';
  
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password: [REDACTED]');
  console.log('🔧 Database Config:');
  console.log('   Host:', dbConfig.host);
  console.log('   Database:', dbConfig.database);
  console.log('   Port:', dbConfig.port);
  console.log('');
  
  let connection;
  
  try {
    // Connect to database
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully!');
    
    // Step 1: Find user by email
    console.log('\n👤 Step 1: Looking up user by email...');
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [testEmail]);
    
    if (users.length === 0) {
      console.log('❌ User not found in database');
      console.log('💡 Available users:');
      const [allUsers] = await connection.execute('SELECT id, email, first_name, last_name, is_admin, is_tutor FROM users LIMIT 5');
      allUsers.forEach(user => {
        console.log(`   ${user.email} - ${user.first_name} ${user.last_name} (Admin: ${user.is_admin}, Tutor: ${user.is_tutor})`);
      });
      return;
    }
    
    const user = users[0];
    console.log('✅ User found:', user.email);
    console.log('   ID:', user.id);
    console.log('   Name:', user.first_name, user.last_name);
    console.log('   Is Admin:', user.is_admin);
    console.log('   Is Tutor:', user.is_tutor);
    
    // Step 2: Verify password
    console.log('\n🔐 Step 2: Verifying password...');
    const validPassword = await bcrypt.compare(testPassword, user.password_hash);
    
    if (!validPassword) {
      console.log('❌ Invalid password');
      console.log('🔑 Password hash in DB:', user.password_hash.substring(0, 20) + '...');
      return;
    }
    
    console.log('✅ Password verified successfully!');
    
    // Step 3: Get user display name
    console.log('\n📝 Step 3: Getting user display name...');
    let userName = user.email; // Default to email
    
    if (user.is_admin || user.is_tutor) {
      // For staff, get their name from staff table
      try {
        const [staff] = await connection.execute('SELECT name FROM staff WHERE id = ?', [user.id]);
        if (staff.length > 0) {
          userName = staff[0].name;
          console.log('✅ Staff name found:', userName);
        } else {
          console.log('⚠️  Staff record not found, using default name');
          userName = `${user.first_name} ${user.last_name}`;
        }
      } catch (staffError) {
        console.log('⚠️  Could not get staff name:', staffError.message);
        userName = `${user.first_name} ${user.last_name}`;
      }
    } else {
      // For students, get their name from students table
      try {
        const [student] = await connection.execute('SELECT name FROM students WHERE id = ?', [user.id]);
        if (student.length > 0) {
          userName = student[0].name;
          console.log('✅ Student name found:', userName);
        } else {
          console.log('⚠️  Student record not found, using default name');
          userName = `${user.first_name} ${user.last_name}`;
        }
      } catch (studentError) {
        console.log('⚠️  Could not get student name:', studentError.message);
        userName = `${user.first_name} ${user.last_name}`;
      }
    }
    
    // Step 4: Prepare login details
    console.log('\n🌐 Step 4: Preparing login details...');
    const loginDetails = {
      ipAddress: '192.168.46.89',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    console.log('   IP Address:', loginDetails.ipAddress);
    console.log('   User Agent:', loginDetails.userAgent.substring(0, 50) + '...');
    
    // Step 5: Send login notification email
    console.log('\n📧 Step 5: Sending login notification email...');
    console.log('   Original Recipient:', user.email);
    console.log('   User Name:', userName);
    console.log('   Attempting to send email...');
    
    const emailResult = await sendLoginNotification(user.email, userName, loginDetails);
    
    if (emailResult && emailResult.success) {
      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      console.log('   📨 Message ID:', emailResult.messageId);
      console.log('   📬 Original Recipient:', emailResult.originalRecipient);
      console.log('   📬 Actual Recipient:', emailResult.actualRecipient);
      console.log('   🔄 Redirected:', emailResult.redirected ? 'YES' : 'NO');
      
      if (emailResult.redirected) {
        console.log('');
        console.log('🎯 SUCCESS: Email was redirected to admin account!');
        console.log('📧 Check your Gmail:', emailResult.actualRecipient);
        console.log('💌 You should receive an email with [DEV] prefix');
      } else {
        console.log('');
        console.log('⚠️  Email was sent to original address (not redirected)');
      }
      
    } else {
      console.log('❌ EMAIL SENDING FAILED');
      console.log('   Error:', emailResult?.error || 'Unknown error');
      console.log('   Code:', emailResult?.code || 'Unknown');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testRealLogin()
  .then(() => {
    console.log('\n✅ Real login test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
