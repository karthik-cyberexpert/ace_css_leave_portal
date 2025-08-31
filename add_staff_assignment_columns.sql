-- Migration script to add batch assignment columns to staff table
-- This script adds the missing columns that are expected by the frontend code

-- Add assigned_batch column to staff table
ALTER TABLE staff 
ADD COLUMN assigned_batch VARCHAR(50) DEFAULT NULL;

-- Add assigned_semester column to staff table  
ALTER TABLE staff 
ADD COLUMN assigned_semester INTEGER DEFAULT NULL;

-- Add indexes for better query performance (optional but recommended)
CREATE INDEX idx_staff_assigned_batch ON staff(assigned_batch);
CREATE INDEX idx_staff_assigned_semester ON staff(assigned_semester);

-- Add comments to document the new columns
COMMENT ON COLUMN staff.assigned_batch IS 'The batch assigned to this tutor/staff member';
COMMENT ON COLUMN staff.assigned_semester IS 'The semester assigned to this tutor/staff member';

-- Display current staff table structure to verify changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- Show a sample of staff records to verify the new columns exist
SELECT id, name, email, is_tutor, assigned_batch, assigned_semester 
FROM staff 
WHERE is_tutor = true
LIMIT 5;
