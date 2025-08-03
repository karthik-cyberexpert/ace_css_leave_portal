import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';

async function verifyDatabase() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Check the updated OD request
    const [odRequests] = await connection.execute(
      'SELECT id, student_name, certificate_url, certificate_status FROM od_requests WHERE id = ?',
      ['63621206-c197-430c-be74-4261b51af089']
    );
    
    console.log('OD Request after upload:');
    console.log(JSON.stringify(odRequests[0], null, 2));
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

verifyDatabase();
