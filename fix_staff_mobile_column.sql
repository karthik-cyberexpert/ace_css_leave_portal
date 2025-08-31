-- Fix missing mobile column in staff table
-- This script will add the mobile column if it doesn't exist

USE cyber_security_leave_portal;

-- Check if the mobile column exists in staff table, and add it if it doesn't
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'cyber_security_leave_portal'
    AND TABLE_NAME = 'staff'
    AND COLUMN_NAME = 'mobile'
);

-- Add the mobile column if it doesn't exist
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE staff ADD COLUMN mobile VARCHAR(20) DEFAULT NULL COMMENT "Mobile phone number" AFTER username;',
    'SELECT "Mobile column already exists in staff table" as status;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the column was added
SELECT 'Staff table structure after fix:' as info;
DESCRIBE staff;

-- Show success message
SELECT 
    'Mobile column fix completed successfully!' as STATUS,
    'Staff table now has the mobile column for phone numbers.' as MESSAGE,
    'You can now update staff mobile numbers through the API.' as NEXT_STEP;
