import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '../.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'cyber_security_leave_portal',
  port: parseInt(process.env.DB_PORT) || 3306
};

console.log('🔐 === DATABASE USER CHECK & ADMIN SETUP ===');
console.log(`📊 Database: ${dbConfig.database}`);
console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`👤 User: ${dbConfig.user}`);
console.log('=============================================\n');

async function checkAndSetupAdmin() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully!\n');
    
    // Check existing users
    console.log('1️⃣ Checking existing users...');
    const [users] = await connection.execute(`
      SELECT id, email, first_name, last_name, is_admin, is_tutor, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.first_name} ${user.last_name}`);
      console.log(`      Admin: ${user.is_admin ? '✅' : '❌'} | Tutor: ${user.is_tutor ? '✅' : '❌'}`);
      console.log(`      Created: ${user.created_at}\n`);
    });
    
    // Check for admin user
    console.log('2️⃣ Looking for existing admin users...');
    const [admins] = await connection.execute(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE is_admin = true
    `);
    
    let adminUser = null;
    if (admins.length > 0) {
      console.log(`✅ Found ${admins.length} admin user(s):`);
      admins.forEach(admin => {
        console.log(`   📧 ${admin.email} - ${admin.first_name} ${admin.last_name}`);
      });
      adminUser = admins[0]; // Use the first admin
    } else {
      console.log('❌ No admin users found in database');
    }
    
    // Create or update admin user
    const testPassword = 'admin123';
    
    if (!adminUser) {
      console.log('\n3️⃣ Creating new admin user...');
      const adminId = uuidv4();
      const passwordHash = await bcrypt.hash(testPassword, 10);
      
      await connection.execute(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_tutor, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [adminId, 'admin@portal.com', passwordHash, 'Portal', 'Admin', true, false]);
      
      console.log('✅ Admin user created successfully!');
      console.log('   📧 Email: admin@portal.com');
      console.log('   🔑 Password: admin123');
      adminUser = { id: adminId, email: 'admin@portal.com' };
      
    } else {
      console.log('\n3️⃣ Updating existing admin password...');
      const passwordHash = await bcrypt.hash(testPassword, 10);
      
      await connection.execute(`
        UPDATE users SET password_hash = ? WHERE id = ?
      `, [passwordHash, adminUser.id]);
      
      console.log('✅ Admin password updated successfully!');
      console.log(`   📧 Email: ${adminUser.email}`);
      console.log('   🔑 Password: admin123');
    }
    
    // Test the credentials
    console.log('\n4️⃣ Testing password verification...');
    const [testUsers] = await connection.execute(`
      SELECT id, email, password_hash, first_name, last_name, is_admin 
      FROM users 
      WHERE id = ?
    `, [adminUser.id]);
    
    if (testUsers.length > 0) {
      const user = testUsers[0];
      const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
      
      if (passwordMatch) {
        console.log('✅ Password verification successful!');
        console.log('\n🎉 READY TO LOGIN:');
        console.log('====================');
        console.log(`📧 Email/Username: ${user.email}`);
        console.log('🔑 Password: admin123');
        console.log('🔐 Role: Admin');
        console.log('\n🌐 Login URL: http://210.212.246.131:8085');
        
      } else {
        console.log('❌ Password verification failed!');
      }
    }
    
    // Also create a simple 'admin' username login
    console.log('\n5️⃣ Creating simple admin username...');
    try {
      const simpleAdminId = uuidv4();
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await connection.execute(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_tutor, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
      `, [simpleAdminId, 'admin', passwordHash, 'Admin', 'User', true, false]);
      
      console.log('✅ Simple admin login created!');
      console.log('   👤 Username: admin');
      console.log('   🔑 Password: admin123');
      
    } catch (duplicateError) {
      // Try to update existing 'admin' user
      const passwordHash = await bcrypt.hash('admin123', 10);
      await connection.execute(`
        UPDATE users SET password_hash = ?, is_admin = true WHERE email = 'admin'
      `);
      console.log('✅ Updated existing admin user');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('💡 Make sure MySQL is running and credentials are correct');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Access denied - check database credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - check if MySQL is running on port', dbConfig.port);
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkAndSetupAdmin()
  .then(() => {
    console.log('\n✅ Admin setup completed!');
    console.log('🚀 You can now try logging in with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  });
