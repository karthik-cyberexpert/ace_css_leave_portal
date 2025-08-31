-- =====================================================
-- Migration: Fix total_days column to support decimal values
-- =====================================================
-- This migration changes total_days from INT to DECIMAL(4,1)
-- to properly support half-day leave requests (e.g., 0.5, 1.5, 2.5)

USE `cyber_security_leave_portal`;

-- Fix leave_requests table
ALTER TABLE `leave_requests` 
MODIFY COLUMN `total_days` DECIMAL(4,1) NOT NULL DEFAULT 0.0 COMMENT 'Total leave days requested (supports 0.5 for half-day)';

-- Fix od_requests table  
ALTER TABLE `od_requests`
MODIFY COLUMN `total_days` DECIMAL(4,1) NOT NULL DEFAULT 0.0 COMMENT 'Total OD days (supports 0.5 for half-day)';

-- Fix partial cancellation days column in leave_requests
ALTER TABLE `leave_requests`
MODIFY COLUMN `partial_cancel_days` DECIMAL(4,1) DEFAULT NULL COMMENT 'Days being partially cancelled (supports 0.5 for half-day)';

-- Update existing records that might have 0 to proper values
-- Note: This is a data correction step - in production you might want to handle this differently
UPDATE `leave_requests` 
SET `total_days` = 0.5 
WHERE `total_days` = 0 AND `duration_type` IN ('half_day_forenoon', 'half_day_afternoon');

UPDATE `od_requests` 
SET `total_days` = 0.5 
WHERE `total_days` = 0 AND `duration_type` IN ('half_day_forenoon', 'half_day_afternoon');

-- Display success message
SELECT 'total_days columns updated to support decimal values for half-day requests!' as Status;

-- Show sample data to verify the change
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
