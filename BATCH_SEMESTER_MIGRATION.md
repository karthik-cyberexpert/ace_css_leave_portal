# Database Migration: Year to Batch and Semester

This document outlines the changes made to migrate from a single "year" field to separate "batch" and "semester" fields for students.

## Database Changes

### 1. Database Migration Script
- **File:** `database/migrate_batch_semester.sql`
- **Purpose:** Migrates existing data from `year` column to new `batch` and `semester` columns
- **Usage:** Run this script on your database to migrate existing data

### 2. Updated Schema
- **File:** `database/schema.sql`
- **Changes:** 
  - Replaced `year VARCHAR(4)` with `batch VARCHAR(4)` and `semester TINYINT(1)`
  - Added index `idx_students_batch_semester` for performance

## Code Changes

### 1. TypeScript Interfaces (`src/context/AppContext.tsx`)
- Updated `Student` interface to use `batch: string` and `semester: number` instead of `year: string`
- Updated `NewStudentData` interface accordingly
- Modified API payload in `addStudent` function to send `batch` and `semester`

### 2. Frontend Components

#### AdminReportPage (`src/pages/AdminReportPage.tsx`)
- Updated filtering logic to use `student.batch` instead of `student.year`
- Chart tooltip crash fix applied

#### LeaveRequestPage (`src/pages/LeaveRequestPage.tsx`)
- Updated semester validation to use `userProfile.student.batch`
- Date validation now uses batch instead of year for semester date ranges

#### TutorReportPage (`src/pages/TutorReportPage.tsx`)
- Added "Semester" column to student report table
- Updated table display to show both batch (e.g., "2024-2028") and semester (e.g., "3")

#### StudentFormDialog (`src/components/StudentFormDialog.tsx`)
- Updated form schema to include `batch` and `semester` fields
- Changed interface props from `years: string[]` to `batches: string[]`
- Form now validates semester as number between 1-8

### 3. Chart Components (`src/components/DailyLeaveChart.tsx`)
- Fixed tooltip crash issue that caused blank screen when hovering over charts
- Added robust error handling and data validation
- Improved tooltip formatter functions

## Migration Steps

1. **Backup your database** before running any migration scripts

2. **Run the migration script:**
   ```sql
   -- Execute the migration script
   mysql -u your_username -p your_database_name < database/migrate_batch_semester.sql
   ```

3. **Update your backend API** to handle the new `batch` and `semester` fields:
   - Student creation endpoints should accept `batch` and `semester`
   - Student retrieval should return `batch` and `semester`
   - Update any filtering/querying logic

4. **Update frontend components** that weren't automatically updated:
   - Any remaining forms that reference "year" should be updated to use "batch"
   - Add semester selection where appropriate
   - Update table displays to show both batch and semester

## Data Structure

### Before:
```typescript
interface Student {
  // ... other fields
  year: string; // e.g., "2024"
}
```

### After:
```typescript
interface Student {
  // ... other fields
  batch: string;    // e.g., "2024" 
  semester: number; // e.g., 3 (1-8)
}
```

## Batch Management Integration

The new structure integrates seamlessly with the existing Batch Management system:
- Batches are defined by year (e.g., "2024")
- Each batch can have up to 8 semesters
- Semester dates are managed through the BatchContext
- Reports can now filter by both batch and semester

## Benefits

1. **More Granular Control:** Students can be assigned to specific semesters within a batch
2. **Better Reporting:** Reports can be filtered by both batch and semester
3. **Semester-based Validation:** Leave requests are validated against specific semester dates
4. **Future-proof:** Easier to implement semester-specific features

## Testing

After migration, verify:
1. Student creation with batch and semester selection
2. Report filtering by batch and semester
3. Leave request validation against semester dates
4. Chart display and tooltip functionality
5. Existing student data migration accuracy
