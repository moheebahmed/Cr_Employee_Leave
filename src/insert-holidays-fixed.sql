-- ============================================
-- INSERT ALL HOLIDAYS - FIXED VERSION
-- ============================================
-- Run this in phpMyAdmin to add all holidays
-- ============================================

USE employee_app;

-- Clear existing data
DELETE FROM holidays;

-- Insert each holiday separately (more reliable)
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-01-01', 'New Year''s Day', 'Thursday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-02-14', 'Valentine''s Day', 'Saturday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-03-23', 'Pakistan Day', 'Monday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-04-10', 'Eid ul-Fitr (Expected)', 'Friday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-05-01', 'Labour Day', 'Friday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-06-17', 'Eid ul-Adha (Expected)', 'Wednesday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-07-06', 'Muharram (Expected)', 'Monday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-08-14', 'Independence Day', 'Friday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-09-15', 'Eid Milad-un-Nabi (Expected)', 'Tuesday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-11-09', 'Iqbal Day', 'Monday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2026-12-25', 'Quaid-e-Azam Day / Christmas', 'Friday', 2026);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2027-01-01', 'New Year''s Day', 'Friday', 2027);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2027-02-14', 'Valentine''s Day', 'Sunday', 2027);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2027-03-23', 'Pakistan Day', 'Tuesday', 2027);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2027-05-01', 'Labour Day', 'Saturday', 2027);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2027-08-14', 'Independence Day', 'Saturday', 2027);
INSERT INTO holidays (date, name, weekday, year) VALUES ('2027-12-25', 'Quaid-e-Azam Day / Christmas', 'Saturday', 2027);

-- Verify
SELECT COUNT(*) as total_holidays FROM holidays;
SELECT * FROM holidays WHERE date >= CURDATE() ORDER BY date LIMIT 5;
