USE cyber_security_leave_portal;

-- Check current staff table structure
SELECT 'Current staff table structure:' as info;
DESCRIBE staff;

-- Add mobile column if it doesn't exist
ALTER TABLE staff ADD COLUMN IF NOT EXISTS mobile VARCHAR(20) DEFAULT NULL COMMENT 'Mobile phone number' AFTER username;

-- Show updated structure
SELECT 'Updated staff table structure:' as info;
DESCRIBE staff;

-- Verify the change was successful
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS: Mobile column added to staff table!'
        ELSE 'ERROR: Mobile column not found in staff table!'
    END as result
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cyber_security_leave_portal' 
AND TABLE_NAME = 'staff' 
AND COLUMN_NAME = 'mobile';
