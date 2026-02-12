-- ============================================
-- SYNC EXISTING DATA IN leave_balances TABLE
-- ============================================
-- This script updates all existing records in leave_balances
-- to match the actual APPROVED leaves in leave_requests table
--
-- HOW TO USE:
-- 1. Open MySQL Workbench
-- 2. Connect to your database (employee_app)
-- 3. Copy and paste this entire file
-- 4. Click Execute (lightning bolt icon)
-- 5. Check the results
-- ============================================

USE employee_app;

-- ============================================
-- BEFORE: Check current state
-- ============================================
SELECT 
  lb.id,
  lb.employee_id,
  lt.name as leave_type,
  lb.total_allowed,
  lb.used as old_used,
  lb.remaining as old_remaining,
  (SELECT COALESCE(SUM(total_days), 0) 
   FROM leave_requests 
   WHERE employee_id = lb.employee_id 
     AND leave_type_id = lb.leave_type_id 
     AND status = 'APPROVED') as actual_used,
  lb.total_allowed - (SELECT COALESCE(SUM(total_days), 0) 
                      FROM leave_requests 
                      WHERE employee_id = lb.employee_id 
                        AND leave_type_id = lb.leave_type_id 
                        AND status = 'APPROVED') as actual_remaining
FROM leave_balances lb
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE lb.employee_id = 1;

-- ============================================
-- UPDATE: Sync all balances
-- ============================================
UPDATE leave_balances lb
SET 
  used = (
    SELECT COALESCE(SUM(lr.total_days), 0)
    FROM leave_requests lr
    WHERE lr.employee_id = lb.employee_id
      AND lr.leave_type_id = lb.leave_type_id
      AND lr.status = 'APPROVED'
  ),
  remaining = lb.total_allowed - (
    SELECT COALESCE(SUM(lr.total_days), 0)
    FROM leave_requests lr
    WHERE lr.employee_id = lb.employee_id
      AND lr.leave_type_id = lb.leave_type_id
      AND lr.status = 'APPROVED'
  ),
  updated_at = NOW()
WHERE lb.employee_id = 1;

-- ============================================
-- AFTER: Check updated state
-- ============================================
SELECT 
  lb.id,
  lb.employee_id,
  lt.name as leave_type,
  lb.total_allowed,
  lb.used as new_used,
  lb.remaining as new_remaining,
  lb.updated_at
FROM leave_balances lb
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE lb.employee_id = 1;

-- ============================================
-- VERIFY: Check if it matches APPROVED leaves
-- ============================================
SELECT 
  lt.name as leave_type,
  COUNT(*) as approved_count,
  SUM(lr.total_days) as total_days_used
FROM leave_requests lr
JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE lr.employee_id = 1 
  AND lr.status = 'APPROVED'
GROUP BY lt.name;

-- ============================================
-- DONE!
-- ============================================
-- Your leave_balances table is now synced!
-- The 'used' and 'remaining' fields now match
-- the actual APPROVED leaves in leave_requests table
-- ============================================
