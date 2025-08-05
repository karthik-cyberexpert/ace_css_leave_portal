-- Create notifications table for persistent notification storage
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `type` ENUM('leave_request', 'od_request', 'profile_change', 'system') NOT NULL DEFAULT 'system',
  `reference_id` VARCHAR(36) DEFAULT NULL, -- ID of the related request/entity
  `reference_type` ENUM('leave_request', 'od_request', 'profile_change_request') DEFAULT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `read_at` DATETIME DEFAULT NULL,
  `action_url` VARCHAR(255) DEFAULT NULL, -- URL to navigate when clicked
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_notifications` (`user_id`, `is_read`, `created_at`),
  INDEX `idx_reference` (`reference_id`, `reference_type`)
);

-- Create trigger to automatically set read_at when is_read is set to true
DELIMITER $$
CREATE TRIGGER `set_notification_read_at` 
BEFORE UPDATE ON `notifications`
FOR EACH ROW
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    SET NEW.read_at = NOW();
  END IF;
END$$
DELIMITER ;
