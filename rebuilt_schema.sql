-- =====================================================================================
-- ACE CSS LEAVE PORTAL - COMPREHENSIVE DATABASE SCHEMA
-- =====================================================================================
-- Version: 2.1.0 (Latest)
-- Compatible with: MySQL 8.0+
-- Last Updated: August 2025
-- 
-- This schema includes all the latest features:
-- - Partial leave cancellations
-- - Certificate management with deadlines
-- - Notification system
-- - Batch management
-- - Profile change workflow
-- - Enhanced security and session management
-- - Performance optimized indexes
-- =====================================================================================

SET NAMES utf8mb4;
SET sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS `cyber_security_leave_portal` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cyber_security_leave_portal`;

-- Drop existing tables in correct order to handle foreign key constraints
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `profile_change_requests`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `od_requests`;
DROP TABLE IF EXISTS `leave_requests`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `staff`;
DROP TABLE IF EXISTS `batches`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================================
-- CORE USER MANAGEMENT TABLES
-- =====================================================================================

-- Users table - Base authentication and user information
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID for user identification',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email address (unique across system)',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed password',
  `first_name` VARCHAR(100) DEFAULT NULL COMMENT 'User first name',
  `last_name` VARCHAR(100) DEFAULT NULL COMMENT 'User last name',
  `profile_photo` TEXT DEFAULT NULL COMMENT 'Profile photo URL or base64 data',
  `is_admin` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Admin role flag',
  `is_tutor` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Tutor role flag',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Indexes for performance
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_admin` (`is_admin`),
  INDEX `idx_users_tutor` (`is_tutor`),
  INDEX `idx_users_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Base user authentication and information';

-- Staff table - Tutors and administrators
CREATE TABLE `staff` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'References users.id',
  `name` VARCHAR(255) NOT NULL COMMENT 'Full display name',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Staff email (matches users.email)',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique username for login',
  `mobile` VARCHAR(20) DEFAULT NULL COMMENT 'Mobile phone number',
  `is_admin` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Admin privileges flag',
  `is_tutor` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Tutor role flag',
  `assigned_batch` VARCHAR(4) DEFAULT NULL COMMENT 'Currently assigned batch',
  `assigned_semester` TINYINT DEFAULT NULL COMMENT 'Currently assigned semester',
  `profile_photo` TEXT DEFAULT NULL COMMENT 'Profile photo URL or base64 data',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Foreign key constraints
  FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_staff_email` (`email`),
  INDEX `idx_staff_username` (`username`),
  INDEX `idx_staff_admin` (`is_admin`),
  INDEX `idx_staff_tutor` (`is_tutor`),
  INDEX `idx_staff_assignment` (`assigned_batch`, `assigned_semester`),
  INDEX `idx_staff_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Staff members - tutors and administrators';

-- Batches table - Academic batch management
CREATE TABLE `batches` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID for batch identification',
  `start_year` INT NOT NULL COMMENT 'Academic start year',
  `end_year` INT NOT NULL COMMENT 'Academic end year',
  `name` VARCHAR(50) NOT NULL COMMENT 'Display name (e.g., 2024-2028)',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active status flag',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Batch creation timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Unique constraints
  UNIQUE KEY `unique_start_year` (`start_year`),
  UNIQUE KEY `unique_batch_name` (`name`),
  
  -- Indexes for performance
  INDEX `idx_batches_active` (`is_active`),
  INDEX `idx_batches_years` (`start_year`, `end_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Academic batch management';

-- Students table - Student information and academic details
CREATE TABLE `students` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'References users.id',
  `name` VARCHAR(255) NOT NULL COMMENT 'Full student name',
  `register_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique registration number',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Student email (matches users.email)',
  `mobile` VARCHAR(20) NOT NULL COMMENT 'Mobile phone number',
  `tutor_id` VARCHAR(36) DEFAULT NULL COMMENT 'Assigned tutor reference',
  `batch` VARCHAR(4) NOT NULL COMMENT 'Academic batch year',
  `semester` TINYINT NOT NULL DEFAULT 1 COMMENT 'Current semester (1-8)',
  `leave_taken` INT NOT NULL DEFAULT 0 COMMENT 'Total leave days taken',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active enrollment status',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique username for login',
  `profile_photo` TEXT DEFAULT NULL COMMENT 'Profile photo URL or base64 data',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Enrollment timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Foreign key constraints
  FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_students_email` (`email`),
  INDEX `idx_students_register` (`register_number`),
  INDEX `idx_students_username` (`username`),
  INDEX `idx_students_tutor` (`tutor_id`),
  INDEX `idx_students_batch` (`batch`),
  INDEX `idx_students_semester` (`semester`),
  INDEX `idx_students_active` (`is_active`),
  INDEX `idx_students_leave_taken` (`leave_taken`),
  INDEX `idx_students_batch_semester` (`batch`, `semester`),
  INDEX `idx_students_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student information and academic details';

-- =====================================================================================
-- REQUEST MANAGEMENT TABLES
-- =====================================================================================

-- Leave requests table - Student leave applications with partial cancellation support
CREATE TABLE `leave_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID for leave request',
  `student_id` VARCHAR(36) NOT NULL COMMENT 'References students.id',
  `student_name` VARCHAR(255) NOT NULL COMMENT 'Student name at time of request',
  `student_register_number` VARCHAR(50) NOT NULL COMMENT 'Student register number',
  `tutor_id` VARCHAR(36) NOT NULL COMMENT 'Assigned tutor at time of request',
  `tutor_name` VARCHAR(255) NOT NULL COMMENT 'Tutor name at time of request',
  `start_date` DATE NOT NULL COMMENT 'Leave start date',
  `end_date` DATE NOT NULL COMMENT 'Leave end date',
  `total_days` INT NOT NULL COMMENT 'Total leave days requested',
  `partial_cancel_start` DATE DEFAULT NULL COMMENT 'Partial cancellation start date',
  `partial_cancel_end` DATE DEFAULT NULL COMMENT 'Partial cancellation end date',
  `partial_cancel_days` INT DEFAULT NULL COMMENT 'Days being partially cancelled',
  `subject` VARCHAR(255) NOT NULL COMMENT 'Leave subject/title',
  `description` TEXT NOT NULL COMMENT 'Detailed leave description',
  `status` ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried') NOT NULL DEFAULT 'Pending' COMMENT 'Current request status',
  `cancel_reason` TEXT DEFAULT NULL COMMENT 'Reason for cancellation request',
  `original_status` ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried') DEFAULT NULL COMMENT 'Status before cancellation',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Request creation timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Foreign key constraints
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_leave_student` (`student_id`),
  INDEX `idx_leave_tutor` (`tutor_id`),
  INDEX `idx_leave_status` (`status`),
  INDEX `idx_leave_dates` (`start_date`, `end_date`),
  INDEX `idx_leave_partial_cancellation` (`status`, `partial_cancel_start`, `partial_cancel_end`),
  INDEX `idx_leave_created` (`created_at`),
  INDEX `idx_leave_student_status` (`student_id`, `status`),
  INDEX `idx_leave_tutor_status` (`tutor_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student leave requests with partial cancellation support';

-- OD requests table - Official duty requests with certificate management
CREATE TABLE `od_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID for OD request',
  `student_id` VARCHAR(36) NOT NULL COMMENT 'References students.id',
  `student_name` VARCHAR(255) NOT NULL COMMENT 'Student name at time of request',
  `student_register_number` VARCHAR(50) NOT NULL COMMENT 'Student register number',
  `tutor_id` VARCHAR(36) NOT NULL COMMENT 'Assigned tutor at time of request',
  `tutor_name` VARCHAR(255) NOT NULL COMMENT 'Tutor name at time of request',
  `start_date` DATE NOT NULL COMMENT 'OD start date',
  `end_date` DATE NOT NULL COMMENT 'OD end date',
  `total_days` INT NOT NULL COMMENT 'Total OD days',
  `purpose` VARCHAR(255) NOT NULL COMMENT 'Purpose of official duty',
  `destination` VARCHAR(255) NOT NULL COMMENT 'Destination/venue',
  `description` TEXT NOT NULL COMMENT 'Detailed OD description',
  `status` ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried') NOT NULL DEFAULT 'Pending' COMMENT 'Current request status',
  `cancel_reason` TEXT DEFAULT NULL COMMENT 'Reason for cancellation request',
  `certificate_url` TEXT DEFAULT NULL COMMENT 'Uploaded certificate file path',
  `certificate_status` ENUM('Pending Upload', 'Pending Verification', 'Approved', 'Rejected', 'Overdue') DEFAULT NULL COMMENT 'Certificate verification status',
  `upload_deadline` DATE DEFAULT NULL COMMENT 'Certificate upload deadline',
  `last_notification_date` DATE DEFAULT NULL COMMENT 'Last reminder notification sent',
  `original_status` ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried') DEFAULT NULL COMMENT 'Status before cancellation',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Request creation timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Foreign key constraints
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_od_student` (`student_id`),
  INDEX `idx_od_tutor` (`tutor_id`),
  INDEX `idx_od_status` (`status`),
  INDEX `idx_od_cert_status` (`certificate_status`),
  INDEX `idx_od_dates` (`start_date`, `end_date`),
  INDEX `idx_od_deadline` (`upload_deadline`),
  INDEX `idx_od_certificate_reminders` (`status`, `certificate_status`, `end_date`, `last_notification_date`),
  INDEX `idx_od_created` (`created_at`),
  INDEX `idx_od_student_status` (`student_id`, `status`),
  INDEX `idx_od_tutor_status` (`tutor_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Official duty requests with certificate management';

-- Profile change requests table - Workflow for profile modifications
CREATE TABLE `profile_change_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID for profile change request',
  `student_id` VARCHAR(36) NOT NULL COMMENT 'References students.id',
  `student_name` VARCHAR(255) NOT NULL COMMENT 'Student name at time of request',
  `student_register_number` VARCHAR(50) NOT NULL COMMENT 'Student register number',
  `tutor_id` VARCHAR(36) NOT NULL COMMENT 'Assigned tutor at time of request',
  `tutor_name` VARCHAR(255) NOT NULL COMMENT 'Tutor name at time of request',
  `change_type` ENUM('email', 'mobile', 'password') NOT NULL COMMENT 'Type of change requested',
  `current_value` TEXT DEFAULT NULL COMMENT 'Current value (masked for passwords)',
  `requested_value` TEXT NOT NULL COMMENT 'New value requested (hashed for passwords)',
  `reason` TEXT DEFAULT NULL COMMENT 'Reason for change request',
  `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending' COMMENT 'Request status',
  `admin_comments` TEXT DEFAULT NULL COMMENT 'Admin review comments',
  `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Request submission timestamp',
  `reviewed_at` DATETIME DEFAULT NULL COMMENT 'Review completion timestamp',
  `reviewed_by` VARCHAR(36) DEFAULT NULL COMMENT 'Admin who reviewed the request',
  `reviewer_name` VARCHAR(255) DEFAULT NULL COMMENT 'Reviewer name for audit trail',
  
  -- Foreign key constraints
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `staff` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_profile_change_student` (`student_id`),
  INDEX `idx_profile_change_tutor` (`tutor_id`),
  INDEX `idx_profile_change_type` (`change_type`),
  INDEX `idx_profile_change_status` (`status`),
  INDEX `idx_profile_change_requested` (`requested_at`),
  INDEX `idx_profile_change_student_status` (`student_id`, `status`),
  INDEX `idx_profile_change_tutor_status` (`tutor_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Profile change requests workflow';

-- =====================================================================================
-- SYSTEM MANAGEMENT TABLES
-- =====================================================================================

-- Notifications table - System-wide notification management
CREATE TABLE `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID for notification',
  `user_id` VARCHAR(36) NOT NULL COMMENT 'Target user for notification',
  `title` VARCHAR(255) NOT NULL COMMENT 'Notification title',
  `description` TEXT NOT NULL COMMENT 'Notification content/message',
  `type` ENUM('leave_request', 'od_request', 'profile_change', 'system', 'certificate_reminder', 'deadline_warning') NOT NULL DEFAULT 'system' COMMENT 'Notification category',
  `reference_id` VARCHAR(36) DEFAULT NULL COMMENT 'Related entity ID (request, etc.)',
  `reference_type` ENUM('leave_request', 'od_request', 'profile_change_request', 'certificate', 'system') DEFAULT NULL COMMENT 'Type of referenced entity',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Read status flag',
  `read_at` DATETIME DEFAULT NULL COMMENT 'Timestamp when marked as read',
  `action_url` VARCHAR(255) DEFAULT NULL COMMENT 'Navigation URL for quick access',
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal' COMMENT 'Notification priority level',
  `expires_at` DATETIME DEFAULT NULL COMMENT 'Optional expiration timestamp',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Notification creation timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Foreign key constraints
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_notifications_user` (`user_id`),
  INDEX `idx_notifications_read` (`is_read`),
  INDEX `idx_notifications_type` (`type`),
  INDEX `idx_notifications_reference` (`reference_id`, `reference_type`),
  INDEX `idx_notifications_priority` (`priority`),
  INDEX `idx_notifications_expires` (`expires_at`),
  INDEX `idx_notifications_user_read` (`user_id`, `is_read`, `created_at`),
  INDEX `idx_notifications_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System-wide notification management';

-- User sessions table - Enhanced JWT session management
CREATE TABLE `user_sessions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID for session',
  `user_id` VARCHAR(36) NOT NULL COMMENT 'References users.id',
  `token_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed JWT token for security',
  `device_info` TEXT DEFAULT NULL COMMENT 'User agent and device information',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Client IP address (supports IPv6)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Session creation timestamp',
  `expires_at` DATETIME NOT NULL COMMENT 'Session expiration timestamp',
  `last_activity` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last activity timestamp',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active session flag',
  
  -- Foreign key constraints
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_sessions_user` (`user_id`),
  INDEX `idx_sessions_token` (`token_hash`),
  INDEX `idx_sessions_active` (`is_active`),
  INDEX `idx_sessions_expires` (`expires_at`),
  INDEX `idx_sessions_activity` (`last_activity`),
  INDEX `idx_sessions_user_active` (`user_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enhanced JWT session management';

-- =====================================================================================
-- TRIGGERS AND AUTOMATED PROCESSES
-- =====================================================================================

-- Trigger to automatically set read_at timestamp when notification is marked as read
DELIMITER //
CREATE TRIGGER `tr_notification_read_timestamp`
  BEFORE UPDATE ON `notifications`
  FOR EACH ROW
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    SET NEW.read_at = CURRENT_TIMESTAMP;
  ELSEIF NEW.is_read = FALSE AND OLD.is_read = TRUE THEN
    SET NEW.read_at = NULL;
  END IF;
END//
DELIMITER ;

-- Trigger to automatically update session last_activity
DELIMITER //
CREATE TRIGGER `tr_session_activity_update`
  BEFORE UPDATE ON `user_sessions`
  FOR EACH ROW
BEGIN
  IF NEW.token_hash != OLD.token_hash OR NEW.is_active != OLD.is_active THEN
    SET NEW.last_activity = CURRENT_TIMESTAMP;
  END IF;
END//
DELIMITER ;

-- =====================================================================================
-- DEFAULT DATA INSERTION
-- =====================================================================================

-- Insert default admin user (password: admin123)
SET @admin_id = UUID();
SET @admin_email = 'admin@college.portal';
SET @admin_password_hash = '$2a$10$UwsYHYb6JC71lEoN2WMHt.raWi5NdYkU53GHtOmHkOFnCdxkVvzei';

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `is_admin`, `is_tutor`) 
VALUES (@admin_id, @admin_email, @admin_password_hash, 'System', 'Administrator', TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
  `first_name` = VALUES(`first_name`),
  `last_name` = VALUES(`last_name`),
  `is_admin` = VALUES(`is_admin`),
  `is_tutor` = VALUES(`is_tutor`);

INSERT INTO `staff` (`id`, `name`, `email`, `username`, `is_admin`, `is_tutor`) 
VALUES (@admin_id, 'System Administrator', @admin_email, 'admin', TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `is_admin` = VALUES(`is_admin`),
  `is_tutor` = VALUES(`is_tutor`);

-- Insert default batches for common academic years
INSERT INTO `batches` (`id`, `start_year`, `end_year`, `name`, `is_active`) VALUES
  (UUID(), 2022, 2026, '2022-2026', TRUE),
  (UUID(), 2023, 2027, '2023-2027', TRUE),
  (UUID(), 2024, 2028, '2024-2028', TRUE),
  (UUID(), 2025, 2029, '2025-2029', TRUE),
  (UUID(), 2026, 2030, '2026-2030', TRUE)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `is_active` = VALUES(`is_active`);

-- =====================================================================================
-- SCHEDULED EVENTS FOR MAINTENANCE
-- =====================================================================================

-- Event to cleanup expired sessions daily
CREATE EVENT IF NOT EXISTS `ev_cleanup_expired_sessions`
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
COMMENT 'Daily cleanup of expired user sessions'
DO
  UPDATE `user_sessions` 
  SET `is_active` = FALSE 
  WHERE `expires_at` <= NOW() AND `is_active` = TRUE;

-- Event to update overdue certificates hourly
CREATE EVENT IF NOT EXISTS `ev_update_overdue_certificates`
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
COMMENT 'Hourly update of overdue certificate statuses'
DO
  UPDATE `od_requests` 
  SET `certificate_status` = 'Overdue' 
  WHERE `certificate_status` = 'Pending Upload' 
    AND `upload_deadline` <= CURDATE() 
    AND `upload_deadline` IS NOT NULL;

-- Event to cleanup old notifications (older than 90 days)
CREATE EVENT IF NOT EXISTS `ev_cleanup_old_notifications`
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
COMMENT 'Weekly cleanup of old read notifications'
DO
  DELETE FROM `notifications` 
  WHERE `is_read` = TRUE 
    AND `created_at` <= DATE_SUB(NOW(), INTERVAL 90 DAY)
    AND (`expires_at` IS NULL OR `expires_at` <= NOW());

-- Enable MySQL event scheduler
SET GLOBAL event_scheduler = ON;

-- =====================================================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================================================

-- View for active students with tutor information
CREATE VIEW `v_active_students_with_tutors` AS
SELECT 
  s.id,
  s.name,
  s.register_number,
  s.email,
  s.mobile,
  s.batch,
  s.semester,
  s.leave_taken,
  s.username,
  st.name AS tutor_name,
  st.email AS tutor_email,
  u.first_name,
  u.last_name,
  s.created_at
FROM `students` s
LEFT JOIN `staff` st ON s.tutor_id = st.id
LEFT JOIN `users` u ON s.id = u.id
WHERE s.is_active = TRUE;

-- View for pending requests summary
CREATE VIEW `v_pending_requests_summary` AS
SELECT 
  'leave_request' as request_type,
  COUNT(*) as pending_count,
  tutor_id,
  tutor_name
FROM `leave_requests` 
WHERE status = 'Pending'
GROUP BY tutor_id, tutor_name
UNION ALL
SELECT 
  'od_request' as request_type,
  COUNT(*) as pending_count,
  tutor_id,
  tutor_name
FROM `od_requests` 
WHERE status = 'Pending'
GROUP BY tutor_id, tutor_name;

-- =====================================================================================
-- SUCCESS MESSAGE AND SUMMARY
-- =====================================================================================

SELECT 
  '🎉 ACE CSS Leave Portal Database Schema Created Successfully!' as STATUS,
  'All tables, indexes, triggers, and constraints have been set up.' as MESSAGE,
  'Default admin user created with username: admin, password: admin123' as ADMIN_INFO,
  'You can now run your application and begin using the system.' as NEXT_STEP;

-- Show table summary
SELECT 
  TABLE_NAME as 'Table',
  TABLE_ROWS as 'Rows',
  ROUND(DATA_LENGTH / 1024, 2) as 'Size (KB)',
  TABLE_COMMENT as 'Description'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'cyber_security_leave_portal'
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
