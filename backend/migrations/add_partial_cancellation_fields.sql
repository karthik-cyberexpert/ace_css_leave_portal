-- Add partial cancellation support to leave_requests table
-- This allows tracking partial cancellations of approved leave requests

ALTER TABLE leave_requests ADD COLUMN partial_cancel_start DATE DEFAULT NULL;
ALTER TABLE leave_requests ADD COLUMN partial_cancel_end DATE DEFAULT NULL;
ALTER TABLE leave_requests ADD COLUMN partial_cancel_days INT DEFAULT NULL;

-- Add index for better performance on partial cancellation queries
CREATE INDEX idx_leave_partial_cancellation 
ON leave_requests (status, partial_cancel_start, partial_cancel_end);

-- Comments to explain the new columns:
-- partial_cancel_start: Start date of the partial cancellation range
-- partial_cancel_end: End date of the partial cancellation range  
-- partial_cancel_days: Number of days being partially cancelled
