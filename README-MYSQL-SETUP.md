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

### 2. Database Configuration

1. Edit `backend/config/database.js` and update the MySQL connection settings:
   ```javascript
   export const dbConfig = {
     host: 'localhost',
     user: 'your_mysql_username',    // Change this
     password: 'your_mysql_password', // Change this
     database: 'radiant_zebra_twirl',
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

The backend server runs on `http://localhost:4000` and provides the following endpoints:

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
- `students` - Student details
- `leave_requests` - Leave request records
- `od_requests` - On-duty request records

## Migration Notes

- Replaced Supabase client with custom Axios-based client
- Maintained same interface for minimal code changes
- Added JWT-based authentication
- All real-time features are currently disabled (can be added with WebSockets if needed)

## Troubleshooting

1. **Port 5000 in use**: Change the port in `backend/server.js`
2. **Database connection failed**: Check MySQL credentials in `backend/config/database.js`
3. **CORS issues**: Backend includes CORS middleware for local development
