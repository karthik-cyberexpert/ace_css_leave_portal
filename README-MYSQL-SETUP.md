# MySQL Migration Setup Guide

This project has been migrated from Supabase to MySQL. Follow these steps to set up the application:

## Prerequisites

1. **MySQL Server** - Ensure MySQL is installed and running on your local machine
2. **Node.js** - Make sure you have Node.js installed

## Setup Steps

### 1. Database Setup

1. Start your MySQL server
2. Create the database and tables by running the schema:
   ```bash
   # In PowerShell
   Get-Content database\schema.sql | mysql -u root -p
   ```
   Or manually execute the `database/schema.sql` file in your MySQL client.

3. Apply the latest migrations:
   ```bash
   # Apply OD certificate reminders migration
   mysql -u root -p cyber_security_leave_portal < backend/migrations/add_last_notification_date.sql
   
   # Apply partial cancellation support migration
   mysql -u root -p cyber_security_leave_portal < backend/migrations/add_partial_cancellation_fields.sql
   ```

### 2. Database Configuration

1. Edit `backend/config/database.js` and update the MySQL connection settings:
   ```javascript
   export const dbConfig = {
     host: 'localhost',
     user: 'your_mysql_username',    // Change this
     password: 'your_mysql_password', // Change this
     database: 'cyber_security_leave_portal',
     // ... other settings
   };
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Application

```bash
# Start both backend server and frontend
npm run dev

# Or start them separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run dev
```

## Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123`

## API Endpoints

The backend server runs on `http://localhost:3002` and provides the following endpoints:

- `GET /test-db` - Test database connection

- `POST /auth/login` - User authentication
- `GET /profile` - Get user profile
- `GET /students` - Get all students
- `POST /students` - Create new student
- `GET /staff` - Get all staff
- `POST /staff` - Create new staff
- `GET /leave-requests` - Get leave requests
- `POST /leave-requests` - Create leave request
- `GET /od-requests` - Get OD requests
- `POST /od-requests` - Create OD request

## Database Schema

The application uses the following main tables:
- `users` - Authentication and user profile data
- `staff` - Staff member details  
- `students` - Student details with automatic leave day tracking
- `leave_requests` - Leave request records with partial cancellation support
- `od_requests` - On-duty request records with certificate management
- `user_sessions` - Session management for security

## Migration Notes

- Replaced Supabase client with custom Axios-based client
- Maintained same interface for minimal code changes
- Added JWT-based authentication with session management
- Real-time features implemented with automatic polling
- Enhanced leave management with partial cancellations
- Automatic leave day tracking and calculations

## Latest Features (v2.1.0)

- **Partial Leave Cancellation**: Students can cancel specific date ranges within approved leave
- **Automatic Leave Day Tracking**: System automatically calculates and updates leave days
- **Real-time Updates**: Data refreshes automatically every 10 seconds
- **Dark/Light Theme**: Theme toggle with system preference support
- **Enhanced Security**: Single session management per user

## Troubleshooting

1. **Port 3002 in use**: Change the port in `backend/server.js`
2. **Database connection failed**: Check MySQL credentials in `backend/config/database.js`
3. **CORS issues**: Backend includes CORS middleware for local development
4. **Migration errors**: Ensure you have proper MySQL permissions for CREATE and ALTER operations
5. **Real-time updates not working**: Check browser console for API connection errors
