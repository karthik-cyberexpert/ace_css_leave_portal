-- Comprehensive login diagnostic script

-- 1. Check all users in the database
SELECT '=== ALL USERS ===' as '';
SELECT 
    id, email, first_name, last_name, is_admin, is_tutor, created_at
FROM users 
ORDER BY created_at;

-- 2. Check all staff records
SELECT '=== ALL STAFF ===' as '';
SELECT 
    id, name, email, username, is_admin, is_tutor
FROM staff 
ORDER BY name;

-- 3. Check users with admin privileges
SELECT '=== ADMIN USERS ===' as '';
SELECT 
    u.id, u.email, u.first_name, u.last_name, s.username, s.name as staff_name
FROM users u
LEFT JOIN staff s ON u.id = s.id
WHERE u.is_admin = 1;

-- 4. Check for specific usernames we're trying to use
SELECT '=== CHECKING SPECIFIC USERNAMES ===' as '';
SELECT 'Checking for admin username:' as '';
SELECT * FROM staff WHERE username = 'admin';

SELECT 'Checking for newadmin username:' as '';
SELECT * FROM staff WHERE username = 'newadmin';

-- 5. Check password hashes for admin users
SELECT '=== PASSWORD HASHES ===' as '';
SELECT 
    u.id, s.username, 
    SUBSTRING(u.password_hash, 1, 20) as hash_start,
    LENGTH(u.password_hash) as hash_length
FROM users u
JOIN staff s ON u.id = s.id
WHERE u.is_admin = 1;

-- 6. Check for orphaned records
SELECT '=== ORPHANED RECORDS CHECK ===' as '';
SELECT 'Users without staff records:' as '';
SELECT u.id, u.email, u.first_name, u.last_name
FROM users u
LEFT JOIN staff s ON u.id = s.id
WHERE s.id IS NULL AND u.is_admin = 1;

SELECT 'Staff without user records:' as '';
SELECT s.id, s.username, s.email, s.name
FROM staff s
LEFT JOIN users u ON s.id = u.id
WHERE u.id IS NULL;
