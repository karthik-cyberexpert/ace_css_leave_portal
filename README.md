# Leave Portal System

A comprehensive leave management system for educational institutions, enabling students to apply for leave requests and OD (On Duty) requests, with role-based access for students, tutors, and administrators.

## Features

### For Students
- **Leave Requests**: Apply for various types of leave (Medical, Personal, Emergency, Academic)
- **OD Requests**: Apply for On Duty requests with certificate upload support
- **Status Tracking**: View status of submitted requests (Pending, Approved, Rejected, Forwarded, Retried)
- **Request Retry**: Retry rejected requests for reconsideration
- **Request Cancellation**: Request cancellation of approved/pending requests
- **Partial Cancellation**: Cancel specific date ranges within approved leave requests
- **Automatic Leave Count**: System automatically tracks and updates leave days taken
- **Profile Management**: Update personal information
- **Session Security**: Single active session per user
- **Real-time Updates**: Dashboard data refreshes automatically every 10 seconds without manual refresh

### For Tutors
- **Review Requests**: Approve or reject leave and OD requests
- **Partial Cancellation Review**: Approve or reject partial cancellation requests
- **Student Management**: View and manage assigned students with real-time leave counts
- **Dashboard**: Overview of pending requests and statistics
- **Real-time Updates**: Dashboard data refreshes automatically every 10 seconds without manual refresh

### For Administrators
- **User Management**: Create, update, and manage student and staff accounts
- **System Overview**: Complete visibility of all requests and users
- **Leave Day Management**: Automatic calculation and tracking of student leave days
- **Data Export**: Export system data for reporting
- **Automated Notifications**: System sends reminders for pending requests
- **Real-time Updates**: Dashboard data refreshes automatically every 10 seconds without manual refresh

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MySQL** database with proper schema design
- **JWT** authentication with session management
- **Multer** for file uploads
- **Bcrypt** for password hashing
- **Node-cron** for automated tasks
- **CORS** enabled for cross-origin requests

### Frontend
- **React** with React Router for navigation
- **Material-UI (MUI)** for modern UI components
- **React Hook Form** with Zod validation
- **Axios** for API communication
- **Context API** for state management

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leave_portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create MySQL database named `cyber_security_leave_portal`
   - Run the schema setup:
     ```bash
     mysql -u root -p cyber_security_leave_portal < database/schema.sql
     ```
   - Apply migrations:
     ```bash
     mysql -u root -p cyber_security_leave_portal < backend/migrations/add_last_notification_date.sql
     mysql -u root -p cyber_security_leave_portal < backend/migrations/add_partial_cancellation_fields.sql
     ```

4. **Environment Configuration**
   - Create `.env` file in the root directory
   - Configure database connection and JWT secret:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=cyber_security_leave_portal
     JWT_SECRET=your_jwt_secret_key
     PORT=5000
     ```

5. **Start the Application**
   ```bash
   # Start frontend (Vite dev server)
   npm run dev
   
   # Start both frontend and backend together
   npm run dev-full
   
   # Or start individually
   npm run server    # Backend only (port 3009)
   ```

6. **Access the Application**
   - Frontend: http://localhost:8085
   - Backend API: http://localhost:3009

### Default Admin Account
- **Username**: admin
- **Password**: admin123
- **Role**: Admin

*Please change the default admin password after first login.*

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### User Management
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Leave Requests
- `GET /api/leave-requests` - Get leave requests
- `POST /api/leave-requests` - Create leave request
- `PUT /api/leave-requests/:id` - Update leave request status

### OD Requests
- `GET /api/od-requests` - Get OD requests
- `POST /api/od-requests` - Create OD request with file upload
- `PUT /api/od-requests/:id` - Update OD request status
- `GET /api/od-requests/:id/certificate` - Download OD certificate

## Project Structure

```
leave_portal/
├── backend/
│   ├── server.js              # Main server file
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── utils/
│   │   └── sessionUtils.js    # Session management utilities
│   ├── migrations/            # Database migration files
│   └── uploads/              # File upload directory
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   ├── pages/            # Page components
│   │   └── utils/            # Utility functions
│   └── package.json
├── database/
│   └── schema.sql            # Database schema
└── package.json              # Root package configuration
```

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Single active session per user
- **Role-Based Access Control**: Different permissions for different user roles
- **File Upload Security**: Restricted file types and sizes
- **SQL Injection Prevention**: Parameterized queries

## Automated Features

- **Daily Reminders**: Automated email reminders for pending requests
- **Session Cleanup**: Automatic cleanup of expired sessions
- **File Management**: Organized file storage for OD certificates
- **Leave Day Tracking**: Automatic calculation and update of student leave days based on approvals and cancellations
- **Real-time Data Updates**: Automatic polling every 10 seconds for real-time updates across all user interfaces with intelligent rate limiting

## Development

### Available Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start backend server only
- `npm run client` - Start frontend client only
- `npm run build` - Build frontend for production

### Database Migrations

To create a new migration:
1. Create SQL file in `backend/migrations/`
2. Run using MySQL CLI or create a Node.js migration script

## Deployment

### Production Checklist
- [ ] Change default admin password
- [ ] Set strong JWT secret
- [ ] Configure production database
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up file upload limits
- [ ] Configure email service for notifications
- [ ] Set up monitoring and logging

## Support

For detailed setup instructions, see `README-MYSQL-SETUP.md`.

For issues and support, please check the documentation or contact the development team.

## License

This project is licensed under the MIT License.
