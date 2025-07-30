SET NAMES utf8mb4;
USE `cyber_security_leave_portal`;

-- Add the new email and mobile columns to students table
ALTER TABLE `students` 
ADD COLUMN `email` VARCHAR(255) NOT NULL AFTER `register_number`,
ADD COLUMN `mobile` VARCHAR(20) NOT NULL AFTER `email`;

-- Update existing data: 
-- For existing students, we'll use the email from the users table
-- For mobile, we'll use a placeholder that can be updated later
UPDATE `students` s 
INNER JOIN `users` u ON s.id = u.id 
SET s.email = u.email, s.mobile = '0000000000';

-- Drop the old username and profile_photo columns from students table
-- (Keep them in users table for now in case we need them)
ALTER TABLE `students` 
DROP COLUMN `username`,
DROP COLUMN `profile_photo`;

-- Add unique constraint for email in students table
ALTER TABLE `students` 
ADD UNIQUE KEY `unique_student_email` (`email`);

COMMIT;
