import mysql from 'mysql2/promise';

async function deleteBatch() {
  const batchIdToDelete = process.argv[2];
  
  if (!batchIdToDelete) {
    console.log('Usage: node delete-batch.js <batch_id>');
    console.log('Example: node delete-batch.js 2022');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'cyber_security_leave_portal'
    });
    console.log('Connected to database');

    // First, show current batches
    console.log('\n📋 Current batches in database:');
    const [batches] = await connection.execute('SELECT * FROM batches ORDER BY start_year');
    batches.forEach(batch => {
      console.log(`- ID: ${batch.id}, Name: ${batch.name}, Active: ${batch.is_active ? 'Yes' : 'No'}`);
    });

    // Check if the batch exists
    const [existingBatch] = await connection.execute('SELECT * FROM batches WHERE id = ?', [batchIdToDelete]);
    if (existingBatch.length === 0) {
      console.log(`\n❌ Batch with ID '${batchIdToDelete}' not found.`);
      await connection.end();
      return;
    }

    const batch = existingBatch[0];
    console.log(`\n🎯 Found batch: ${batch.name} (ID: ${batch.id})`);

    // Check for dependencies
    console.log('\n🔍 Checking for dependencies...');
    
    // Check students
    const [studentsInBatch] = await connection.execute('SELECT COUNT(*) as count FROM students WHERE batch = ?', [batchIdToDelete]);
    if (studentsInBatch[0].count > 0) {
      console.log(`⚠️  Warning: ${studentsInBatch[0].count} students are assigned to this batch.`);
    }

    // Check leave requests
    const [leaveRequests] = await connection.execute('SELECT COUNT(*) as count FROM leave_requests WHERE student_id IN (SELECT id FROM students WHERE batch = ?)', [batchIdToDelete]);
    if (leaveRequests[0].count > 0) {
      console.log(`⚠️  Warning: ${leaveRequests[0].count} leave requests are associated with students in this batch.`);
    }

    // Check OD requests
    const [odRequests] = await connection.execute('SELECT COUNT(*) as count FROM od_requests WHERE student_id IN (SELECT id FROM students WHERE batch = ?)', [batchIdToDelete]);
    if (odRequests[0].count > 0) {
      console.log(`⚠️  Warning: ${odRequests[0].count} OD requests are associated with students in this batch.`);
    }

    const totalDependencies = studentsInBatch[0].count + leaveRequests[0].count + odRequests[0].count;

    if (totalDependencies > 0) {
      console.log(`\n❌ Cannot delete batch '${batch.name}' because it has ${totalDependencies} dependencies.`);
      console.log('To delete this batch, you must first:');
      if (studentsInBatch[0].count > 0) {
        console.log(`  1. Move or delete ${studentsInBatch[0].count} students`);
      }
      if (leaveRequests[0].count > 0) {
        console.log(`  2. Handle ${leaveRequests[0].count} leave requests`);
      }
      if (odRequests[0].count > 0) {
        console.log(`  3. Handle ${odRequests[0].count} OD requests`);
      }
      console.log('\nUse --force flag to delete anyway (WARNING: This will cause data integrity issues!)');
      
      // Check for force flag
      if (process.argv.includes('--force')) {
        console.log('\n⚠️  FORCE MODE: Proceeding with deletion despite dependencies...');
      } else {
        await connection.end();
        return;
      }
    }

    // Proceed with deletion
    console.log(`\n🗑️  Deleting batch '${batch.name}' (ID: ${batch.id})...`);
    
    const [result] = await connection.execute('DELETE FROM batches WHERE id = ?', [batchIdToDelete]);
    
    if (result.affectedRows > 0) {
      console.log(`✅ Successfully deleted batch '${batch.name}'`);
    } else {
      console.log(`❌ Failed to delete batch '${batch.name}'`);
    }

    // Show updated batches list
    console.log('\n📋 Updated batches in database:');
    const [updatedBatches] = await connection.execute('SELECT * FROM batches ORDER BY start_year');
    if (updatedBatches.length === 0) {
      console.log('  (No batches remaining)');
    } else {
      updatedBatches.forEach(batch => {
        console.log(`- ID: ${batch.id}, Name: ${batch.name}, Active: ${batch.is_active ? 'Yes' : 'No'}`);
      });
    }

    await connection.end();
    console.log('\n✅ Operation completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Show help if no arguments
if (process.argv.length < 3) {
  console.log('🗑️  Batch Deletion Tool');
  console.log('=====================');
  console.log('Usage: node delete-batch.js <batch_id> [--force]');
  console.log('');
  console.log('Examples:');
  console.log('  node delete-batch.js 2022        # Delete batch with ID "2022"');
  console.log('  node delete-batch.js 2023 --force # Force delete even with dependencies');
  console.log('');
  console.log('Available batch IDs:');
  
  // Show available batches
  (async () => {
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'cyber_security_leave_portal'
      });
      
      const [batches] = await connection.execute('SELECT * FROM batches ORDER BY start_year');
      if (batches.length === 0) {
        console.log('  (No batches found in database)');
      } else {
        batches.forEach(batch => {
          console.log(`  - ${batch.id} (${batch.name}) - ${batch.is_active ? 'Active' : 'Inactive'}`);
        });
      }
      
      await connection.end();
    } catch (error) {
      console.error('Error connecting to database:', error.message);
    }
  })();
} else {
  deleteBatch();
}
