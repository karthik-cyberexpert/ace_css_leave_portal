import mysql from 'mysql2/promise';

// Database configuration - Update with your actual database credentials
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Karthy01*02', // Replace with your actual password
  database: 'cyber_security_leave_portal'
};

async function checkAndAddDurationTypeColumn() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check if duration_type column exists in leave_requests table
    const [leaveColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [dbConfig.database, 'leave_requests', 'duration_type']);

    if (leaveColumns.length === 0) {
      console.log('❌ duration_type column does NOT exist in leave_requests table');
      console.log('🔧 Adding duration_type column to leave_requests table...');
      
      await connection.execute(`
        ALTER TABLE leave_requests 
        ADD COLUMN duration_type ENUM('full_day', 'half_day_forenoon', 'half_day_afternoon') NOT NULL DEFAULT 'full_day' COMMENT 'Leave duration type'
        AFTER total_days
      `);
      
      await connection.execute(`
        ALTER TABLE leave_requests 
        ADD INDEX idx_leave_duration_type (duration_type)
      `);
      
      console.log('✅ Added duration_type column to leave_requests table');
    } else {
      console.log('✅ duration_type column exists in leave_requests table');
      console.log('   Column details:', leaveColumns[0]);
    }

    // Check if duration_type column exists in od_requests table  
    const [odColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [dbConfig.database, 'od_requests', 'duration_type']);

    if (odColumns.length === 0) {
      console.log('❌ duration_type column does NOT exist in od_requests table');
      console.log('🔧 Adding duration_type column to od_requests table...');
      
      await connection.execute(`
        ALTER TABLE od_requests 
        ADD COLUMN duration_type ENUM('full_day', 'half_day_forenoon', 'half_day_afternoon') NOT NULL DEFAULT 'full_day' COMMENT 'OD duration type'
        AFTER total_days
      `);
      
      await connection.execute(`
        ALTER TABLE od_requests 
        ADD INDEX idx_od_duration_type (duration_type)
      `);
      
      console.log('✅ Added duration_type column to od_requests table');
    } else {
      console.log('✅ duration_type column exists in od_requests table');
      console.log('   Column details:', odColumns[0]);
    }

    // Check for any existing leave requests with total_days = 0
    const [zeroLeaves] = await connection.execute(`
      SELECT id, student_name, start_date, end_date, total_days, 
             IFNULL(duration_type, 'full_day') as current_duration_type
      FROM leave_requests 
      WHERE total_days = 0
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (zeroLeaves.length > 0) {
      console.log('⚠️  Found leave requests with total_days = 0:');
      zeroLeaves.forEach(leave => {
        console.log(`   - ${leave.student_name}: ${leave.start_date} to ${leave.end_date} (${leave.total_days} days, ${leave.current_duration_type})`);
      });

      // Check if these are same-day requests that should be 0.5 for half-days
      console.log('🔍 Analyzing zero-day leaves...');
      for (const leave of zeroLeaves) {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        const isSameDay = startDate.getTime() === endDate.getTime();
        
        if (isSameDay && (leave.current_duration_type === 'half_day_forenoon' || leave.current_duration_type === 'half_day_afternoon')) {
          console.log(`   🔧 Fixing: ${leave.student_name} should have 0.5 days for half-day leave`);
          
          // Update the total_days for this half-day leave
          await connection.execute(`
            UPDATE leave_requests 
            SET total_days = 0.5 
            WHERE id = ? AND total_days = 0
          `, [leave.id]);
          
          console.log(`   ✅ Updated leave request ${leave.id} to 0.5 days`);
        }
      }
    } else {
      console.log('✅ No leave requests with total_days = 0 found');
    }

    console.log('🎉 Database schema check and fixes completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Database access denied. Please check your credentials in the dbConfig.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️  Database does not exist. Please check the database name.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the check
checkAndAddDurationTypeColumn();
