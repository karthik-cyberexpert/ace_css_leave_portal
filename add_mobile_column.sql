-- Simple command to add mobile column to staff table
USE cyber_security_leave_portal;

-- Add mobile column to staff table
ALTER TABLE staff ADD COLUMN mobile VARCHAR(20) DEFAULT NULL COMMENT 'Mobile phone number' AFTER username;

-- Verify the change
DESCRIBE staff;
