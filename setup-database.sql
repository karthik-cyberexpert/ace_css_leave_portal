-- =====================================================
-- ACE CSS Leave Portal - Database Setup Script
-- =====================================================
-- Run this script in MySQL to set up the database
-- Connect to MySQL and run: SOURCE setup-database.sql;
-- =====================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE cyber_security_leave_portal;

-- Display success message
SELECT 'Database cyber_security_leave_portal created successfully!' as Message;

-- Show current database
SELECT DATABASE() as 'Current Database';

-- Create a test table to verify connection (will be replaced by application)
CREATE TABLE IF NOT EXISTS connection_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message VARCHAR(255) DEFAULT 'Database connection successful'
);

-- Insert test record
INSERT INTO connection_test (message) 
VALUES ('ACE CSS Leave Portal - Database Ready for Deployment');

-- Display test record
SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 1;

-- Show database info
SHOW TABLES;

-- Display completion message
SELECT 
    'Database setup complete! Ready for Leave Portal deployment.' as Status,
    DATABASE() as Database_Name,
    CONNECTION_ID() as Connection_ID,
    USER() as Connected_User,
    @@port as MySQL_Port;

-- Instructions for next steps
SELECT '
Next Steps:
1. Run deploy-college.bat from your project directory
2. The application will automatically create all required tables
3. Access your portal at http://210.212.246.131:8085
' as Instructions;
