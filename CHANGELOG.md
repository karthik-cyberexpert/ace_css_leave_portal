# Changelog

All notable changes to the Leave Portal System will be documented in this file.

## [2.1.0] - 2025-01-29

### 🆕 New Features

#### Partial Leave Cancellation
- **Students** can now request partial cancellation of approved leave requests
- Option to specify date ranges within approved leave periods for cancellation
- Visual feedback showing days to be cancelled and remaining leave days
- Automatic adjustment of leave day counts based on partial cancellations

#### Automatic Leave Day Tracking
- System automatically tracks student leave days taken
- Leave counts update in real-time when requests are approved or cancelled
- Separate tracking for leave requests (counted) vs OD requests (not counted)
- Prevents manual errors in leave day calculations

#### Enhanced User Interface
- Dark/Light theme toggle with system preference detection
- Default light theme for better accessibility
- Improved cancellation modal with date range selectors
- Real-time leave day count display in student profiles

#### Real-time Data Updates
- Automatic data polling every 30 seconds for all users
- Manual refresh option for immediate data updates
- Focus-based polling when users return to the application
- Rate limiting to prevent excessive API calls

### 🔧 Technical Improvements

#### Database Schema Updates
- Added `partial_cancel_start`, `partial_cancel_end`, `partial_cancel_days` fields to `leave_requests` table
- New database index for better partial cancellation query performance
- Migration script for existing installations

#### Backend Enhancements
- Enhanced leave request status update logic
- Automatic leave day calculation based on request status changes
- Support for partial cancellation data in API endpoints
- Improved error handling and validation

#### Frontend Architecture
- Updated React context to handle partial cancellation data
- Enhanced form validation for date range selections
- Improved state management for real-time updates
- Better user feedback and loading states

### 📚 Documentation Updates
- Updated README.md with new feature descriptions
- Enhanced API documentation
- Database schema documentation updates
- Migration instructions for existing installations

### 🔄 Database Migrations
- `add_partial_cancellation_fields.sql` - Adds support for partial leave cancellations

## [2.0.0] - Previous Release

### Major Features
- Complete leave management system
- OD request handling with certificate uploads
- Role-based access control (Students, Tutors, Admins)
- Session management and security
- Automated reminders and notifications

---

## Migration Guide

### From v2.0.0 to v2.1.0

1. **Database Migration**
   ```bash
   mysql -u root -p cyber_security_leave_portal < backend/migrations/add_partial_cancellation_fields.sql
   ```

2. **Update Dependencies**
   ```bash
   npm install
   ```

3. **Restart Application**
   ```bash
   npm run dev-full
   ```

### Breaking Changes
- None. This is a backwards-compatible update.

### New Configuration Options
- No new configuration required
- All new features work with existing setup

---

## Feature Impact

### For Students
- More flexible leave management with partial cancellations
- Accurate real-time leave day tracking
- Better user experience with theme options

### For Tutors
- Better oversight of student leave patterns
- Simplified approval process for partial cancellations
- Real-time data for better decision making

### For Administrators
- Reduced manual intervention in leave day calculations
- Better system reliability with automatic updates
- Enhanced reporting capabilities

---

## Technical Details

### API Changes
- Enhanced `PUT /leave-requests/:id/status` endpoint to handle partial cancellations
- New fields in request/response payloads for partial cancellation data
- Backward compatible with existing API clients

### Database Changes
- New columns added to `leave_requests` table
- New database index for performance optimization
- Existing data remains unchanged

### Performance Improvements
- Optimized database queries for leave day calculations
- Efficient real-time polling with rate limiting
- Better caching for frequently accessed data
