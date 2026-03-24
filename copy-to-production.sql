-- Run this on your PRODUCTION database (195.35.36.104:3307)
-- This will update the leave balances to match your local data

-- First, check what's currently in production
SELECT 'Current Production Data:' as info;
SELECT * FROM leave_balances WHERE employee_id = 1;

-- Update the balances to match your local database
UPDATE leave_balances 
SET used = 2, remaining = 10, updated_at = NOW()
WHERE employee_id = 1 AND leave_type_id = 1; -- Casual Leave

UPDATE leave_balances 
SET used = 1, remaining = 9, updated_at = NOW()
WHERE employee_id = 1 AND leave_type_id = 2; -- Sick Leave

UPDATE leave_balances 
SET used = 0, remaining = 20, updated_at = NOW()
WHERE employee_id = 1 AND leave_type_id = 3; -- Annual Leave

UPDATE leave_balances 
SET used = 2, remaining = 10, updated_at = NOW()
WHERE employee_id = 1 AND leave_type_id = 4; -- Hajj Leave

UPDATE leave_balances 
SET used = 1, remaining = 9, updated_at = NOW()
WHERE employee_id = 1 AND leave_type_id = 5; -- Paternity Leave

-- Verify the update
SELECT 'Updated Production Data:' as info;
SELECT * FROM leave_balances WHERE employee_id = 1;
