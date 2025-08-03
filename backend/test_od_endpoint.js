import mysql from 'mysql2/promise';

async function testODEndpoint() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'cyber_security_leave_portal'
    });

    // This is the exact query used by the admin interface
    const [rows] = await connection.execute(
      'SELECT * FROM od_requests ORDER BY created_at DESC'
    );

    console.log('OD Requests from admin endpoint:');
    
    // Filter to show only relevant fields
    const filtered = rows.map(row => ({
      id: row.id,
      purpose: row.purpose,
      status: row.status,
      certificate_status: row.certificate_status,
      certificate_url: row.certificate_url
    }));
    
    console.table(filtered);

    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

testODEndpoint();
