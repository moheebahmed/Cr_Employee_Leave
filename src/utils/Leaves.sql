CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('EMPLOYEE', 'HR') NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    employee_code VARCHAR(50) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    joining_date DATE,
    confirmation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    min_notice_days INT DEFAULT 0,
    allow_past_dates TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rules encoded here:
-- CL → min_notice_days = 1
-- AL → min_notice_days = 15
-- SL → allow_past_dates = 1

CREATE TABLE leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    total_allowed INT NOT NULL,
    used INT DEFAULT 0,
    remaining INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_employee_leave (employee_id, leave_type_id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
);

CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT NOT NULL,
    attachment_url VARCHAR(255),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actioned_by INT NULL,
    actioned_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (actioned_by) REFERENCES users(id)
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150),
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


-- Mock Data 
INSERT INTO users (email, password_hash, role) VALUES
('hr@conceptrecall.com', 'hashed_password', 'HR'),
('ali@conceptrecall.com', 'hashed_password', 'EMPLOYEE');

INSERT INTO employees (user_id, employee_code, full_name, department, designation, joining_date, confirmation_date)
VALUES
(2, 'CR-EMP-001', 'Ali Khan', 'Engineering', 'Software Engineer', '2024-01-15', '2024-07-15');

INSERT INTO leave_types (code, name, min_notice_days, allow_past_dates) VALUES
('CL', 'Casual Leave', 1, 0),
('SL', 'Sick Leave', 0, 1),
('AL', 'Annual Leave', 15, 0),
('HJ', 'Hajj Leave', 30, 0),
('PL', 'Paternity Leave', 7, 0);

INSERT INTO leave_balances (employee_id, leave_type_id, total_allowed, used, remaining) VALUES
(1, 1, 12, 2, 10),
(1, 2, 10, 1, 9),
(1, 3, 20, 0, 20);

INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason)
VALUES
(1, 1, '2026-02-10', '2026-02-11', 2, 'Family commitment');



--
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

