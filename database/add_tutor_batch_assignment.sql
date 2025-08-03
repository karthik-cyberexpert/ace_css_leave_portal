SET NAMES utf8mb4;
USE `cyber_security_leave_portal`;

-- Add batch and semester assignment columns to staff table
ALTER TABLE `staff` 
ADD COLUMN `assigned_batch` VARCHAR(4) NULL AFTER `is_tutor`,
ADD COLUMN `assigned_semester` TINYINT(1) NULL AFTER `assigned_batch`;

-- Add index for performance on batch and semester queries
CREATE INDEX idx_staff_batch_semester ON staff (assigned_batch, assigned_semester);

COMMIT;
