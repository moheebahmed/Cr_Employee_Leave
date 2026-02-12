-- ============================================
-- AUTOMATIC LEAVE BALANCE SYNC TRIGGER
-- ============================================
-- This trigger automatically updates leave_balances table
-- whenever a leave is approved or rejected in leave_requests table
--
-- HOW TO INSTALL:
-- 1. Open MySQL Workbench
-- 2. Connect to your database (employee_app)
-- 3. Copy and paste this entire file
-- 4. Click Execute (lightning bolt icon)
-- 5. Done! The trigger is now active
-- ============================================

USE employee_app;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS after_leave_status_change;

-- Create the trigger
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
-- VERIFY TRIGGER WAS CREATED
-- ============================================
SHOW TRIGGERS WHERE `Trigger` = 'after_leave_status_change';

-- You should see the trigger listed above
-- If you see it, the trigger is installed successfully!

-- ============================================
-- TEST THE TRIGGER (OPTIONAL)
-- ============================================

-- Step 1: Check current balances
SELECT * FROM leave_balances WHERE employee_id = 1;

-- Step 2: Find a PENDING leave request
SELECT id, employee_id, leave_type_id, total_days, status 
FROM leave_requests 
WHERE employee_id = 1 AND status = 'PENDING' 
LIMIT 1;

-- Step 3: Approve it (replace ID with actual ID from step 2)
-- UPDATE leave_requests 
-- SET status = 'APPROVED', actioned_at = NOW(), actioned_by = 1
-- WHERE id = YOUR_PENDING_LEAVE_ID;

-- Step 4: Check balances again - should be updated automatically!
-- SELECT * FROM leave_balances WHERE employee_id = 1;

-- ============================================
-- DONE!
-- ============================================
-- From now on, whenever a leave is approved or rejected,
-- the leave_balances table will update automatically!
-- ============================================
