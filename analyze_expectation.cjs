const mysql = require('mysql2/promise');

async function analyzeExpectation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cyber_security_leave_portal'
  });

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('=== ANALYZING USER EXPECTATION ===');
    console.log('Today is:', todayStr);
    console.log('User says: "today is the first day of leave, so it needs to be like 1 out of 11 days"');
    console.log('User says: "tomorrow automatically changes to 2 out of 12 days since tomorrow also I got approved for leave"');
    
    // Find a test student
    const [students] = await connection.execute('SELECT * FROM students LIMIT 1');
    const student = students[0];
    console.log('\nUsing student:', student.name, 'ID:', student.id);
    
    // Show the leave requests
    const [leaves] = await connection.execute(
      `SELECT id, start_date, end_date, total_days, status,
              DATE(start_date) as start_only, DATE(end_date) as end_only
       FROM leave_requests 
       WHERE student_id = ? AND status = 'Approved'
       ORDER BY start_date`,
      [student.id]
    );
    
    console.log('\n=== APPROVED LEAVE REQUESTS ===');
    leaves.forEach((leave, index) => {
      console.log(`${index + 1}. Start: ${leave.start_only}, End: ${leave.end_only}, Total: ${leave.total_days} days`);
    });
    
    console.log('\n=== ANALYSIS ===');
    console.log('Current calculation shows: 2 days out of 11');
    console.log('User expects: 1 day out of 11');
    
    console.log('\nPossible interpretations:');
    console.log('1. User wants to count UNIQUE DAYS on leave (not overlapping)');
    console.log('2. User wants to count only the first day of overlapping leaves');
    console.log('3. User wants to count leaves differently');
    
    // Test unique days calculation
    const [uniqueDays] = await connection.execute(
      `SELECT COUNT(DISTINCT leave_date) as unique_leave_days
       FROM (
         SELECT DATE(start_date + INTERVAL (n.num) DAY) as leave_date
         FROM leave_requests lr
         CROSS JOIN (
           SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
           UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
         ) n
         WHERE lr.student_id = ?
         AND lr.status = 'Approved'
         AND DATE(start_date + INTERVAL (n.num) DAY) <= DATE(end_date)
         AND DATE(start_date + INTERVAL (n.num) DAY) <= CURDATE()
       ) unique_dates`,
      [student.id]
    );
    
    console.log(`\nUnique leave days up to today: ${uniqueDays[0].unique_leave_days}`);
    
    // Test what happens tomorrow
    const [tomorrowCalc] = await connection.execute(
      `SELECT COUNT(DISTINCT leave_date) as unique_leave_days_tomorrow
       FROM (
         SELECT DATE(start_date + INTERVAL (n.num) DAY) as leave_date
         FROM leave_requests lr
         CROSS JOIN (
           SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
           UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
         ) n
         WHERE lr.student_id = ?
         AND lr.status = 'Approved'
         AND DATE(start_date + INTERVAL (n.num) DAY) <= DATE(end_date)
         AND DATE(start_date + INTERVAL (n.num) DAY) <= DATE_ADD(CURDATE(), INTERVAL 1 DAY)
       ) unique_dates`,
      [student.id]
    );
    
    console.log(`Unique leave days up to tomorrow: ${tomorrowCalc[0].unique_leave_days_tomorrow}`);
    
    if (uniqueDays[0].unique_leave_days === 1 && tomorrowCalc[0].unique_leave_days_tomorrow === 2) {
      console.log('\n✓ FOUND THE SOLUTION: User wants UNIQUE LEAVE DAYS count!');
      console.log('This means we should count distinct calendar days on leave, not sum of leave request days.');
    } else {
      console.log('\n✗ Unique days calculation doesn\'t match user expectation either.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

analyzeExpectation();
