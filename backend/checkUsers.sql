-- ===============================================================================
-- DATABASE QUERIES TO CHECK USER CREDENTIALS
-- ===============================================================================
-- Run these queries in your MySQL database to find the correct login credentials

-- 1. Check if the specific email exists
SELECT id, email, first_name, last_name, is_admin, is_tutor 
FROM users 
WHERE email = 'karthisathya308@gmail.com';

-- 2. List all users in the database
SELECT id, email, first_name, last_name, is_admin, is_tutor 
FROM users 
ORDER BY email;

-- 3. Check students table for additional info
SELECT s.id, s.name, s.register_number, s.email, u.email as user_email
FROM students s
JOIN users u ON s.id = u.id
ORDER BY s.name;

-- 4. Check staff table for additional info  
SELECT st.id, st.name, st.email, st.username, st.is_admin, st.is_tutor
FROM staff st
JOIN users u ON st.id = u.id
ORDER BY st.name;

-- 5. Search for users with similar email patterns
SELECT id, email, first_name, last_name, is_admin, is_tutor 
FROM users 
WHERE email LIKE '%karthisathya%' OR email LIKE '%karthi%';

-- 6. List users who can login (have valid email and password)
SELECT id, email, first_name, last_name, is_admin, is_tutor,
       CASE 
         WHEN password_hash IS NOT NULL THEN 'Has Password'
         ELSE 'No Password'
       END as password_status
FROM users 
WHERE email IS NOT NULL
ORDER BY is_admin DESC, is_tutor DESC, email;

-- ===============================================================================
-- INSTRUCTIONS:
-- ===============================================================================
-- 1. Connect to your MySQL database:
--    mysql -u root -p cyber_security_leave_portal
-- 
-- 2. Run the queries above to find valid user credentials
-- 
-- 3. Look for:
--    - Users with email addresses that exist
--    - Users with password_status = 'Has Password'  
--    - Check both admin/tutor and student accounts
-- 
-- 4. Try logging in with found credentials using the format:
--    Email: [found_email]
--    Password: [you'll need to check what passwords were set]
--
-- Common default passwords might be:
--    - 1234567890
--    - password123
--    - admin123
--    - 123456
--    - The user's name in lowercase
-- ===============================================================================
