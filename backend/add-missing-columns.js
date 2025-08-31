import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';

async function addMissingColumns() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully!');
    
    // Add assigned_batch column
    try {
      await connection.execute(`
        ALTER TABLE staff 
        ADD COLUMN assigned_batch VARCHAR(4) DEFAULT NULL COMMENT 'Currently assigned batch'
        AFTER mobile
      `);
      console.log('✅ assigned_batch column added');
    } catch (e) {
      if (e.message.includes('Duplicate column name')) {
        console.log('assigned_batch column already exists');
      } else {
        console.log('Error adding assigned_batch:', e.message);
      }
    }

    // Add assigned_semester column
    try {
      await connection.execute(`
        ALTER TABLE staff 
        ADD COLUMN assigned_semester TINYINT DEFAULT NULL COMMENT 'Currently assigned semester'
        AFTER assigned_batch
      `);
      console.log('✅ assigned_semester column added');
    } catch (e) {
      if (e.message.includes('Duplicate column name')) {
        console.log('assigned_semester column already exists');
      } else {
        console.log('Error adding assigned_semester:', e.message);
      }
    }
    
    // Final verification
    console.log('\n=== Final Staff Table Structure ===');
    const [columns] = await connection.execute('DESCRIBE staff');
    columns.forEach(col => {
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

addMissingColumns();
