-- Fix admin users with known working passwords
-- This will update existing admin and create a new one if needed

-- Update the default admin user with password "admin123"
UPDATE `users` 
SET password_hash = '$2a$10$tt94/rGrsOs58/LbZFUKBujmLqu/fl7w5GDIKBtPrq00zLqYswmRC'
WHERE id = 'admin-001';

-- Create/Update the new admin user with password "newadmin123"
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `is_admin`, `is_tutor`) 
VALUES (
    'admin-002', 
    'newadmin@college.portal', 
    '$2a$10$ZcqDSzEUBTiBAXd0D490Hu6ZXI7xaaOZFmL8kRLwj6DAWMI01nH8e', 
    'New', 
    'Admin', 
    1, 
    1
)
ON DUPLICATE KEY UPDATE 
    password_hash = '$2a$10$ZcqDSzEUBTiBAXd0D490Hu6ZXI7xaaOZFmL8kRLwj6DAWMI01nH8e',
    email = 'newadmin@college.portal',
    first_name = 'New',
    last_name = 'Admin',
    is_admin = 1,
    is_tutor = 1;

-- Create/Update staff record for new admin
INSERT INTO `staff` (`id`, `name`, `email`, `username`, `is_admin`, `is_tutor`) 
VALUES (
    'admin-002', 
    'New Admin User', 
    'newadmin@college.portal', 
    'newadmin', 
    1, 
    1
)
ON DUPLICATE KEY UPDATE 
    name = 'New Admin User',
    email = 'newadmin@college.portal',
    username = 'newadmin',
    is_admin = 1,
    is_tutor = 1;

-- Show all admin users after update
SELECT 
    u.id as 'User ID',
    u.email as 'Email',
    s.username as 'Username',
    s.name as 'Full Name',
    CASE WHEN u.is_admin = 1 THEN 'Yes' ELSE 'No' END as 'Is Admin',
    CASE WHEN u.is_tutor = 1 THEN 'Yes' ELSE 'No' END as 'Is Tutor',
    u.created_at as 'Created At'
FROM users u
LEFT JOIN staff s ON u.id = s.id
WHERE u.is_admin = 1
ORDER BY u.created_at;

-- Test login credentials available:
-- Username: admin, Password: admin123
-- Username: newadmin, Password: newadmin123
