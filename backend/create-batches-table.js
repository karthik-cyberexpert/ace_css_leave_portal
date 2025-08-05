import mysql from 'mysql2/promise';

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'cyber_security_leave_portal'
    });
    console.log('Connected to database');
    
    // Create batches table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS batches (
        id varchar(36) NOT NULL,
        start_year int NOT NULL,
        end_year int NOT NULL,
        name varchar(50) NOT NULL,
        is_active tinyint(1) NOT NULL DEFAULT 1,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_start_year (start_year),
        UNIQUE KEY unique_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Created batches table');
    
    // Insert batches based on existing student data
    await connection.execute(`
      INSERT IGNORE INTO batches (id, start_year, end_year, name, is_active)
      SELECT 
          batch as id,
          CAST(batch as UNSIGNED) as start_year,
          CAST(batch as UNSIGNED) + 4 as end_year,
          CONCAT(batch, '-', CAST(batch as UNSIGNED) + 4) as name,
          1 as is_active
      FROM (
          SELECT DISTINCT batch 
          FROM students 
          WHERE batch IS NOT NULL 
          AND batch != ''
      ) as distinct_batches
    `);
    console.log('Inserted batches from student data');
    
    // Add additional default batches
    const additionalBatches = [
      ['2025', 2025, 2029, '2025-2029', 1],
      ['2026', 2026, 2030, '2026-2030', 1],
      ['2023', 2023, 2027, '2023-2027', 1],
      ['2022', 2022, 2026, '2022-2026', 1]
    ];
    
    for (const batch of additionalBatches) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO batches (id, start_year, end_year, name, is_active) VALUES (?, ?, ?, ?, ?)',
          batch
        );
      } catch (err) {
        // Ignore duplicate key errors
        if (!err.message.includes('Duplicate entry')) {
          throw err;
        }
      }
    }
    console.log('Added additional batches');
    
    // Add index to students table
    try {
      await connection.execute('ALTER TABLE students ADD INDEX idx_batch_fk (batch)');
      console.log('Added batch index to students table');
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.log('Index may already exist:', err.message);
      }
    }
    
    // Verify the results
    const [batches] = await connection.execute('SELECT * FROM batches ORDER BY start_year');
    console.log('\nCreated batches:');
    batches.forEach(batch => {
      console.log(`- ${batch.name} (ID: ${batch.id}, active: ${batch.is_active})`);
    });
    
    await connection.end();
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
    console.error(error.stack);
  }
}

runMigration();
