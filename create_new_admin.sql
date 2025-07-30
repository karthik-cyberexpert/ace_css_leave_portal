-- Create a new admin user with unique credentials
-- 
-- 🔑 NEW ADMIN CREDENTIALS:
-- Username: newadmin
-- Password: newadmin123
-- Email: newadmin@college.portal
-- ID: admin-002

-- Insert into users table
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
    email = VALUES(email),
    password_hash = VALUES(password_hash),
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    is_admin = VALUES(is_admin),
    is_tutor = VALUES(is_tutor);

-- Insert into staff table
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
    name = VALUES(name),
    email = VALUES(email),
    username = VALUES(username),
    is_admin = VALUES(is_admin),
    is_tutor = VALUES(is_tutor);

-- Verification: Show all admin users
SELECT 
    u.id as 'User ID',
    u.email as 'Email',
    s.username as 'Username',
    s.name as 'Full Name',
    CASE WHEN u.is_admin = 1 THEN 'Yes' ELSE 'No' END as 'Is Admin',
    CASE WHEN u.is_tutor = 1 THEN 'Yes' ELSE 'No' END as 'Is Tutor',
    u.created_at as 'Created At'
FROM users u
JOIN staff s ON u.id = s.id
WHERE u.is_admin = 1
ORDER BY u.created_at;
