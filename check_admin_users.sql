-- Check existing admin users
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
