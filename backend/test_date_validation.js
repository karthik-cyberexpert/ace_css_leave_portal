import mysql from 'mysql2/promise';
import { dbConfig } from './config/database.js';

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Utility function to execute queries
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

async function testDateValidation() {
  try {
    console.log('=== Testing Date Overlap Validation ===');
    
    // Find a test student with tutor info
    const [testStudent] = await query(`
      SELECT s.*, st.name as tutor_name 
      FROM students s 
      LEFT JOIN staff st ON s.tutor_id = st.id 
      LIMIT 1
    `);
    if (!testStudent) {
      console.log('No students found for testing');
      return;
    }
    
    if (!testStudent.tutor_id) {
      console.log('Test student has no tutor assigned, skipping test');
      return;
    }
    
    console.log(`Testing with student: ${testStudent.name} (${testStudent.register_number})`);
    
    // Test scenarios
    const testScenarios = [
      {
        name: 'Scenario 1: Check overlap detection for leave requests',
        requests: [
          { type: 'leave', start: '2025-08-05', end: '2025-08-07', status: 'Approved' },
          { type: 'leave', start: '2025-08-06', end: '2025-08-08', status: 'Pending' } // Should overlap
        ]
      },
      {
        name: 'Scenario 2: Check overlap detection between leave and OD',
        requests: [
          { type: 'leave', start: '2025-08-10', end: '2025-08-12', status: 'Approved' },
          { type: 'od', start: '2025-08-11', end: '2025-08-13', status: 'Pending' } // Should overlap
        ]
      },
      {
        name: 'Scenario 3: Check no overlap - adjacent dates',
        requests: [
          { type: 'leave', start: '2025-08-15', end: '2025-08-17', status: 'Approved' },
          { type: 'od', start: '2025-08-18', end: '2025-08-20', status: 'Pending' } // Should NOT overlap
        ]
      },
      {
        name: 'Scenario 4: Check rejected/cancelled requests do not block',
        requests: [
          { type: 'leave', start: '2025-08-25', end: '2025-08-27', status: 'Rejected' },
          { type: 'leave', start: '2025-08-26', end: '2025-08-28', status: 'Pending' } // Should NOT overlap (first is rejected)
        ]
      }
    ];
    
    for (const scenario of testScenarios) {
      console.log(`\n--- ${scenario.name} ---`);
      
      // Clear any existing test data first
      await query('DELETE FROM leave_requests WHERE student_id = ? AND start_date >= ?', [testStudent.id, '2025-08-01']);
      await query('DELETE FROM od_requests WHERE student_id = ? AND start_date >= ?', [testStudent.id, '2025-08-01']);
      
      for (let i = 0; i < scenario.requests.length; i++) {
        const req = scenario.requests[i];
        console.log(`  ${i + 1}. Creating ${req.type} request: ${req.start} to ${req.end} (${req.status})`);
        
        try {
          if (req.type === 'leave') {
            await query(
              `INSERT INTO leave_requests (id, student_id, student_name, student_register_number, 
                start_date, end_date, total_days, subject, description, status, tutor_id, tutor_name)
               VALUES (UUID(), ?, ?, ?, ?, ?, DATEDIFF(?, ?) + 1, 'Test Subject', 'Test Description', ?, ?, ?)`,
              [testStudent.id, testStudent.name, testStudent.register_number, req.start, req.end, req.end, req.start, req.status, testStudent.tutor_id, testStudent.tutor_name || 'Test Tutor']
            );
          } else {
            await query(
              `INSERT INTO od_requests (id, student_id, student_name, student_register_number,
                start_date, end_date, total_days, purpose, destination, description, status, tutor_id, tutor_name)
               VALUES (UUID(), ?, ?, ?, ?, ?, DATEDIFF(?, ?) + 1, 'Test Purpose', 'Test Destination', 'Test Description', ?, ?, ?)`,
              [testStudent.id, testStudent.name, testStudent.register_number, req.start, req.end, req.end, req.start, req.status, testStudent.tutor_id, testStudent.tutor_name || 'Test Tutor']
            );
          }
          console.log(`     ✓ Created successfully`);
        } catch (error) {
          console.log(`     ❌ Failed to create: ${error.message}`);
        }
        
        // Now test overlap detection for the next request
        if (i < scenario.requests.length - 1) {
          const nextReq = scenario.requests[i + 1];
          console.log(`  ${i + 2}. Testing overlap detection for ${nextReq.type}: ${nextReq.start} to ${nextReq.end}`);
          
          // Check for overlapping leave requests
          const leaveOverlapCheck = await query(
            `SELECT COUNT(*) as overlapCount
             FROM leave_requests
             WHERE student_id = ? AND status IN ('Approved', 'Pending')
             AND GREATEST(?, start_date) <= LEAST(?, end_date)`,
            [testStudent.id, nextReq.start, nextReq.end]
          );
          
          // Check for overlapping OD requests
          const odOverlapCheck = await query(
            `SELECT COUNT(*) as overlapCount
             FROM od_requests
             WHERE student_id = ? AND status IN ('Approved', 'Pending')
             AND GREATEST(?, start_date) <= LEAST(?, end_date)`,
            [testStudent.id, nextReq.start, nextReq.end]
          );
          
          const hasOverlap = leaveOverlapCheck[0].overlapCount > 0 || odOverlapCheck[0].overlapCount > 0;
          console.log(`     Leave overlaps: ${leaveOverlapCheck[0].overlapCount}`);
          console.log(`     OD overlaps: ${odOverlapCheck[0].overlapCount}`);
          console.log(`     ${hasOverlap ? '❌ OVERLAP DETECTED - Request would be blocked' : '✅ NO OVERLAP - Request would be allowed'}`);
        }
      }
    }
    
    // Clean up test data
    console.log('\n--- Cleaning up test data ---');
    await query('DELETE FROM leave_requests WHERE student_id = ? AND start_date >= ?', [testStudent.id, '2025-08-01']);
    await query('DELETE FROM od_requests WHERE student_id = ? AND start_date >= ?', [testStudent.id, '2025-08-01']);
    console.log('✓ Test data cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testDateValidation();
