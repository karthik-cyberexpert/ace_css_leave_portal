import mysql from 'mysql2/promise';
import { dbConfig } from './backend/config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.production') });

console.log('=== Database Connection Test ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database Config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password ? dbConfig.password.substring(0, 3) + '***' : 'NOT SET',
  database: dbConfig.database,
  port: dbConfig.port
});

async function testDatabaseConnection() {
  let connection = null;
  
  try {
    console.log('\n🔄 Testing database connection...');
    
    // Test basic connection
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    });
    
    console.log('✅ Database connection established successfully!');
    
    // Test basic query
    console.log('\n🔄 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as `current_time`');
    console.log('✅ Basic query successful:', rows[0]);
    
    // Test tables existence
    console.log('\n🔄 Checking required tables...');
    const requiredTables = [
      'users', 'students', 'staff', 'leave_requests', 
      'od_requests', 'user_sessions', 'batches'
    ];
    
    for (const tableName of requiredTables) {
      try {
        const [tableRows] = await connection.execute(
          'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
          [dbConfig.database, tableName]
        );
        
        if (tableRows[0].count > 0) {
          const [countRows] = await connection.execute(`SELECT COUNT(*) as records FROM ${tableName}`);
          console.log(`✅ Table '${tableName}' exists with ${countRows[0].records} records`);
        } else {
          console.log(`❌ Table '${tableName}' does not exist`);
        }
      } catch (tableError) {
        console.log(`❌ Error checking table '${tableName}':`, tableError.message);
      }
    }
    
    // Test pool connection
    console.log('\n🔄 Testing connection pool...');
    const pool = mysql.createPool(dbConfig);
    
    try {
      const [poolRows] = await pool.execute('SELECT CONNECTION_ID() as connection_id');
      console.log('✅ Connection pool working:', poolRows[0]);
      
      // Test multiple concurrent connections
      console.log('\n🔄 Testing concurrent connections...');
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(pool.execute('SELECT ? as connection_num, CONNECTION_ID() as id', [i + 1]));
      }
      
      const results = await Promise.all(promises);
      console.log('✅ All concurrent connections successful');
      results.forEach((result, index) => {
        console.log(`   Connection ${index + 1}:`, result[0][0]);
      });
      
      await pool.end();
    } catch (poolError) {
      console.log('❌ Connection pool error:', poolError.message);
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.log('\n❌ Database connection failed:');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Error details:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Make sure MySQL server is running');
      console.log(`2. Check if MySQL is running on port ${dbConfig.port}`);
      console.log('3. Verify firewall settings');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check database username and password');
      console.log('2. Verify user permissions in MySQL');
      console.log('3. Make sure user can connect from this host');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Possible solutions:');
      console.log(`1. Create the database '${dbConfig.database}'`);
      console.log('2. Check database name spelling');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
