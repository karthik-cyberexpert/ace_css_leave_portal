import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: path.resolve('../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'cyber_security_leave_portal'
};

console.log('🔍 === USER CREDENTIALS CHECK ===');
console.log('📧 Checking user: karthisathya308@gmail.com');
console.log('🔑 Expected password: 1234567890');
console.log('🗄️ Database:', dbConfig.database);
console.log('⏰ Check Time:', new Date().toISOString());
console.log('================================\n');

async function checkUserCredentials() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    const testEmail = 'karthisathya308@gmail.com';
    const testPassword = '1234567890';
    
    // Check if user exists
    console.log('1️⃣ Checking if user exists in users table...');
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [testEmail]);
    
    if (users.length === 0) {
      console.log('❌ User not found in users table');
      console.log('💡 Let\'s create the user...\n');
      
      await createTestUser(connection, testEmail, testPassword);
      
    } else {
      const user = users[0];
      console.log('✅ User found in users table');
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   First Name:', user.first_name);
      console.log('   Last Name:', user.last_name);
      console.log('   Is Admin:', user.is_admin ? 'Yes' : 'No');
      console.log('   Is Tutor:', user.is_tutor ? 'Yes' : 'No');
      console.log('');
      
      // Check password
      console.log('2️⃣ Verifying password...');
      const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
      
      if (passwordMatch) {
        console.log('✅ Password matches! Login should work');
      } else {
        console.log('❌ Password does NOT match');
        console.log('💡 Let\'s update the password...\n');
        
        const newPasswordHash = await bcrypt.hash(testPassword, 10);
        await connection.execute(
          'UPDATE users SET password_hash = ? WHERE email = ?',
          [newPasswordHash, testEmail]
        );
        console.log('✅ Password updated successfully');
      }
      
      // Check if student record exists
      console.log('\n3️⃣ Checking student record...');
      const [students] = await connection.execute('SELECT * FROM students WHERE id = ?', [user.id]);
      
      if (students.length === 0) {
        console.log('❌ Student record not found');
        console.log('💡 Creating student record...\n');
        
        await createStudentRecord(connection, user.id, user.first_name + ' ' + (user.last_name || ''), testEmail);
        
      } else {
        const student = students[0];
        console.log('✅ Student record found');
        console.log('   Name:', student.name);
        console.log('   Register Number:', student.register_number);
        console.log('   Batch:', student.batch);
        console.log('   Tutor ID:', student.tutor_id || 'Not assigned');
      }
    }
    
    console.log('\n🎉 User setup completed! Login should now work.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

async function createTestUser(connection, email, password) {
  try {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('👤 Creating new user...');
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_tutor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, email, passwordHash, 'Karthi', 'Sathya', false, false]
    );
    
    console.log('✅ User created successfully');
    console.log('   User ID:', id);
    console.log('   Email:', email);
    
    await createStudentRecord(connection, id, 'Karthi Sathya', email);
    
  } catch (error) {
    console.error('❌ Failed to create user:', error.message);
    throw error;
  }
}

async function createStudentRecord(connection, userId, name, email) {
  try {
    console.log('🎓 Creating student record...');
    
    // Find a tutor to assign (get the first tutor available)
    const [tutors] = await connection.execute('SELECT id FROM users WHERE is_tutor = true LIMIT 1');
    const tutorId = tutors.length > 0 ? tutors[0].id : null;
    
    await connection.execute(
      'INSERT INTO students (id, name, register_number, email, tutor_id, batch, semester, mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, 'TEST123', email, tutorId, 'Test2025', 1, '9876543210']
    );
    
    console.log('✅ Student record created successfully');
    console.log('   Name:', name);
    console.log('   Register Number: TEST123');
    console.log('   Batch: Test2025');
    console.log('   Tutor ID:', tutorId || 'None assigned');
    
  } catch (error) {
    console.error('❌ Failed to create student record:', error.message);
    throw error;
  }
}

// Run the check
checkUserCredentials()
  .then(() => {
    console.log('\n🏁 Credential check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Credential check failed:', error);
    process.exit(1);
  });
