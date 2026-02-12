-- ============================================
-- LEAVE MANAGEMENT SYSTEM - DATABASE SETUP
-- ============================================
-- This script creates the complete database structure
-- for the Leave Management System
--
-- HOW TO USE:
-- 1. Open MySQL Workbench
-- 2. Copy and paste this entire file
-- 3. Click Execute (⚡ lightning bolt icon)
-- 4. Database will be created with all tables and sample data
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS employee_app;
USE employee_app;

-- ============================================
-- TABLE 1: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('EMPLOYEE', 'HR', 'ADMIN') DEFAULT 'EMPLOYEE',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 2: employees
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  employee_code VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  designation VARCHAR(100),
  department VARCHAR(100),
  joining_date DATE,
  confirmation_date DATE,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE 3: leave_types
-- ============================================
CREATE TABLE IF NOT EXISTS leave_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  min_notice_days INT DEFAULT 0,
  allow_past_dates BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 4: leave_balances
-- ============================================
CREATE TABLE IF NOT EXISTS leave_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  total_allowed INT NOT NULL,
  used INT DEFAULT 0,
  remaining INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_employee_leave (employee_id, leave_type_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE 5: leave_requests
-- ============================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT NOT NULL,
  attachment_url VARCHAR(255),
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actioned_by INT,
  actioned_at TIMESTAMP NULL,
  rejection_reason TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  FOREIGN KEY (actioned_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_leave_requests_status (status),
  INDEX idx_leave_requests_employee (employee_id)
);

-- ============================================
-- TABLE 6: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert Users
INSERT INTO users (email, password, role, is_active) VALUES
('ali@conceptrecall.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'EMPLOYEE', TRUE),
('hr@conceptrecall.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'HR', TRUE),
('admin@conceptrecall.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'ADMIN', TRUE);

-- Insert Employees
INSERT INTO employees (user_id, employee_code, first_name, last_name, designation, department, joining_date, confirmation_date) VALUES
(1, 'CR-EMP-001', 'Ali', 'Khan', 'Software Engineer', 'IT', '2024-01-15', '2024-07-15'),
(2, 'CR-HR-001', 'Sara', 'Ahmed', 'HR Manager', 'Human Resources', '2023-06-01', '2023-12-01'),
(3, 'CR-ADM-001', 'Ahmed', 'Hassan', 'System Admin', 'IT', '2023-01-01', '2023-07-01');

-- Insert Leave Types
INSERT INTO leave_types (code, name, min_notice_days, allow_past_dates) VALUES
('CL', 'Casual Leave', 1, FALSE),
('SL', 'Sick Leave', 0, TRUE),
('AL', 'Annual Leave', 15, FALSE),
('HAJJ', 'Hajj Leave', 30, FALSE),
('PL', 'Paternity Leave', 7, FALSE);

-- Insert Leave Balances for Employee 1 (Ali)
INSERT INTO leave_balances (employee_id, leave_type_id, total_allowed, used, remaining) VALUES
(1, 1, 12, 0, 12),  -- Casual Leave
(1, 2, 10, 0, 10),  -- Sick Leave
(1, 3, 20, 0, 20),  -- Annual Leave
(1, 4, 0, 0, 0),    -- Hajj Leave
(1, 5, 5, 0, 5);    -- Paternity Leave

-- Insert Leave Balances for Employee 2 (HR)
INSERT INTO leave_balances (employee_id, leave_type_id, total_allowed, used, remaining) VALUES
(2, 1, 12, 0, 12),
(2, 2, 10, 0, 10),
(2, 3, 20, 0, 20),
(2, 4, 0, 0, 0),
(2, 5, 5, 0, 5);

-- Insert Leave Balances for Employee 3 (Admin)
INSERT INTO leave_balances (employee_id, leave_type_id, total_allowed, used, remaining) VALUES
(3, 1, 12, 0, 12),
(3, 2, 10, 0, 10),
(3, 3, 20, 0, 20),
(3, 4, 0, 0, 0),
(3, 5, 5, 0, 5);

-- ============================================
-- CREATE TRIGGER FOR AUTOMATIC BALANCE SYNC
-- ============================================
DROP TRIGGER IF EXISTS after_leave_status_change;

DELIMITER $$

CREATE TRIGGER after_leave_status_change
AFTER UPDATE ON leave_requests
FOR EACH ROW
BEGIN
  -- Only run when status changes from PENDING to APPROVED or REJECTED
  IF OLD.status = 'PENDING' AND (NEW.status = 'APPROVED' OR NEW.status = 'REJECTED') THEN
    
    -- Update leave_balances table automatically
    UPDATE leave_balances
    SET 
      -- Calculate used: sum of all APPROVED leaves
      used = (
        SELECT COALESCE(SUM(total_days), 0)
        FROM leave_requests
        WHERE employee_id = NEW.employee_id
          AND leave_type_id = NEW.leave_type_id
          AND status = 'APPROVED'
      ),
      -- Calculate remaining: total_allowed - used
      remaining = total_allowed - (
        SELECT COALESCE(SUM(total_days), 0)
        FROM leave_requests
        WHERE employee_id = NEW.employee_id
          AND leave_type_id = NEW.leave_type_id
          AND status = 'APPROVED'
      ),
      -- Update timestamp
      updated_at = NOW()
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id;
      
  END IF;
END$$

DELIMITER ;

-- ============================================
-- VERIFY DATABASE CREATION
-- ============================================

-- Show all tables
SHOW TABLES;

-- Show table structures
DESCRIBE users;
DESCRIBE employees;
DESCRIBE leave_types;
DESCRIBE leave_balances;
DESCRIBE leave_requests;
DESCRIBE notifications;

-- Show triggers
SHOW TRIGGERS;

-- Show sample data
SELECT 'Users:' as Info;
SELECT * FROM users;

SELECT 'Employees:' as Info;
SELECT * FROM employees;

SELECT 'Leave Types:' as Info;
SELECT * FROM leave_types;

SELECT 'Leave Balances:' as Info;
SELECT * FROM leave_balances;

-- ============================================
-- DATABASE SETUP COMPLETE!
-- ============================================
-- Your database is now ready to use!
-- 
-- Default Login Credentials:
-- Employee: ali@conceptrecall.com / password
-- HR: hr@conceptrecall.com / password
-- Admin: admin@conceptrecall.com / password
--
-- Note: Passwords are hashed with bcrypt
-- You need to hash your actual passwords before inserting
-- ============================================
