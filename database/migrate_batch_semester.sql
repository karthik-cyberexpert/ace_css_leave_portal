SET NAMES utf8mb4;
USE `cyber_security_leave_portal`;

-- Add the new semester column to students table
ALTER TABLE `students` 
ADD COLUMN `semester` TINYINT(1) NOT NULL DEFAULT 1 AFTER `year`,
ADD COLUMN `batch` VARCHAR(4) NOT NULL DEFAULT '2024' AFTER `year`;

-- Copy existing year data to batch column
UPDATE `students` SET `batch` = `year`;

-- Drop the old year column
ALTER TABLE `students` DROP COLUMN `year`;

-- Add index for performance on batch and semester queries
CREATE INDEX idx_students_batch_semester ON students (batch, semester);

-- Update any existing data to have a default semester of 1
-- This can be customized based on your specific needs
UPDATE `students` SET `semester` = 1 WHERE `semester` IS NULL OR `semester` = 0;

-- Optional: Update existing students based on current date and batch management logic
-- This is a placeholder - you may want to customize this based on your specific requirements
-- UPDATE `students` SET `semester` = 3 WHERE `batch` = '2024';
-- UPDATE `students` SET `semester` = 1 WHERE `batch` = '2025';

COMMIT;
