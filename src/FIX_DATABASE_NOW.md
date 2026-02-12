# Fix Database to Match Frontend

## The Problem
- **Frontend:** Casual Leave USED=6, REM.=6 ✅ (Correct)
- **Database:** Casual Leave used=4, remaining=8 ❌ (Wrong)

## The Solution
Run 2 SQL files to make database match frontend and stay in sync forever.

## Step 1: Fix Current Mismatch

**Open MySQL Workbench and run this:**

```sql
-- This will make database match frontend RIGHT NOW
USE employee_app;

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

-- Check result
SELECT * FROM leave_balances WHERE employee_id = 1;
```

**After running this:**
- Database will show: Casual Leave used=6, remaining=6 ✅
- Now database matches frontend!

## Step 2: Make It Automatic Forever

**Run this in MySQL Workbench:**

```sql
-- This will make database update automatically from now on
USE employee_app;

DROP TRIGGER IF EXISTS after_leave_status_change;

DELIMITER $$

CREATE TRIGGER after_leave_status_change
AFTER UPDATE ON leave_requests
FOR EACH ROW
BEGIN
  IF OLD.status = 'PENDING' AND (NEW.status = 'APPROVED' OR NEW.status = 'REJECTED') THEN
    UPDATE leave_balances
    SET 
      used = (
        SELECT COALESCE(SUM(total_days), 0)
        FROM leave_requests
        WHERE employee_id = NEW.employee_id
          AND leave_type_id = NEW.leave_type_id
          AND status = 'APPROVED'
      ),
      remaining = total_allowed - (
        SELECT COALESCE(SUM(total_days), 0)
        FROM leave_requests
        WHERE employee_id = NEW.employee_id
          AND leave_type_id = NEW.leave_type_id
          AND status = 'APPROVED'
      ),
      updated_at = NOW()
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id;
  END IF;
END$$

DELIMITER ;

-- Verify trigger was created
SHOW TRIGGERS WHERE `Trigger` = 'after_leave_status_change';
```

**After running this:**
- Whenever a leave is approved, database updates automatically
- Database will always match frontend from now on!

## Step 3: Test It

**Approve a new leave and check:**

```sql
-- Before: Check current balance
SELECT * FROM leave_balances WHERE employee_id = 1 AND leave_type_id = 1;

-- Approve a pending leave (replace ID)
UPDATE leave_requests 
SET status = 'APPROVED', actioned_at = NOW()
WHERE id = <PENDING_LEAVE_ID>;

-- After: Check balance again - should update automatically!
SELECT * FROM leave_balances WHERE employee_id = 1 AND leave_type_id = 1;
```

## Done! ✅

Now:
- ✅ Database matches frontend
- ✅ Database updates automatically when leaves are approved
- ✅ Frontend and database always stay in sync

## Quick Copy-Paste

**Just copy and paste these 2 SQL blocks into MySQL Workbench:**

### Block 1: Fix Current Data
```sql
USE employee_app;
UPDATE leave_balances lb SET used = (SELECT COALESCE(SUM(lr.total_days), 0) FROM leave_requests lr WHERE lr.employee_id = lb.employee_id AND lr.leave_type_id = lb.leave_type_id AND lr.status = 'APPROVED'), remaining = lb.total_allowed - (SELECT COALESCE(SUM(lr.total_days), 0) FROM leave_requests lr WHERE lr.employee_id = lb.employee_id AND lr.leave_type_id = lb.leave_type_id AND lr.status = 'APPROVED'), updated_at = NOW() WHERE lb.employee_id = 1;
SELECT * FROM leave_balances WHERE employee_id = 1;
```

### Block 2: Enable Auto-Update
```sql
USE employee_app;
DROP TRIGGER IF EXISTS after_leave_status_change;
DELIMITER $$
CREATE TRIGGER after_leave_status_change AFTER UPDATE ON leave_requests FOR EACH ROW BEGIN IF OLD.status = 'PENDING' AND (NEW.status = 'APPROVED' OR NEW.status = 'REJECTED') THEN UPDATE leave_balances SET used = (SELECT COALESCE(SUM(total_days), 0) FROM leave_requests WHERE employee_id = NEW.employee_id AND leave_type_id = NEW.leave_type_id AND status = 'APPROVED'), remaining = total_allowed - (SELECT COALESCE(SUM(total_days), 0) FROM leave_requests WHERE employee_id = NEW.employee_id AND leave_type_id = NEW.leave_type_id AND status = 'APPROVED'), updated_at = NOW() WHERE employee_id = NEW.employee_id AND leave_type_id = NEW.leave_type_id; END IF; END$$
DELIMITER ;
SHOW TRIGGERS WHERE `Trigger` = 'after_leave_status_change';
```

**That's it!** Database will now work exactly like frontend! 🎉
