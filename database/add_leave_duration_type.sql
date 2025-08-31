-- =====================================================
-- Migration: Add Leave Duration Type Support
-- =====================================================
-- This migration adds support for full-day and half-day
-- (forenoon/afternoon) leave and OD requests

USE `cyber_security_leave_portal`;

-- Add duration_type column to leave_requests table
ALTER TABLE `leave_requests` 
ADD COLUMN `duration_type` ENUM('full_day', 'half_day_forenoon', 'half_day_afternoon') NOT NULL DEFAULT 'full_day' COMMENT 'Leave duration type' 
AFTER `total_days`;

-- Add duration_type column to od_requests table  
ALTER TABLE `od_requests`
ADD COLUMN `duration_type` ENUM('full_day', 'half_day_forenoon', 'half_day_afternoon') NOT NULL DEFAULT 'full_day' COMMENT 'OD duration type'
AFTER `total_days`;

-- Add indexes for performance
ALTER TABLE `leave_requests` 
ADD INDEX `idx_leave_duration_type` (`duration_type`);

ALTER TABLE `od_requests`
ADD INDEX `idx_od_duration_type` (`duration_type`);

-- Display success message
SELECT 'Leave duration type columns added successfully!' as Status;
