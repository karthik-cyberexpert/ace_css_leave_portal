# Leave Portal API Documentation

## Base URL
```
http://localhost:3009
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### POST /auth/login
Login with username or email and password.

**Request Body:**
```json
{
  "identifier": "admin", // username or email
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "email": "admin@college.portal"
  },
  "message": "Login successful. Any previous sessions have been terminated."
}
```

### POST /auth/logout
Logout and invalidate current session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## User Profile

### GET /profile
Get current user profile information.

**Response:**
```json
{
  "id": "admin-001",
  "email": "admin@college.portal",
  "first_name": "Admin",
  "last_name": "User",
  "profile_photo": null,
  "is_admin": true,
  "is_tutor": true
}
```

---

## Student Management

### GET /students
Get all students (Admin/Tutor only).

**Response:**
```json
[
  {
    "id": "student-001",
    "name": "John Doe",
    "register_number": "REG001",
    "tutor_id": "tutor-001",
    "year": "2024",
    "leave_taken": 5,
    "username": "johndoe",
    "profile_photo": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /students
Create new student (Admin only).

**Request Body:**
```json
{
  "email": "student@college.portal",
  "password": "password123",
  "name": "John Doe",
  "registerNumber": "REG001",
  "tutorId": "tutor-001",
  "year": "2024",
  "username": "johndoe",
  "profilePhoto": "base64_image_data"
}
```

### PUT /students/:id
Update student information.

**Request Body:**
```json
{
  "name": "John Smith",
  "year": "2025"
}
```

### DELETE /students/:id
Delete student (Admin only).

---

## Staff Management

### GET /staff
Get all staff members.

**Response:**
```json
[
  {
    "id": "staff-001",
    "name": "Dr. Smith",
    "email": "smith@college.portal",
    "username": "drsmith",
    "is_admin": false,
    "is_tutor": true,
    "profile_photo": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /staff
Create new staff member (Admin only).

**Request Body:**
```json
{
  "email": "newstaff@college.portal",
  "password": "password123",
  "name": "Dr. Johnson",
  "username": "drjohnson",
  "isAdmin": false,
  "isTutor": true
}
```

### PUT /staff/:id
Update staff information.

### DELETE /staff/:id
Delete staff member (Admin only).

---

## Leave Requests

### GET /leave-requests
Get leave requests based on user role.

**Response:**
```json
[
  {
    "id": "leave-001",
    "student_id": "student-001",
    "student_name": "John Doe",
    "student_register_number": "REG001",
    "tutor_id": "tutor-001",
    "tutor_name": "Dr. Smith",
    "start_date": "2024-02-01",
    "end_date": "2024-02-03",
    "total_days": 3,
    "partial_cancel_start": null,
    "partial_cancel_end": null,
    "partial_cancel_days": null,
    "subject": "Medical Leave",
    "description": "Doctor appointment",
    "status": "Approved",
    "cancel_reason": null,
    "original_status": null,
    "created_at": "2024-01-28T00:00:00.000Z",
    "updated_at": "2024-01-28T00:00:00.000Z"
  }
]
```

### POST /leave-requests
Create new leave request (Student only).

**Request Body:**
```json
{
  "startDate": "2024-02-01",
  "endDate": "2024-02-03",
  "totalDays": 3,
  "subject": "Medical Leave",
  "description": "Doctor appointment"
}
```

### PUT /leave-requests/:id/status
Update leave request status.

**Request Body:**
```json
{
  "status": "Approved",
  "cancelReason": "Optional cancellation reason"
}
```

**For Partial Cancellation:**
```json
{
  "status": "Cancellation Pending",
  "cancelReason": "Need to attend classes",
  "startDate": "2024-02-02",
  "endDate": "2024-02-02",
  "isPartial": true
}
```

---

## OD Requests

### GET /od-requests
Get OD requests based on user role.

**Response:**
```json
[
  {
    "id": "od-001",
    "student_id": "student-001",
    "student_name": "John Doe",
    "student_register_number": "REG001",
    "tutor_id": "tutor-001",
    "tutor_name": "Dr. Smith",
    "start_date": "2024-02-01",
    "end_date": "2024-02-01",
    "total_days": 1,
    "purpose": "Conference",
    "destination": "City Hall",
    "description": "Technical conference attendance",
    "status": "Approved",
    "cancel_reason": null,
    "certificate_url": null,
    "certificate_status": "Pending Upload",
    "upload_deadline": "2024-02-08",
    "last_notification_date": null,
    "original_status": null,
    "created_at": "2024-01-28T00:00:00.000Z",
    "updated_at": "2024-01-28T00:00:00.000Z"
  }
]
```

### POST /od-requests
Create new OD request (Student only).

**Request Body:**
```json
{
  "startDate": "2024-02-01",
  "endDate": "2024-02-01",
  "totalDays": 1,
  "purpose": "Conference",
  "destination": "City Hall",
  "description": "Technical conference attendance"
}
```

### PUT /od-requests/:id/status
Update OD request status.

**Request Body:**
```json
{
  "status": "Approved",
  "cancelReason": "Optional cancellation reason"
}
```

### PUT /od-requests/:id/certificate
Upload OD certificate (Student only).

**Request Body:**
```json
{
  "certificateUrl": "base64_certificate_data"
}
```

### PUT /od-requests/:id/certificate/verify
Verify OD certificate (Tutor/Admin only).

**Request Body:**
```json
{
  "isApproved": true
}
```

---

## Notifications

### GET /notifications/od-certificate-reminders
Get OD certificate upload reminders for current user.

**Response:**
```json
{
  "reminders": [
    {
      "id": "od-001",
      "purpose": "Conference",
      "destination": "City Hall",
      "endDate": "2024-02-01",
      "deadline": "2024-02-04",
      "daysLeft": 2,
      "isUrgent": false
    }
  ],
  "count": 1
}
```

---

## Admin Endpoints

### PUT /od-requests/handle-overdue-certificates
Mark overdue certificates (Admin only).

**Response:**
```json
{
  "message": "Overdue certificates processed successfully",
  "overdueCount": 3
}
```

### POST /admin/process-od-certificates
Manual trigger for OD certificate processing (Admin only).

**Response:**
```json
{
  "message": "OD certificate processing completed",
  "autoRejected": 2,
  "remindersSent": 5
}
```

### DELETE /admin/clear-all-requests
Clear all requests and reset student leave counts (Admin only).

**Response:**
```json
{
  "message": "All requests and student leave history cleared successfully",
  "clearedLeaveRequests": 150,
  "clearedODRequests": 75,
  "resetStudentLeaveCount": 50
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Session expired or invalid. Please login again.",
  "code": "SESSION_INVALID"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Request Status Values
- `Pending` - Initial status after submission
- `Approved` - Approved by tutor/admin
- `Rejected` - Rejected by tutor/admin
- `Forwarded` - Forwarded to higher authority
- `Cancelled` - Cancelled (approved cancellation)
- `Cancellation Pending` - Cancellation requested, awaiting approval
- `Retried` - Re-submitted after rejection

## Certificate Status Values (OD Requests only)
- `Pending Upload` - Certificate upload required
- `Pending Verification` - Certificate uploaded, awaiting verification
- `Approved` - Certificate verified and approved
- `Rejected` - Certificate rejected
- `Overdue` - Certificate upload deadline passed

---

## Database Schema Changes (v2.1.0)

### New Fields in `leave_requests` table:
- `partial_cancel_start` (DATE) - Start date for partial cancellation
- `partial_cancel_end` (DATE) - End date for partial cancellation  
- `partial_cancel_days` (INT) - Number of days being partially cancelled

### Automatic Leave Day Tracking:
- Student `leave_taken` field automatically updates based on leave request approvals/cancellations
- OD requests do not affect leave day counts
- Partial cancellations properly adjust leave day calculations
