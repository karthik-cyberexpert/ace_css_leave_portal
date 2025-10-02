-- Create exception_days table for managing days when leave/OD applications are blocked
-- This migration should be run after the main schema

CREATE TABLE IF NOT EXISTS exception_days (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    date DATE NOT NULL UNIQUE,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_exception_days_date (date),
    INDEX idx_exception_days_created_at (created_at)
);

-- Add some example data (optional - remove in production)
-- INSERT INTO exception_days (date, reason, description) VALUES
-- ('2025-01-01', 'New Year Holiday', 'National holiday - no leave applications accepted'),
-- ('2025-01-26', 'Republic Day', 'National holiday - no leave applications accepted'),
-- ('2025-08-15', 'Independence Day', 'National holiday - no leave applications accepted');
