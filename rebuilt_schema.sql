SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `cyber_security_leave_portal`;
USE `cyber_security_leave_portal`;

-- Drop existing tables (foreign key constraints handled)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS profile_change_requests, user_sessions, leave_requests, od_requests, students, staff, users, batches, notifications;
SET FOREIGN_KEY_CHECKS = 1;

-- Users table
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100),
  `last_name` VARCHAR(100),
  `profile_photo` TEXT,
  `is_admin` BOOLEAN NOT NULL DEFAULT 0,
  `is_tutor` BOOLEAN NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE `staff` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `is_admin` BOOLEAN NOT NULL DEFAULT 0,
  `is_tutor` BOOLEAN NOT NULL DEFAULT 0,
  `profile_photo` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- Students table
CREATE TABLE `students` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `register_number` VARCHAR(50) NOT NULL UNIQUE,
  `tutor_id` VARCHAR(36),
  `batch` VARCHAR(4) NOT NULL,
  `semester` TINYINT(1) NOT NULL DEFAULT 1,
  `leave_taken` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `profile_photo` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
);

-- Batches table
CREATE TABLE `batches` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `start_year` INT NOT NULL,
  `end_year` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Leave requests table
CREATE TABLE `leave_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `student_id` VARCHAR(36) NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `student_register_number` VARCHAR(50) NOT NULL,
  `tutor_id` VARCHAR(36) NOT NULL,
  `tutor_name` VARCHAR(255) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` INT NOT NULL,
  `partial_cancel_start` DATE DEFAULT NULL,
  `partial_cancel_end` DATE DEFAULT NULL,
  `partial_cancel_days` INT DEFAULT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried') NOT NULL DEFAULT 'Pending',
  `cancel_reason` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
);

-- OD requests table
CREATE TABLE `od_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `student_id` VARCHAR(36) NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `student_register_number` VARCHAR(50) NOT NULL,
  `tutor_id` VARCHAR(36) NOT NULL,
  `tutor_name` VARCHAR(255) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` INT NOT NULL,
  `purpose` VARCHAR(255) NOT NULL,
  `destination` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried') NOT NULL DEFAULT 'Pending',
  `cancel_reason` TEXT,
  `certificate_url` TEXT,
  `certificate_status` ENUM('Pending Upload', 'Pending Verification', 'Approved', 'Rejected', 'Overdue'),
  `upload_deadline` DATE,
  `last_notification_date` DATE DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
);

-- Profile change requests table
CREATE TABLE `profile_change_requests` (
  `id` VARCHAR(36) PRIMARY KEY,
  `student_id` VARCHAR(36) NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `student_register_number` VARCHAR(50) NOT NULL,
  `tutor_id` VARCHAR(36) NOT NULL,
  `tutor_name` VARCHAR(255) NOT NULL,
  `change_type` ENUM('email', 'mobile', 'password') NOT NULL,
  `current_value` TEXT,
  `requested_value` TEXT NOT NULL,
  `reason` TEXT,
  `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  `admin_comments` TEXT,
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` TIMESTAMP NULL,
  `reviewed_by` VARCHAR(36) NULL,
  `reviewer_name` VARCHAR(255) NULL,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `type` ENUM('leave_request', 'od_request', 'profile_change', 'system') NOT NULL DEFAULT 'system',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `read_at` DATETIME DEFAULT NULL,
  `action_url` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- User sessions table
CREATE TABLE `user_sessions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT 1,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_staff_created_at ON staff(created_at);
CREATE INDEX idx_students_created_at ON students(created_at);
CREATE INDEX idx_leave_partial_cancellation ON leave_requests (status, partial_cancel_start, partial_cancel_end);
CREATE INDEX idx_od_certificate_reminders ON od_requests (status, certificate_status, end_date, last_notification_date);

-- Success message
SELECT 'Schema rebuilt successfully!' as STATUS, 'All tables, indexes, and constraints are set up.' as MESSAGE, 'You can now run your application.' as NEXT_STEP;
