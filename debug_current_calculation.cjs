const mysql = require('mysql2/promise');

async function debugCurrentCalculation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cyber_security_leave_portal'
  });

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('=== DEBUGGING CURRENT LEAVE CALCULATION ===');
    console.log('Today is:', todayStr);
    
    // Find a test student
    const [students] = await connection.execute('SELECT * FROM students LIMIT 1');
    if (students.length === 0) {
      console.log('No students found in database.');
      return;
    }
    
    const student = students[0];
    console.log('\nUsing student:', student.name, 'ID:', student.id);
    
    // Show ALL leave requests for this student with detailed breakdown
    const [allLeaves] = await connection.execute(
      `SELECT 
         id, start_date, end_date, total_days, status,
         DATE(start_date) as start_date_only,
         DATE(end_date) as end_date_only,
         CURDATE() as today_date,
         -- Check if today falls within the leave period
         CASE 
           WHEN DATE(start_date) <= CURDATE() AND DATE(end_date) >= CURDATE() THEN 'ONGOING'
           WHEN DATE(end_date) < CURDATE() THEN 'COMPLETED'
           WHEN DATE(start_date) > CURDATE() THEN 'FUTURE'
           ELSE 'UNKNOWN'
         END as period_status,
         -- Calculate days to count based on current logic
         CASE 
           WHEN DATE(start_date) <= CURDATE() AND DATE(end_date) >= CURDATE() THEN 
             DATEDIFF(CURDATE(), DATE(start_date)) + 1
           WHEN DATE(end_date) < CURDATE() THEN 
             total_days
           ELSE 
             0
         END as days_should_count,
         -- Show the date difference calculation
         DATEDIFF(CURDATE(), DATE(start_date)) as days_since_start,
         DATEDIFF(DATE(end_date), CURDATE()) as days_until_end
       FROM leave_requests 
       WHERE student_id = ?
       ORDER BY start_date DESC`,
      [student.id]
    );
    
    console.log('\n=== ALL LEAVE REQUESTS FOR THIS STUDENT ===');
    let totalExpected = 0;
    allLeaves.forEach((leave, index) => {
      console.log(`\n${index + 1}. Leave Request ID: ${leave.id}`);
      console.log(`   Status: ${leave.status}`);
      console.log(`   Start: ${leave.start_date_only}, End: ${leave.end_date_only}`);
      console.log(`   Total Days: ${leave.total_days}`);
      console.log(`   Period Status: ${leave.period_status}`);
      console.log(`   Days Since Start: ${leave.days_since_start}`);
      console.log(`   Days Until End: ${leave.days_until_end}`);
      console.log(`   Days Should Count: ${leave.days_should_count}`);
      
      if (leave.status === 'Approved') {
        totalExpected += leave.days_should_count;
      }
    });
    
    console.log(`\n=== CALCULATION SUMMARY ===`);
    console.log(`Expected total from approved leaves: ${totalExpected}`);
    
    // Test the actual SQL query being used in the backend
    const [backendResult] = await connection.execute(
      `SELECT COALESCE(SUM(
         CASE 
           WHEN DATE(start_date) <= CURDATE() AND DATE(end_date) >= CURDATE() THEN 
             DATEDIFF(CURDATE(), DATE(start_date)) + 1
           WHEN DATE(end_date) < CURDATE() THEN 
             total_days
           ELSE 
             0
         END
       ), 0) as leaveTaken
       FROM leave_requests
       WHERE student_id = ?
       AND status = 'Approved'`,
      [student.id]
    );
    
    console.log(`Backend SQL query result: ${backendResult[0].leaveTaken}`);
    console.log(`Match with expected: ${totalExpected === backendResult[0].leaveTaken ? 'YES' : 'NO'}`);
    
    // Also check what the student table shows
    console.log(`\nStored leave_taken in students table: ${student.leave_taken}`);
    
    // Test a simple manual calculation for today specifically
    const [todaySpecific] = await connection.execute(
      `SELECT COUNT(*) as ongoing_leaves_today
       FROM leave_requests 
       WHERE student_id = ? 
       AND status = 'Approved'
       AND DATE(start_date) <= CURDATE() 
       AND DATE(end_date) >= CURDATE()`,
      [student.id]
    );
    
    console.log(`\n=== TODAY-SPECIFIC CHECK ===`);
    console.log(`Number of ongoing leaves today: ${todaySpecific[0].ongoing_leaves_today}`);
    
    if (todaySpecific[0].ongoing_leaves_today > 0) {
      console.log('✓ There ARE ongoing leaves today - calculation should reflect this');
    } else {
      console.log('✗ No ongoing leaves today - check if there should be any');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

debugCurrentCalculation();
