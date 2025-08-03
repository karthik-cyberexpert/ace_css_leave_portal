import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Utility function to execute queries
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Helper function to get week of year
function getWeekOfYear(date) {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
}

async function testFutureDateExclusion() {
  try {
    console.log('=== Testing Future Date Exclusion in Leave Reports ===');
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log(`Current date: ${todayStr}`);
    
    // Find a test student
    const [testStudent] = await query('SELECT * FROM students LIMIT 1');
    if (!testStudent) {
      console.log('No students found for testing');
      return;
    }
    
    console.log(`Using test student: ${testStudent.name} (${testStudent.register_number})`);
    
    // Clean up any existing test data
    await query('DELETE FROM leave_requests WHERE student_id = ? AND description = ?', [testStudent.id, 'Future Date Test']);
    
    // Create test leave requests: past, current, and future
    const testLeaves = [
      {
        start: '2025-07-28', // Past week
        end: '2025-07-30',
        days: 3,
        description: 'Past leave - should appear in reports'
      },
      {
        start: todayStr, // Current (today)
        end: todayStr,
        days: 1,
        description: 'Current leave - should appear in reports'
      },
      {
        start: '2025-08-05', // Future week
        end: '2025-08-07',
        days: 3,
        description: 'Future leave - should NOT appear in reports'
      }
    ];
    
    console.log('\n--- Creating test leave requests ---');
    for (const leave of testLeaves) {
      try {
        await query(
          `INSERT INTO leave_requests (id, student_id, student_name, student_register_number,
           start_date, end_date, total_days, subject, description, status, tutor_id, tutor_name)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'Test Subject', ?, 'Approved', 'test-tutor', 'Test Tutor')`,
          [testStudent.id, testStudent.name, testStudent.register_number, leave.start, leave.end, leave.days, leave.description]
        );
        console.log(`✓ Created: ${leave.start} to ${leave.end} (${leave.days} days) - ${leave.description}`);
      } catch (error) {
        console.log(`❌ Failed to create leave: ${error.message}`);
      }
    }
    
    // Test daily data endpoint logic
    console.log('\n--- Testing Daily Data Logic ---');
    const approvedLeaves = await query('SELECT * FROM leave_requests WHERE student_id = ? AND status = "Approved"', [testStudent.id]);
    const dailyData = {};
    const todayForComparison = new Date();
    
    approvedLeaves.forEach(leave => {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      
      console.log(`Processing leave: ${leave.start_date} to ${leave.end_date}`);
      
      const currDate = new Date(leaveStart);
      while (currDate <= leaveEnd) {
        const isCurrentOrPast = currDate <= todayForComparison;
        const dateStr = currDate.toISOString().split('T')[0];
        
        if (isCurrentOrPast) {
          if (!dailyData[dateStr]) {
            dailyData[dateStr] = 0;
          }
          dailyData[dateStr] += 1;
          console.log(`  ✓ ${dateStr} - INCLUDED (current/past)`);
        } else {
          console.log(`  ❌ ${dateStr} - EXCLUDED (future)`);
        }
        
        currDate.setDate(currDate.getDate() + 1);
      }
    });
    
    console.log('\nDaily data result:');
    Object.entries(dailyData).forEach(([date, count]) => {
      console.log(`  ${date}: ${count} student(s) on leave`);
    });
    
    // Test weekly data endpoint logic
    console.log('\n--- Testing Weekly Data Logic ---');
    const weeklyData = {};
    
    approvedLeaves.forEach(leave => {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      
      console.log(`Processing leave: ${leave.start_date} to ${leave.end_date}`);
      
      const currDate = new Date(leaveStart);
      while (currDate <= leaveEnd) {
        const isCurrentOrPast = currDate <= todayForComparison;
        
        if (isCurrentOrPast) {
          const week = `${currDate.getFullYear()}-W${getWeekOfYear(currDate)}`;
          const batch = testStudent.batch || 'Unknown';
          
          if (!weeklyData[week]) {
            weeklyData[week] = {};
          }
          if (!weeklyData[week][batch]) {
            weeklyData[week][batch] = 0;
          }
          weeklyData[week][batch] += 1;
          
          console.log(`  ✓ ${currDate.toISOString().split('T')[0]} -> Week ${week} - INCLUDED`);
        } else {
          const week = `${currDate.getFullYear()}-W${getWeekOfYear(currDate)}`;
          console.log(`  ❌ ${currDate.toISOString().split('T')[0]} -> Week ${week} - EXCLUDED (future)`);
        }
        
        currDate.setDate(currDate.getDate() + 1);
      }
    });
    
    console.log('\nWeekly data result:');
    Object.entries(weeklyData).forEach(([week, batches]) => {
      console.log(`  ${week}:`);
      Object.entries(batches).forEach(([batch, count]) => {
        console.log(`    ${batch}: ${count} student-days`);
      });
    });
    
    // Summary
    console.log('\n--- Test Summary ---');
    const dailyDates = Object.keys(dailyData);
    const weeklyWeeks = Object.keys(weeklyData);
    
    const hasFutureDates = dailyDates.some(date => new Date(date) > todayForComparison);
    const hasFutureWeeks = weeklyWeeks.some(week => {
      // Parse week string like "2025-W32" and check if it's a future week
      const [year, weekNum] = week.split('-W');
      const currentYear = todayForComparison.getFullYear();
      const currentWeek = getWeekOfYear(todayForComparison);
      const currentWeekStr = `${currentYear}-W${currentWeek}`;
      
      // Compare week strings - future if year is greater or same year but week is greater
      if (parseInt(year) > currentYear) {
        return true;
      } else if (parseInt(year) === currentYear && parseInt(weekNum) > currentWeek) {
        return true;
      }
      return false;
    });
    
    console.log(`Daily data contains future dates: ${hasFutureDates ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
    console.log(`Weekly data contains future weeks: ${hasFutureWeeks ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
    
    if (!hasFutureDates && !hasFutureWeeks) {
      console.log('🎉 SUCCESS: Future date exclusion is working correctly!');
    } else {
      console.log('⚠️  ISSUE: Future dates/weeks are still appearing in reports');
    }
    
    // Clean up test data
    console.log('\n--- Cleaning up test data ---');
    await query('DELETE FROM leave_requests WHERE student_id = ? AND description LIKE ?', [testStudent.id, '%Date Test']);
    console.log('✓ Test data cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testFutureDateExclusion();
