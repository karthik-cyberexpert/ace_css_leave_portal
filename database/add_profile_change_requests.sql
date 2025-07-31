-- Create profile_change_requests table for handling student profile change requests
-- This table stores requests for email, phone, and password changes that need approval

CREATE TABLE profile_change_requests (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_register_number VARCHAR(50) NOT NULL,
  tutor_id VARCHAR(36) NOT NULL,
  tutor_name VARCHAR(255) NOT NULL,
  change_type ENUM('email', 'mobile', 'password') NOT NULL,
  current_value TEXT,
  requested_value TEXT NOT NULL,
  reason TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  admin_comments TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewer_name VARCHAR(255) NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_tutor_id (tutor_id),
  INDEX idx_status (status),
  INDEX idx_change_type (change_type),
  INDEX idx_requested_at (requested_at),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (tutor_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Add index for efficient querying by student and status
CREATE INDEX idx_student_status ON profile_change_requests (student_id, status);

-- Add index for efficient querying by tutor and status
CREATE INDEX idx_tutor_status ON profile_change_requests (tutor_id, status);
