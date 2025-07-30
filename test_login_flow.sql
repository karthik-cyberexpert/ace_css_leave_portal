-- Test the exact login flow that the backend uses

-- Step 1: Look for username 'admin' in staff table
SELECT 'STEP 1: Looking for username admin in staff table' as step;
SELECT * FROM staff WHERE username = 'admin';

-- Step 2: Get the staff member ID
SET @staff_id = (SELECT id FROM staff WHERE username = 'admin' LIMIT 1);
SELECT 'STEP 2: Staff ID found' as step, @staff_id as staff_id;

-- Step 3: Look up user by that ID
SELECT 'STEP 3: Looking up user by staff ID' as step;
SELECT id, email, password_hash, is_admin, is_tutor FROM users WHERE id = @staff_id;

-- Step 4: Show the password hash we're comparing against
SELECT 'STEP 4: Password hash in database' as step;
SELECT 
    SUBSTRING(password_hash, 1, 30) as hash_preview,
    LENGTH(password_hash) as hash_length
FROM users WHERE id = @staff_id;

-- Step 5: Test if our expected hash matches
SELECT 'STEP 5: Testing if our hash matches' as step;
SELECT 
    CASE 
        WHEN password_hash = '$2a$10$tt94/rGrsOs58/LbZFUKBujmLqu/fl7w5GDIKBtPrq00zLqYswmRC' 
        THEN 'HASH MATCHES - admin123 should work' 
        ELSE 'HASH DOES NOT MATCH - password will fail' 
    END as hash_test
FROM users WHERE id = @staff_id;

-- Step 6: Complete login test simulation
SELECT 'STEP 6: Complete login simulation for username admin' as step;
SELECT 
    u.id as user_id,
    u.email,
    s.username,
    u.is_admin,
    u.is_tutor,
    CASE 
        WHEN u.password_hash = '$2a$10$tt94/rGrsOs58/LbZFUKBujmLqu/fl7w5GDIKBtPrq00zLqYswmRC' 
        THEN 'PASSWORD SHOULD WORK' 
        ELSE 'PASSWORD WILL FAIL' 
    END as password_test
FROM users u
JOIN staff s ON u.id = s.id
WHERE s.username = 'admin';
