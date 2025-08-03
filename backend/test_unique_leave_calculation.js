import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Utility function to execute queries
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Function to calculate dynamic leave taken based on unique calendar days
async function calculateLeaveTaken(studentId) {
  try {
    // Debug: Log all leave requests for this student
    const allLeaves = await query(
      `SELECT id, status, start_date, end_date, total_days, created_at
       FROM leave_requests
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [studentId]
    );
    console.log(`Debug - All leave requests for student ${studentId}:`, allLeaves);

    // Calculate unique calendar days on leave up to today
    // This handles overlapping leave requests correctly by counting distinct days
    const [uniqueLeaveDays] = await query(
      `SELECT COUNT(DISTINCT leave_date) as leaveTaken
       FROM (
         SELECT DATE(start_date + INTERVAL (n.num) DAY) as leave_date
         FROM leave_requests lr
         CROSS JOIN (
           SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
           UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
           UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
           UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
           UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
           UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29
           UNION SELECT 30
         ) n
         WHERE lr.student_id = ?
         AND lr.status = 'Approved'
         AND DATE(start_date + INTERVAL (n.num) DAY) <= DATE(end_date)
         AND DATE(start_date + INTERVAL (n.num) DAY) <= CURDATE()
       ) unique_dates`
    , [studentId]);

    console.log(`Debug - Unique leave days for student ${studentId}: ${uniqueLeaveDays.leaveTaken} days`);
    return uniqueLeaveDays.leaveTaken;
  } catch (error) {
    console.error('Error calculating leave taken:', error);
    throw error;
  }
}

async function testUniqueLeaveCalculation() {
  try {
    console.log('=== Testing Unique Leave Day Calculation ===');
    console.log('Current date:', new Date().toISOString().split('T')[0]);
    console.log('');

    // Find a test student
    const students = await query('SELECT id, name, register_number FROM students LIMIT 3');
    
    for (const student of students) {
      console.log(`\n--- Testing for Student: ${student.name} (${student.register_number}) ---`);
      
      // Get all leave requests for this student
      const leaveRequests = await query(
        `SELECT id, status, start_date, end_date, total_days, created_at,
                DATE(start_date) as start_date_only,
                DATE(end_date) as end_date_only,
                CURDATE() as today
         FROM leave_requests 
         WHERE student_id = ? 
         ORDER BY start_date`,
        [student.id]
      );
      
      console.log('Leave Requests:');
      leaveRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.status} | ${req.start_date_only} to ${req.end_date_only} | ${req.total_days} days | Applied: ${req.created_at.toISOString().split('T')[0]}`);
      });
      
      // Calculate using our function
      const calculatedLeaveTaken = await calculateLeaveTaken(student.id);
      
      // Manual verification - show which days are being counted
      console.log('\nApproved leave days that count toward total:');
      const approvedRequests = leaveRequests.filter(req => req.status === 'Approved');
      let manualCount = 0;
      const countedDays = new Set();
      
      for (const req of approvedRequests) {
        const startDate = new Date(req.start_date);
        const endDate = new Date(req.end_date);
        const today = new Date();
        
        console.log(`  Request: ${req.start_date_only} to ${req.end_date_only}`);
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate && currentDate <= today) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if (!countedDays.has(dateStr)) {
            countedDays.add(dateStr);
            console.log(`    ✓ ${dateStr}`);
          } else {
            console.log(`    ≈ ${dateStr} (already counted - overlap)`);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      manualCount = countedDays.size;
      
      console.log(`\nResults:`);
      console.log(`  Manual count (unique days): ${manualCount}`);
      console.log(`  Function result: ${calculatedLeaveTaken}`);
      console.log(`  Match: ${manualCount === calculatedLeaveTaken ? '✅ YES' : '❌ NO'}`);
      
      if (manualCount !== calculatedLeaveTaken) {
        console.log(`  ⚠️  MISMATCH DETECTED!`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testUniqueLeaveCalculation();
