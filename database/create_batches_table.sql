SET NAMES utf8mb4;
USE `cyber_security_leave_portal`;

-- Create batches table
CREATE TABLE IF NOT EXISTS `batches` (
  `id` varchar(36) NOT NULL,
  `start_year` int NOT NULL,
  `end_year` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_start_year` (`start_year`),
  UNIQUE KEY `unique_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default batches based on existing student data
INSERT IGNORE INTO `batches` (`id`, `start_year`, `end_year`, `name`, `is_active`)
SELECT 
    batch as id,
    CAST(batch as UNSIGNED) as start_year,
    CAST(batch as UNSIGNED) + 4 as end_year,
    CONCAT(batch, '-', CAST(batch as UNSIGNED) + 4) as name,
    1 as is_active
FROM (
    SELECT DISTINCT batch 
    FROM students 
    WHERE batch IS NOT NULL 
    AND batch != ''
) as distinct_batches;

-- Add additional batches for current and future years if they don't exist
INSERT IGNORE INTO `batches` (`id`, `start_year`, `end_year`, `name`, `is_active`)
VALUES 
    ('2025', 2025, 2029, '2025-2029', 1),
    ('2026', 2026, 2030, '2026-2030', 1),
    ('2023', 2023, 2027, '2023-2027', 1),
    ('2022', 2022, 2026, '2022-2026', 1);

-- Add foreign key constraint to students table
ALTER TABLE `students` 
ADD INDEX `idx_batch_fk` (`batch`);

COMMIT;
