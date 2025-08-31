-- =====================================================
-- Duration Type Schema Update
-- =====================================================
-- This schema update adds duration_type support for half-day leaves
-- and fixes total_days to support decimal values (0.5, 1.5, etc.)

USE `cyber_security_leave_portal`;

-- =====================================================
-- 1. Add duration_type column to leave_requests table
-- =====================================================
-- Check if column exists before adding
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cyber_security_leave_portal'
    AND TABLE_NAME = 'leave_requests' 
    AND COLUMN_NAME = 'duration_type'
);

-- Add duration_type column if it doesn't exist
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE `leave_requests` ADD COLUMN `duration_type` ENUM(''full_day'', ''half_day_forenoon'', ''half_day_afternoon'') NOT NULL DEFAULT ''full_day'' COMMENT ''Leave duration type'' AFTER `total_days`;',
    'SELECT "duration_type column already exists in leave_requests table" as Status;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. Add duration_type column to od_requests table
-- =====================================================
-- Check if column exists before adding
SET @od_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cyber_security_leave_portal'
    AND TABLE_NAME = 'od_requests' 
    AND COLUMN_NAME = 'duration_type'
);

-- Add duration_type column if it doesn't exist
SET @od_sql = IF(@od_column_exists = 0, 
    'ALTER TABLE `od_requests` ADD COLUMN `duration_type` ENUM(''full_day'', ''half_day_forenoon'', ''half_day_afternoon'') NOT NULL DEFAULT ''full_day'' COMMENT ''OD duration type'' AFTER `total_days`;',
    'SELECT "duration_type column already exists in od_requests table" as Status;'
);
PREPARE od_stmt FROM @od_sql;
EXECUTE od_stmt;
DEALLOCATE PREPARE od_stmt;

-- =====================================================
-- 3. Fix total_days column to support decimal values
-- =====================================================
-- Update leave_requests total_days to DECIMAL(4,1)
ALTER TABLE `leave_requests` 
MODIFY COLUMN `total_days` DECIMAL(4,1) NOT NULL DEFAULT 0.0 COMMENT 'Total leave days requested (supports 0.5 for half-day)';

-- Update od_requests total_days to DECIMAL(4,1)  
ALTER TABLE `od_requests`
MODIFY COLUMN `total_days` DECIMAL(4,1) NOT NULL DEFAULT 0.0 COMMENT 'Total OD days (supports 0.5 for half-day)';

-- Update partial_cancel_days to DECIMAL(4,1) as well
ALTER TABLE `leave_requests`
MODIFY COLUMN `partial_cancel_days` DECIMAL(4,1) DEFAULT NULL COMMENT 'Days being partially cancelled (supports 0.5 for half-day)';

-- =====================================================
-- 4. Add indexes for performance (if they don't exist)
-- =====================================================
-- Add index for leave_requests duration_type
SET @index_exists_leave = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'cyber_security_leave_portal'
    AND TABLE_NAME = 'leave_requests'
    AND INDEX_NAME = 'idx_leave_duration_type'
);

SET @index_sql_leave = IF(@index_exists_leave = 0, 
    'ALTER TABLE `leave_requests` ADD INDEX `idx_leave_duration_type` (`duration_type`);',
    'SELECT "Index idx_leave_duration_type already exists" as Status;'
);
PREPARE index_stmt_leave FROM @index_sql_leave;
EXECUTE index_stmt_leave;
DEALLOCATE PREPARE index_stmt_leave;

-- Add index for od_requests duration_type
SET @index_exists_od = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'cyber_security_leave_portal'
    AND TABLE_NAME = 'od_requests'
    AND INDEX_NAME = 'idx_od_duration_type'
);

SET @index_sql_od = IF(@index_exists_od = 0, 
    'ALTER TABLE `od_requests` ADD INDEX `idx_od_duration_type` (`duration_type`);',
    'SELECT "Index idx_od_duration_type already exists" as Status;'
);
PREPARE index_stmt_od FROM @index_sql_od;
EXECUTE index_stmt_od;
DEALLOCATE PREPARE index_stmt_od;

-- =====================================================
-- 5. Fix any existing records with incorrect values
-- =====================================================
-- Update existing records that might have 0 total_days but are half-day requests
UPDATE `leave_requests` 
SET `total_days` = 0.5 
WHERE `total_days` = 0 
AND `duration_type` IN ('half_day_forenoon', 'half_day_afternoon');

UPDATE `od_requests` 
SET `total_days` = 0.5 
WHERE `total_days` = 0 
AND `duration_type` IN ('half_day_forenoon', 'half_day_afternoon');

-- =====================================================
-- 6. Verification queries
-- =====================================================
-- Show the updated table structure
SELECT 'Leave Requests Table Schema:' as Info;
DESCRIBE leave_requests;

SELECT 'OD Requests Table Schema:' as Info;  
DESCRIBE od_requests;

-- Show sample data to verify changes
SELECT 'Recent Leave Requests with Duration Types:' as Info;
SELECT 
    id, 
    student_name, 
    total_days, 
    duration_type, 
    start_date, 
    end_date, 
    status,
    created_at
FROM leave_requests 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Recent OD Requests with Duration Types:' as Info;
SELECT 
    id, 
    student_name, 
    total_days, 
    duration_type, 
    start_date, 
    end_date, 
    status,
    created_at
FROM od_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- Success Message
-- =====================================================
SELECT 'Duration type schema update completed successfully!' as Status;
SELECT 'Both leave_requests and od_requests tables now support:' as Info;
SELECT '- duration_type ENUM: full_day, half_day_forenoon, half_day_afternoon' as Feature1;
SELECT '- total_days DECIMAL(4,1): supports values like 0.5, 1.5, 2.5' as Feature2;
SELECT '- Performance indexes added for duration_type columns' as Feature3;
