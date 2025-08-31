import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';

async function addMobileColumn() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully!');
    
    // Check if mobile column already exists
    console.log('Checking if mobile column exists...');
    const [columns] = await connection.execute('DESCRIBE staff');
    const mobileColumn = columns.find(col => col.Field === 'mobile');
    
    if (mobileColumn) {
      console.log('✅ Mobile column already exists in staff table');
    } else {
      console.log('Adding mobile column to staff table...');
      await connection.execute(`
        ALTER TABLE staff 
        ADD COLUMN mobile VARCHAR(20) DEFAULT NULL COMMENT 'Mobile phone number'
        AFTER username
      `);
      console.log('✅ Mobile column added successfully!');
    }
    
    // Verify the column was added
    console.log('\n=== Updated Staff Table Structure ===');
    const [updatedColumns] = await connection.execute('DESCRIBE staff');
    updatedColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

addMobileColumn();
