SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `cyber_security_leave_portal`;
USE `cyber_security_leave_portal`;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100),
  `last_name` VARCHAR(100),
  `profile_photo` TEXT,
  `is_admin` BOOLEAN NOT NULL DEFAULT 0,
  `is_tutor` BOOLEAN NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Staff table
CREATE TABLE IF NOT EXISTS `staff` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `is_admin` BOOLEAN NOT NULL DEFAULT 0,
  `is_tutor` BOOLEAN NOT NULL DEFAULT 0,
  `profile_photo` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- Students table
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `register_number` VARCHAR(50) NOT NULL UNIQUE,
  `tutor_id` VARCHAR(36),
  `batch` VARCHAR(4) NOT NULL,
  `semester` TINYINT(1) NOT NULL DEFAULT 1,
  `leave_taken` INT NOT NULL DEFAULT 0,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `profile_photo` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  INDEX `idx_students_batch_semester` (`batch`, `semester`)
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` VARCHAR(36) NOT NULL,
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
  `original_status` ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried'),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
);

-- Add index for partial cancellation fields
CREATE INDEX idx_leave_partial_cancellation ON leave_requests (status, partial_cancel_start, partial_cancel_end);

-- OD requests table
CREATE TABLE IF NOT EXISTS `od_requests` (
  `id` VARCHAR(36) NOT NULL,
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
  `original_status` ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried'),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `is_admin`, `is_tutor`) 
VALUES ('admin-001', 'admin@college.portal', '$2a$10$UwsYHYb6JC71lEoN2WMHt.raWi5NdYkU53GHtOmHkOFnCdxkVvzei', 'Admin', 'User', 1, 1)
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO `staff` (`id`, `name`, `email`, `username`, `is_admin`, `is_tutor`) 
VALUES ('admin-001', 'Admin User', 'admin@college.portal', 'admin', 1, 1)
ON DUPLICATE KEY UPDATE name = name;

-- Add index for OD certificate reminders performance
CREATE INDEX idx_od_certificate_reminders 
ON od_requests (status, certificate_status, end_date, last_notification_date);

-- Sessions table for single session management
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_expires_at` (`expires_at`)
);
