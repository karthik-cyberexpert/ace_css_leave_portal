-- Complete admin user reset script
-- This will completely remove and recreate admin users with known working credentials

-- Remove existing admin users (be careful - this removes all admin users!)
DELETE FROM staff WHERE id IN ('admin-001', 'admin-002');
DELETE FROM users WHERE id IN ('admin-001', 'admin-002');

-- Create the primary admin user (admin/admin123)
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `is_admin`, `is_tutor`) 
VALUES (
    'admin-001', 
    'admin@college.portal', 
    '$2a$10$tt94/rGrsOs58/LbZFUKBujmLqu/fl7w5GDIKBtPrq00zLqYswmRC', 
    'Admin', 
    'User', 
    1, 
    1
);

INSERT INTO `staff` (`id`, `name`, `email`, `username`, `is_admin`, `is_tutor`) 
VALUES (
    'admin-001', 
    'Admin User', 
    'admin@college.portal', 
    'admin', 
    1, 
    1
);

-- Create the secondary admin user (newadmin/newadmin123)
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `is_admin`, `is_tutor`) 
VALUES (
    'admin-002', 
    'newadmin@college.portal', 
    '$2a$10$ZcqDSzEUBTiBAXd0D490Hu6ZXI7xaaOZFmL8kRLwj6DAWMI01nH8e', 
    'New', 
    'Admin', 
    1, 
    1
);

INSERT INTO `staff` (`id`, `name`, `email`, `username`, `is_admin`, `is_tutor`) 
VALUES (
    'admin-002', 
    'New Admin User', 
    'newadmin@college.portal', 
    'newadmin', 
    1, 
    1
);

-- Verify the users were created correctly
SELECT 'VERIFICATION - Admin users created:' as '';
SELECT 
    u.id,
    u.email,
    s.username,
    s.name as full_name,
    u.is_admin,
    u.is_tutor,
    SUBSTRING(u.password_hash, 1, 10) as hash_start
FROM users u
JOIN staff s ON u.id = s.id
WHERE u.is_admin = 1
ORDER BY u.id;

-- Login credentials:
SELECT '=== LOGIN CREDENTIALS ===' as '';
SELECT 'Username: admin, Password: admin123' as '';
SELECT 'Username: newadmin, Password: newadmin123' as '';
