USE cyber_security_leave_portal;

-- Show staff table structure
SELECT 'Staff table structure:' as info;
DESCRIBE staff;

-- Check if mobile column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS: Mobile column exists in staff table!'
        ELSE 'ERROR: Mobile column missing from staff table!'
    END as mobile_column_status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cyber_security_leave_portal' 
AND TABLE_NAME = 'staff' 
AND COLUMN_NAME = 'mobile';

-- Show all columns in staff table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cyber_security_leave_portal' 
AND TABLE_NAME = 'staff'
ORDER BY ORDINAL_POSITION;

-- Show sample staff data to verify table works
SELECT 'Sample staff records:' as info;
SELECT id, name, email, username, mobile, is_admin, is_tutor FROM staff LIMIT 3;
