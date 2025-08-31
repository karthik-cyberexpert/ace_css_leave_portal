const fs = require('fs');
const path = require('path');

// Database connection configuration
// Update these values according to your database setup
const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'your_username',
  password: 'your_password',
  database: 'your_database_name'
};

// Choose your database type: 'mysql', 'postgresql', or 'sqlite'
const dbType = 'mysql';

async function runMigration() {
  console.log('🚀 Starting staff assignment columns migration...');
  console.log(`📊 Database Type: ${dbType}`);
  console.log(`🔗 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`💾 Database: ${dbConfig.database}`);

  let db;

  try {
    // Import appropriate database library based on type
    if (dbType === 'mysql') {
      const mysql = require('mysql2/promise');
      db = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database
      });
    } else if (dbType === 'postgresql') {
      const { Client } = require('pg');
      db = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database
      });
      await db.connect();
    } else if (dbType === 'sqlite') {
      const sqlite3 = require('sqlite3').verbose();
      const { open } = require('sqlite');
      db = await open({
        filename: dbConfig.database, // For SQLite, this should be the file path
        driver: sqlite3.Database
      });
    } else {
      throw new Error(`Unsupported database type: ${dbType}`);
    }

    console.log('✅ Connected to database successfully!');

    // Check if columns already exist
    console.log('🔍 Checking if assigned_batch and assigned_semester columns already exist...');
    
    let columnCheckQuery;
    if (dbType === 'mysql') {
      columnCheckQuery = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${dbConfig.database}' 
          AND TABLE_NAME = 'staff' 
          AND COLUMN_NAME IN ('assigned_batch', 'assigned_semester')
      `;
    } else if (dbType === 'postgresql') {
      columnCheckQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'staff' 
          AND column_name IN ('assigned_batch', 'assigned_semester')
      `;
    } else if (dbType === 'sqlite') {
      // SQLite uses PRAGMA table_info
      columnCheckQuery = "PRAGMA table_info(staff)";
    }

    const existingColumns = await db.query ? 
      (await db.query(columnCheckQuery))[0] : 
      await db.all(columnCheckQuery);

    let hasAssignedBatch = false;
    let hasAssignedSemester = false;

    if (dbType === 'sqlite') {
      // For SQLite, check the pragma results
      hasAssignedBatch = existingColumns.some(col => col.name === 'assigned_batch');
      hasAssignedSemester = existingColumns.some(col => col.name === 'assigned_semester');
    } else {
      // For MySQL/PostgreSQL
      const columnNames = existingColumns.map(row => 
        row.COLUMN_NAME || row.column_name
      );
      hasAssignedBatch = columnNames.includes('assigned_batch');
      hasAssignedSemester = columnNames.includes('assigned_semester');
    }

    console.log(`📋 assigned_batch column exists: ${hasAssignedBatch}`);
    console.log(`📋 assigned_semester column exists: ${hasAssignedSemester}`);

    // Add assigned_batch column if it doesn't exist
    if (!hasAssignedBatch) {
      console.log('➕ Adding assigned_batch column...');
      const addBatchColumnQuery = dbType === 'sqlite' ? 
        'ALTER TABLE staff ADD COLUMN assigned_batch VARCHAR(50) DEFAULT NULL' :
        'ALTER TABLE staff ADD COLUMN assigned_batch VARCHAR(50) DEFAULT NULL';
      
      await (db.query ? db.query(addBatchColumnQuery) : db.run(addBatchColumnQuery));
      console.log('✅ assigned_batch column added successfully!');
    } else {
      console.log('ℹ️ assigned_batch column already exists, skipping...');
    }

    // Add assigned_semester column if it doesn't exist
    if (!hasAssignedSemester) {
      console.log('➕ Adding assigned_semester column...');
      const addSemesterColumnQuery = dbType === 'sqlite' ? 
        'ALTER TABLE staff ADD COLUMN assigned_semester INTEGER DEFAULT NULL' :
        'ALTER TABLE staff ADD COLUMN assigned_semester INTEGER DEFAULT NULL';
      
      await (db.query ? db.query(addSemesterColumnQuery) : db.run(addSemesterColumnQuery));
      console.log('✅ assigned_semester column added successfully!');
    } else {
      console.log('ℹ️ assigned_semester column already exists, skipping...');
    }

    // Create indexes for better performance (only if columns were added)
    if (!hasAssignedBatch || !hasAssignedSemester) {
      console.log('📊 Creating indexes for better query performance...');
      
      try {
        if (!hasAssignedBatch) {
          const batchIndexQuery = 'CREATE INDEX idx_staff_assigned_batch ON staff(assigned_batch)';
          await (db.query ? db.query(batchIndexQuery) : db.run(batchIndexQuery));
          console.log('✅ Index on assigned_batch created!');
        }

        if (!hasAssignedSemester) {
          const semesterIndexQuery = 'CREATE INDEX idx_staff_assigned_semester ON staff(assigned_semester)';
          await (db.query ? db.query(semesterIndexQuery) : db.run(semesterIndexQuery));
          console.log('✅ Index on assigned_semester created!');
        }
      } catch (indexError) {
        console.warn('⚠️ Warning: Could not create indexes (they may already exist):', indexError.message);
      }
    }

    // Verify the changes by showing table structure
    console.log('🔍 Verifying table structure...');
    let verifyQuery;
    if (dbType === 'mysql') {
      verifyQuery = `
        SELECT 
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          IS_NULLABLE as is_nullable,
          COLUMN_DEFAULT as column_default
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${dbConfig.database}' 
          AND TABLE_NAME = 'staff' 
        ORDER BY ORDINAL_POSITION
      `;
    } else if (dbType === 'postgresql') {
      verifyQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'staff' 
        ORDER BY ordinal_position
      `;
    } else if (dbType === 'sqlite') {
      verifyQuery = "PRAGMA table_info(staff)";
    }

    const tableStructure = await (db.query ? 
      (await db.query(verifyQuery))[0] : 
      await db.all(verifyQuery));

    console.log('\n📋 Current staff table structure:');
    console.log('----------------------------------------');
    if (dbType === 'sqlite') {
      tableStructure.forEach(col => {
        console.log(`${col.name.padEnd(20)} | ${col.type.padEnd(15)} | ${col.notnull ? 'NOT NULL' : 'NULLABLE'.padEnd(8)} | ${col.dflt_value || 'NULL'}`);
      });
    } else {
      tableStructure.forEach(col => {
        console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable.padEnd(8)} | ${col.column_default || 'NULL'}`);
      });
    }

    // Show sample of staff records with new columns
    console.log('\n👥 Sample staff records with new columns:');
    console.log('----------------------------------------');
    const sampleQuery = 'SELECT id, name, email, is_tutor, assigned_batch, assigned_semester FROM staff WHERE is_tutor = true LIMIT 5';
    const sampleRecords = await (db.query ? 
      (await db.query(sampleQuery))[0] : 
      await db.all(sampleQuery));

    if (sampleRecords.length > 0) {
      console.log('ID'.padEnd(10) + 'Name'.padEnd(20) + 'Email'.padEnd(25) + 'Batch'.padEnd(15) + 'Semester');
      console.log('-'.repeat(75));
      sampleRecords.forEach(record => {
        console.log(
          (record.id || '').toString().padEnd(10) +
          (record.name || '').padEnd(20) +
          (record.email || '').padEnd(25) +
          (record.assigned_batch || 'NULL').padEnd(15) +
          (record.assigned_semester || 'NULL')
        );
      });
    } else {
      console.log('No tutor records found in the database.');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now assign batches to tutors without errors.');
    console.log('🔧 The frontend should now work properly for tutor batch assignments.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📝 Full error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (db) {
      try {
        if (dbType === 'mysql' || dbType === 'postgresql') {
          await db.end();
        } else if (dbType === 'sqlite') {
          await db.close();
        }
        console.log('🔌 Database connection closed.');
      } catch (closeError) {
        console.warn('⚠️ Warning: Error closing database connection:', closeError.message);
      }
    }
  }
}

// Configuration instructions
console.log('📖 MIGRATION SETUP INSTRUCTIONS:');
console.log('================================');
console.log('1. Install required database driver:');
console.log('   For MySQL: npm install mysql2');
console.log('   For PostgreSQL: npm install pg');
console.log('   For SQLite: npm install sqlite3 sqlite');
console.log('');
console.log('2. Update the dbConfig object above with your database credentials');
console.log('3. Set the correct dbType variable (mysql, postgresql, or sqlite)');
console.log('4. Run: node migrate_staff_columns.js');
console.log('');
console.log('🔐 Make sure you have database admin privileges to ALTER tables');
console.log('💾 Consider backing up your database before running this migration');
console.log('');

// Run the migration
runMigration();
