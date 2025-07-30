-- Step by step admin creation with verification at each step

-- Step 1: Show current state
SELECT 'STEP 1: Current users table' as step;
SELECT id, email, first_name, last_name, is_admin, is_tutor FROM users;

SELECT 'STEP 1: Current staff table' as step;
SELECT id, name, email, username, is_admin, is_tutor FROM staff;

-- Step 2: Clean up any existing admin users
SELECT 'STEP 2: Cleaning up existing admin users' as step;
DELETE FROM staff WHERE id IN ('admin-001', 'admin-002');
DELETE FROM users WHERE id IN ('admin-001', 'admin-002');

-- Step 3: Create user record for admin
SELECT 'STEP 3: Creating user record for admin' as step;
INSERT INTO users (
    id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    is_admin, 
    is_tutor
) VALUES (
    'admin-001',
    'admin@college.portal',
    '$2a$10$tt94/rGrsOs58/LbZFUKBujmLqu/fl7w5GDIKBtPrq00zLqYswmRC',
    'Admin',
    'User',
    1,
    1
);

-- Step 4: Verify user was created
SELECT 'STEP 4: Verify user was created' as step;
SELECT * FROM users WHERE id = 'admin-001';

-- Step 5: Create staff record for admin
SELECT 'STEP 5: Creating staff record for admin' as step;
INSERT INTO staff (
    id,
    name,
    email,
    username,
    is_admin,
    is_tutor
) VALUES (
    'admin-001',
    'Admin User',
    'admin@college.portal',
    'admin',
    1,
    1
);

-- Step 6: Verify staff was created
SELECT 'STEP 6: Verify staff was created' as step;
SELECT * FROM staff WHERE id = 'admin-001';

-- Step 7: Test the join between users and staff
SELECT 'STEP 7: Testing join between users and staff' as step;
SELECT 
    u.id,
    u.email,
    u.password_hash,
    s.username,
    s.name,
    u.is_admin,
    u.is_tutor
FROM users u
JOIN staff s ON u.id = s.id
WHERE u.id = 'admin-001';

-- Step 8: Show final state
SELECT 'STEP 8: Final verification - all admin users' as step;
SELECT 
    u.id,
    u.email,
    s.username,
    s.name,
    u.is_admin,
    u.is_tutor,
    SUBSTRING(u.password_hash, 1, 15) as hash_start
FROM users u
JOIN staff s ON u.id = s.id
WHERE u.is_admin = 1;

SELECT 'CREDENTIALS: Username=admin, Password=admin123' as result;
