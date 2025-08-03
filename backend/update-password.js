import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';
import bcrypt from 'bcryptjs';

async function updatePassword(email, newPassword) {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [result] = await connection.execute('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);
    
    if (result.affectedRows > 0) {
      console.log(`Password for ${email} updated successfully.`);
    } else {
      console.log(`User with email ${email} not found.`);
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

updatePassword('test@gmail.com', 'password');
