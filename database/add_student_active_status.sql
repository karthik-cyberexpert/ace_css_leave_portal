SET NAMES utf8mb4;
USE `cyber_security_leave_portal`;

-- Add is_active field to students table
ALTER TABLE `students` 
ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `leave_taken`;

-- Add index for performance on active status queries
CREATE INDEX idx_students_active ON students (is_active);

-- Update existing students to be active by default
UPDATE `students` SET `is_active` = TRUE WHERE `is_active` IS NULL;

COMMIT;
