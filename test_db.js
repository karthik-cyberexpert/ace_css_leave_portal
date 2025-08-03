import mysql from 'mysql2/promise';
import { dbConfig } from './backend/config/database.js';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Test basic connection
    console.log('✅ Database connection successful');
    
    // Test if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Found tables:', tables.map(t => Object.values(t)[0]));
    
    // Test user count
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users count:', users[0].count);
    
    // Test staff count
    const [staff] = await connection.execute('SELECT COUNT(*) as count FROM staff');
    console.log('✅ Staff count:', staff[0].count);
    
    // Test students count
    const [students] = await connection.execute('SELECT COUNT(*) as count FROM students');
    console.log('✅ Students count:', students[0].count);
    
    await connection.end();
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
