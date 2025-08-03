import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';

async function checkUsers() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully!');
    
    // Check users table
    console.log('\n=== Users Table ===');
    const [users] = await connection.execute('SELECT id, email, first_name, last_name, is_admin, is_tutor FROM users LIMIT 10');
    console.log('Found users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.first_name} ${user.last_name}) - Admin: ${user.is_admin}, Tutor: ${user.is_tutor}`);
    });
    
    // Check students table
    console.log('\n=== Students Table ===');
    const [students] = await connection.execute('SELECT id, email, name, register_number FROM students LIMIT 5');
    console.log('Found students:', students.length);
    students.forEach(student => {
      console.log(`- ${student.email} (${student.name}) - Reg: ${student.register_number}`);
    });
    
    // Check staff table
    console.log('\n=== Staff Table ===');
    const [staff] = await connection.execute('SELECT id, email, name, username, is_admin, is_tutor FROM staff LIMIT 5');
    console.log('Found staff:', staff.length);
    staff.forEach(staffMember => {
      console.log(`- ${staffMember.email} (${staffMember.name}) - Username: ${staffMember.username} - Admin: ${staffMember.is_admin}, Tutor: ${staffMember.is_tutor}`);
    });
    
    // Check OD requests
    console.log('\n=== OD Requests Table ===');
    const [odRequests] = await connection.execute('SELECT id, student_name, status, certificate_status FROM od_requests LIMIT 3');
    console.log('Found OD requests:', odRequests.length);
    odRequests.forEach(od => {
      console.log(`- ID: ${od.id}, Student: ${od.student_name}, Status: ${od.status}, Cert Status: ${od.certificate_status}`);
    });
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

checkUsers();
