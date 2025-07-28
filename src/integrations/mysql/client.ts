// Integration with MySQL for database operations
import mysql from 'mysql2/promise';

// Create a MySQL connection pool
export const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_mysql_user',
  password: 'your_mysql_password',
  database: 'radiant_zebra_twirl',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Utility function to execute queries with async/await
export async function executeQuery(query, params) {
  try {
    const [rows, fields] = await pool.execute(query, params);
    return { rows, fields };
  } catch (error) {
    console.error(`Query failed: ${error.message}`);
    throw error;
  }
}

