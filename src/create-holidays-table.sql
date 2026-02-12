-- ============================================
-- CREATE HOLIDAYS TABLE IN MYSQL
-- ============================================
-- This script creates a holidays table and inserts all holidays data
--
-- HOW TO USE:
-- 1. Open MySQL Workbench
-- 2. Connect to your database
-- 3. Copy and paste this entire file
-- 4. Click Execute (⚡ lightning bolt icon)
-- ============================================

USE employee_app;

-- ============================================
-- CREATE HOLIDAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS holidays (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  weekday VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_holidays_date (date),
  INDEX idx_holidays_year (year)
);

-- ============================================
-- INSERT HOLIDAYS DATA
-- ============================================

-- Clear existing data (if any)
TRUNCATE TABLE holidays;

-- Insert 2026 Holidays
INSERT INTO holidays (date, name, weekday, year) VALUES
('2026-01-01', 'New Year''s Day', 'Thursday', 2026),
('2026-02-14', 'Valentine''s Day', 'Saturday', 2026),
('2026-03-23', 'Pakistan Day', 'Monday', 2026),
('2026-04-10', 'Eid ul-Fitr (Expected)', 'Friday', 2026),
('2026-05-01', 'Labour Day', 'Friday', 2026),
('2026-06-17', 'Eid ul-Adha (Expected)', 'Wednesday', 2026),
('2026-07-06', 'Muharram (Expected)', 'Monday', 2026),
('2026-08-14', 'Independence Day', 'Friday', 2026),
('2026-09-15', 'Eid Milad-un-Nabi (Expected)', 'Tuesday', 2026),
('2026-11-09', 'Iqbal Day', 'Monday', 2026),
('2026-12-25', 'Quaid-e-Azam Day / Christmas', 'Friday', 2026);

-- Insert 2027 Holidays
INSERT INTO holidays (date, name, weekday, year) VALUES
('2027-01-01', 'New Year''s Day', 'Friday', 2027),
('2027-02-14', 'Valentine''s Day', 'Sunday', 2027),
('2027-03-23', 'Pakistan Day', 'Tuesday', 2027),
('2027-05-01', 'Labour Day', 'Saturday', 2027),
('2027-08-14', 'Independence Day', 'Saturday', 2027),
('2027-12-25', 'Quaid-e-Azam Day / Christmas', 'Saturday', 2027);

-- ============================================
-- VERIFY DATA
-- ============================================

-- Show all holidays
SELECT * FROM holidays ORDER BY date;

-- Count holidays by year
SELECT year, COUNT(*) as total_holidays 
FROM holidays 
GROUP BY year;

-- Show upcoming holidays (from today)
SELECT * FROM holidays 
WHERE date >= CURDATE() 
ORDER BY date 
LIMIT 5;

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Get holidays for a specific year
-- SELECT * FROM holidays WHERE year = 2026;

-- Get holidays for a specific month
-- SELECT * FROM holidays WHERE MONTH(date) = 3 AND year = 2026;

-- Check if a specific date is a holiday
-- SELECT * FROM holidays WHERE date = '2026-03-23';

-- Get next 10 upcoming holidays
-- SELECT * FROM holidays WHERE date >= CURDATE() ORDER BY date LIMIT 10;

-- ============================================
-- HOLIDAYS TABLE CREATED SUCCESSFULLY!
-- ============================================
-- Total holidays inserted: 17
-- Years covered: 2026-2027
-- ============================================
    