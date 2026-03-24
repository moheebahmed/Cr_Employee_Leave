-- This will update all leave_balances to match actual APPROVED leaves
-- Run this in TablePlus to sync your data

UPDATE leave_balances lb
SET 
  used = (
    SELECT COALESCE(SUM(total_days), 0)
    FROM leave_requests
    WHERE employee_id = lb.employee_id
      AND leave_type_id = lb.leave_type_id
      AND status = 'APPROVED'
  ),
  remaining = total_allowed - (
    SELECT COALESCE(SUM(total_days), 0)
    FROM leave_requests
    WHERE employee_id = lb.employee_id
      AND leave_type_id = lb.leave_type_id
      AND status = 'APPROVED'
  ),
  updated_at = NOW();

-- Verify the update
SELECT * FROM leave_balances WHERE employee_id = 1;
