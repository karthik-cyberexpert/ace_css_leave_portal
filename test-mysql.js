import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('.env') });

const configs = [
  {
    name: "From .env file",
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'cyber_security_leave_portal',
    port: parseInt(process.env.DB_PORT) || 3307
  },
  {
    name: "Alternative 1 (no password)",
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cyber_security_leave_portal',
    port: 3307
  },
  {
    name: "Alternative 2 (root/root)",
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cyber_security_leave_portal',
    port: 3307
  },
  {
    name: "Alternative 3 (different password)",
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'cyber_security_leave_portal',
    port: 3307
  }
];

async function testMySQLConnection() {
  console.log('Testing MySQL connection with different configurations...\n');
  
  for (const config of configs) {
    console.log(`Testing: ${config.name}`);
    console.log(`  Host: ${config.host}:${config.port}`);
    console.log(`  User: ${config.user}`);
    console.log(`  Password: ${config.password ? '[SET]' : '[EMPTY]'}`);
    console.log(`  Database: ${config.database}`);
    
    try {
      const connection = await mysql.createConnection(config);
      console.log('  ✅ Connection successful!');
      
      // Test a simple query
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`  📊 Users in database: ${rows[0].count}`);
      
      await connection.end();
      console.log(`  🎉 ${config.name} WORKS!\n`);
      return config;
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
      console.log(`  Error code: ${error.code}\n`);
    }
  }
  
  console.log('❌ All connection attempts failed!');
  return null;
}

testMySQLConnection()
  .then(workingConfig => {
    if (workingConfig) {
      console.log('🎯 Use this configuration in your .env file:');
      console.log(`DB_HOST=${workingConfig.host}`);
      console.log(`DB_USER=${workingConfig.user}`);
      console.log(`DB_PASSWORD=${workingConfig.password}`);
      console.log(`DB_NAME=${workingConfig.database}`);
      console.log(`DB_PORT=${workingConfig.port}`);
    }
  })
  .catch(console.error);
