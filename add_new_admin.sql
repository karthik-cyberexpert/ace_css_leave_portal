-- Add a new admin user with known credentials
-- Username: newadmin
-- Password: admin123

-- First, insert into users table
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `is_admin`, `is_tutor`) 
VALUES (
    'admin-002', 
    'newadmin@college.portal', 
    '$2a$10$UwsYHYb6JC71lEoN2WMHt.raWi5NdYkU53GHtOmHkOFnCdxkVvzei', 
    'New', 
    'Admin', 
    1, 
    1
)
ON DUPLICATE KEY UPDATE email = email;

-- Then, insert into staff table
INSERT INTO `staff` (`id`, `name`, `email`, `username`, `is_admin`, `is_tutor`) 
VALUES (
    'admin-002', 
    'New Admin User', 
    'newadmin@college.portal', 
    'newadmin', 
    1, 
    1
)
ON DUPLICATE KEY UPDATE name = name;

-- Verification query
SELECT 
    u.id,
    u.email,
    s.username,
    s.name,
    u.is_admin,
    u.is_tutor
FROM users u
JOIN staff s ON u.id = s.id
WHERE u.is_admin = 1;
