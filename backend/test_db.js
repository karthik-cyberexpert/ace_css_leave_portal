import mysql from 'mysql2/promise';

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'cyber_security_leave_portal'
    });

    const [rows] = await connection.execute(
      'SELECT id, student_id, purpose, status, certificate_status, certificate_url FROM od_requests ORDER BY id DESC LIMIT 10'
    );

    console.log('Recent OD Requests:');
    console.table(rows);

    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

testDB();
