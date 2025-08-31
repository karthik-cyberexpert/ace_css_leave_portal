# 🔧 Fix for Staff Mobile Column Issue

## Problem
The error "failed to update staffs" occurs because the `mobile` column is missing from the `staff` table in your database, even though the API code expects it to be there.

## Root Cause
Your current database doesn't have the `mobile` column in the `staff` table, but your application schema (rebuilt_schema.sql) defines it. This mismatch causes the update operation to fail.

## Solution

### Option 1: Using MySQL Command Line (Recommended)

1. **Open MySQL Command Line Client** or connect to MySQL using your preferred method:
   ```bash
   mysql -u root -p
   ```

2. **Execute these commands**:
   ```sql
   USE cyber_security_leave_portal;
   
   -- Check if mobile column exists
   SELECT COLUMN_NAME 
   FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cyber_security_leave_portal' 
   AND TABLE_NAME = 'staff' 
   AND COLUMN_NAME = 'mobile';
   
   -- Add the mobile column (run this if the above query returns no results)
   ALTER TABLE staff ADD COLUMN mobile VARCHAR(20) DEFAULT NULL COMMENT 'Mobile phone number' AFTER username;
   
   -- Verify the column was added
   DESCRIBE staff;
   ```

3. **Expected output after adding the column**:
   ```
   +------------------+--------------+------+-----+---------+-------+
   | Field            | Type         | Null | Key | Default | Extra |
   +------------------+--------------+------+-----+---------+-------+
   | id               | varchar(36)  | NO   | PRI | NULL    |       |
   | name             | varchar(255) | NO   |     | NULL    |       |
   | email            | varchar(255) | NO   | UNI | NULL    |       |
   | username         | varchar(50)  | NO   | UNI | NULL    |       |
   | mobile           | varchar(20)  | YES  |     | NULL    |       |  <- This should be present
   | is_admin         | tinyint(1)   | NO   |     | 0       |       |
   | is_tutor         | tinyint(1)   | NO   |     | 0       |       |
   | assigned_batch   | varchar(4)   | YES  |     | NULL    |       |
   | assigned_semester| tinyint(4)   | YES  |     | NULL    |       |
   | profile_photo    | text         | YES  |     | NULL    |       |
   | created_at       | datetime     | NO   |     | CURRENT_TIMESTAMP |       |
   | updated_at       | datetime     | NO   |     | CURRENT_TIMESTAMP |       |
   +------------------+--------------+------+-----+---------+-------+
   ```

### Option 2: Using MySQL Workbench or phpMyAdmin

1. **Connect to your database**
2. **Select the `cyber_security_leave_portal` database**
3. **Find the `staff` table and click on it**
4. **Add a new column with these properties**:
   - Column Name: `mobile`
   - Data Type: `VARCHAR(20)`
   - Allow NULL: Yes
   - Default: NULL
   - Comment: Mobile phone number
   - Position: After `username` column

### Option 3: Run the Complete Schema Update

If you want to ensure your database matches the latest schema completely:

```sql
-- This will update your database to match the rebuilt_schema.sql
SOURCE D:/copied/rebuilt_schema.sql;
```

**⚠️ Warning**: This will recreate all tables, so back up your data first if you have important data.

## Verify the Fix

After adding the column, test the staff update functionality:

1. **Start your backend server**:
   ```bash
   cd D:/copied/backend
   npm start
   ```

2. **Try updating a staff member's mobile number** through your frontend or API client

3. **The update should now work successfully**

## What This Column Does

The `mobile` column in the `staff` table stores:
- Phone numbers for staff members (tutors and admins)
- Maximum 20 characters
- Optional field (can be NULL)
- Used by the staff update API endpoint

## Backend Code Reference

The staff update endpoint in `server.js` (lines 1092-1119) handles mobile number updates correctly:

```javascript
// Update staff
app.put('/staff/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...staffUpdates } = req.body;
    
    // This will now work because mobile column exists
    if (Object.keys(staffUpdates).length > 0) {
      const setClause = Object.keys(staffUpdates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(staffUpdates);
      values.push(id);
      await query(`UPDATE staff SET ${setClause} WHERE id = ?`, values);
    }
    
    // ... rest of the code
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});
```

## Success Confirmation

After fixing, you should be able to:
- ✅ Update staff mobile numbers successfully  
- ✅ See mobile numbers in staff profile pages
- ✅ No more "failed to update staffs" errors
- ✅ API returns updated staff data correctly

## Troubleshooting

If you still get errors after adding the column:

1. **Restart your backend server** to ensure it picks up the database changes
2. **Check the browser console** for any JavaScript errors  
3. **Verify the API request** is sending the mobile field correctly
4. **Check server logs** for detailed error messages

---

**Next Steps**: Once this fix is applied, your staff management functionality should work perfectly! 🎉
