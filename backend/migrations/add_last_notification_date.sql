-- Add last_notification_date column to od_requests table for tracking OD certificate reminders
-- This column is needed for the daily cron job that sends certificate upload reminders

ALTER TABLE od_requests ADD COLUMN last_notification_date DATE DEFAULT NULL;

-- Add index for better performance on the cron job queries
CREATE INDEX idx_od_certificate_reminders 
ON od_requests (status, certificate_status, end_date, last_notification_date);

-- Update any existing approved requests to set initial notification tracking
-- This ensures the cron job works correctly for existing data
UPDATE od_requests 
SET last_notification_date = NULL 
WHERE status = 'Approved' 
AND certificate_status = 'Pending Upload' 
AND last_notification_date IS NULL;
