-- Add username column to students table if it doesn't exist
USE cyber_security_leave_portal;

-- Check if username column exists, if not add it
SET @dbname = DATABASE();
SET @tablename = 'students';
SET @columnname = 'username';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " VARCHAR(50) UNIQUE")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing students to have usernames based on their email
UPDATE students SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL;
