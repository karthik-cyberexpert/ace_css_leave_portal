# Admin Dashboard Updates - Absent Students Table

## Overview
The admin dashboard has been enhanced to include a today's absent students table positioned above the weekly report chart. This provides administrators with an immediate view of which students are currently absent (on leave or OD) on the current date.

## Changes Made

### 1. New Component: `AbsentStudentsTable.tsx`
- **Location**: `src/components/AbsentStudentsTable.tsx`
- **Purpose**: Displays a table of students who are absent today (on leave or OD)
- **Features**:
  - Shows student name, register number, batch, semester, and status
  - Responsive design with proper mobile support
  - Color-coded badges for different absence types
  - Empty state when no students are absent
  - Batch filtering support

### 2. Updated Admin Dashboard Layout
- **Location**: `src/pages/AdminDashboardPage.tsx`
- **Changes**:
  - Added absent students logic to calculate today's absent students
  - Reorganized layout using `space-y-6` for better spacing
  - Added absent students table between stats cards and weekly chart
  - Enhanced weekly chart data to include both leave and OD statistics
  - Improved batch filtering that affects both table and chart

### 3. Enhanced Weekly Chart Data
- **Updates**:
  - Now includes both leave and OD requests in calculations
  - Better date range checking with overlap detection
  - Separate visualization for single batch vs all batches
  - Combined absence count for multi-batch view
  - Separate leave/OD counts for single batch view

## Layout Structure
The admin dashboard now follows this layout hierarchy:

1. **Header Section**: Title and description
2. **Stats Cards**: 3-column grid showing pending leaves, ODs, and total students
3. **Absent Students Table**: Full-width table showing today's absent students
4. **Weekly Chart**: Full-width chart showing weekly leave/OD statistics

## Features

### Batch Selection Integration
- The batch selector in the weekly chart now affects both:
  - The absent students table (filters to show only selected batch students)
  - The weekly chart data (shows batch-specific or all-batch data)

### Real-time Date Calculation
- Uses timezone-safe date formatting via `formatDateToLocalISO` utility
- Automatically shows today's date in the table header
- Properly handles date comparisons for current day absent status

### Responsive Design
- Table is fully responsive with horizontal scrolling on mobile
- Maintains consistent styling with existing components
- Proper spacing and visual hierarchy

## Data Logic

### Absent Students Calculation
1. Gets today's date using timezone-safe formatting
2. Filters students by selected batch (if not 'all')
3. Checks both approved leave and OD requests
4. Determines if each student has an active request for today
5. Returns only students who are absent with their status

### Weekly Chart Data
1. Processes both leave and OD requests marked as 'Approved'
2. Groups data by weeks within the selected month
3. For 'All Batches': Shows combined absence counts per batch
4. For specific batch: Shows separate leave and OD counts
5. Properly handles date range overlaps and spans

## Benefits
- **Quick Overview**: Administrators can immediately see who's absent today
- **Better Decision Making**: Easy access to current absence information
- **Improved Workflow**: No need to navigate to separate reports for today's status
- **Consistent Filtering**: Batch selection affects all relevant data views
- **Professional Appearance**: Maintains design consistency with existing interface

## Technical Implementation
- **Components**: Reusable `AbsentStudentsTable` component
- **State Management**: Integrated with existing `useAppContext` and `useBatchContext`
- **Date Handling**: Uses timezone-safe date utilities
- **Performance**: Optimized with `useMemo` for data calculations
- **Accessibility**: Proper table structure and semantic HTML
