-- CivicLens MySQL Database Schema
-- Compatible with MySQL 8.x and Aiven Cloud MySQL

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_code VARCHAR(16) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  locality VARCHAR(255) NOT NULL,
  landmark VARCHAR(255) NULL,
  citizen_name VARCHAR(150) NULL,
  citizen_phone VARCHAR(30) NULL,
  citizen_email VARCHAR(150) NULL,
  image_url MEDIUMTEXT NULL,
  image_public_id VARCHAR(255) NULL,
  issue_type VARCHAR(100) NOT NULL,
  severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
  department VARCHAR(100) NOT NULL,
  ai_summary TEXT NULL,
  ai_risk_reason TEXT NULL,
  ai_recommended_action TEXT NULL,
  ai_confidence ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  needs_human_review BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('SUBMITTED', 'IN_REVIEW', 'ACTION_SCHEDULED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  admin_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_complaints_code (complaint_code),
  INDEX idx_complaints_status (status),
  INDEX idx_complaints_severity (severity),
  INDEX idx_complaints_department (department),
  INDEX idx_complaints_created_at (created_at),
  INDEX idx_complaints_locality (locality)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Complaint Status History Table
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  from_status VARCHAR(50) NULL,
  to_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(150) NOT NULL,
  change_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_history_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  INDEX idx_history_complaint_id (complaint_id),
  INDEX idx_history_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
