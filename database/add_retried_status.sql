-- Migration script to add 'Retried' status to leave_requests and od_requests tables
-- This resolves the "Data truncated for column 'status'" error when retrying rejected requests

-- Add 'Retried' to leave_requests status ENUM
ALTER TABLE leave_requests MODIFY COLUMN status 
ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried') 
NOT NULL DEFAULT 'Pending';

-- Add 'Retried' to od_requests status ENUM
ALTER TABLE od_requests MODIFY COLUMN status 
ENUM('Pending', 'Approved', 'Rejected', 'Forwarded', 'Cancelled', 'Cancellation Pending', 'Retried') 
NOT NULL DEFAULT 'Pending';
