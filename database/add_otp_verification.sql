-- =====================================================================================
-- ACE CSS LEAVE PORTAL - OTP VERIFICATION SYSTEM
-- =====================================================================================
-- Version: 2.2.0
-- Purpose: Add OTP (One-Time Password) verification system for enhanced security
-- Compatible with: MySQL 8.0+
-- Date: August 2025
-- =====================================================================================

USE `cyber_security_leave_portal`;

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS `otp_verifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID for OTP record',
  `user_id` VARCHAR(36) NOT NULL COMMENT 'References users.id',
  `email` VARCHAR(255) NOT NULL COMMENT 'Email address for OTP delivery',
  `otp_code` VARCHAR(6) NOT NULL COMMENT '6-digit OTP code',
  `otp_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed OTP for security',
  `purpose` ENUM('login', 'password_reset', 'email_change', 'account_verification') NOT NULL DEFAULT 'login' COMMENT 'Purpose of OTP',
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Verification status',
  `is_used` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Usage status (prevent reuse)',
  `attempts` TINYINT NOT NULL DEFAULT 0 COMMENT 'Verification attempts count',
  `max_attempts` TINYINT NOT NULL DEFAULT 3 COMMENT 'Maximum allowed attempts',
  `expires_at` DATETIME NOT NULL COMMENT 'OTP expiration timestamp',
  `verified_at` DATETIME DEFAULT NULL COMMENT 'Verification completion timestamp',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Client IP address for audit',
  `user_agent` TEXT DEFAULT NULL COMMENT 'Client user agent for audit',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'OTP generation timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Foreign key constraints
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_otp_user` (`user_id`),
  INDEX `idx_otp_email` (`email`),
  INDEX `idx_otp_code` (`otp_code`),
  INDEX `idx_otp_hash` (`otp_hash`),
  INDEX `idx_otp_purpose` (`purpose`),
  INDEX `idx_otp_status` (`is_verified`, `is_used`),
  INDEX `idx_otp_expires` (`expires_at`),
  INDEX `idx_otp_user_purpose` (`user_id`, `purpose`, `is_verified`),
  INDEX `idx_otp_cleanup` (`expires_at`, `is_used`),
  INDEX `idx_otp_created` (`created_at`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OTP verification system for enhanced security';

-- Create index for efficient cleanup of expired OTPs
CREATE INDEX `idx_otp_expired_cleanup` ON `otp_verifications` (`expires_at`, `is_used`, `created_at`);

-- Add OTP verification status to users table
ALTER TABLE `users` 
ADD COLUMN `otp_verified` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'OTP verification status' AFTER `is_tutor`,
ADD COLUMN `last_otp_request` DATETIME DEFAULT NULL COMMENT 'Last OTP request timestamp' AFTER `otp_verified`;

-- Add indexes for new user columns
ALTER TABLE `users` 
ADD INDEX `idx_users_otp_verified` (`otp_verified`),
ADD INDEX `idx_users_last_otp` (`last_otp_request`);

-- =====================================================================================
-- CLEANUP PROCEDURE FOR EXPIRED OTPS
-- =====================================================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `CleanupExpiredOTPs`()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Delete expired and used OTPs older than 24 hours
    DELETE FROM `otp_verifications` 
    WHERE (
        `expires_at` < NOW() 
        OR `is_used` = TRUE
    ) 
    AND `created_at` < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    -- Log cleanup activity
    SELECT 
        ROW_COUNT() as deleted_records,
        NOW() as cleanup_timestamp;
    
    COMMIT;
END //

DELIMITER ;

-- =====================================================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================================================

-- Note: In production, OTPs should only be generated through the application
-- This is just for reference of the data structure

/*
INSERT INTO `otp_verifications` (
    `id`, `user_id`, `email`, `otp_code`, `otp_hash`, `purpose`, 
    `expires_at`, `ip_address`, `user_agent`
) VALUES (
    UUID(), 
    'user-id-here', 
    'user@example.com', 
    '123456', 
    '$2b$10$hashedOTPhere', 
    'login',
    DATE_ADD(NOW(), INTERVAL 10 MINUTE),
    '192.168.1.1',
    'Mozilla/5.0...'
);
*/

-- =====================================================================================
-- VERIFICATION QUERIES (for testing and debugging)
-- =====================================================================================

-- Check if table was created successfully
SELECT 
    TABLE_NAME, 
    ENGINE, 
    TABLE_COLLATION,
    TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'cyber_security_leave_portal' 
AND TABLE_NAME = 'otp_verifications';

-- Check indexes
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'cyber_security_leave_portal' 
AND TABLE_NAME = 'otp_verifications'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Check new user table columns
DESCRIBE `users`;

COMMIT;

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================
-- 
-- NEXT STEPS:
-- 1. Update backend to use OTP verification
-- 2. Implement OTP generation and validation utilities
-- 3. Create OTP email service
-- 4. Update frontend with OTP verification UI
-- 5. Test the complete OTP flow
--
-- =====================================================================================
