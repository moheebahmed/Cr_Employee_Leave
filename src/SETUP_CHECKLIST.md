# Setup Checklist ✅

## After Copying src Folder to Backend

### ☐ Step 1: Sync Existing Database Data
```bash
# Open MySQL Workbench
# Execute: src/sync-existing-data.sql
```
**Expected Result:** Database `used` and `remaining` values match frontend

### ☐ Step 2: Install Database Trigger
```bash
# In MySQL Workbench
# Execute: src/install-trigger.sql
```
**Expected Result:** Trigger `after_leave_status_change` is created

### ☐ Step 3: Verify Trigger Installation
```sql
SHOW TRIGGERS WHERE `Trigger` = 'after_leave_status_change';
```
**Expected Result:** You see the trigger listed

### ☐ Step 4: Restart Backend Server
```bash
cd ConceptRecall
node src/server.js
```
**Expected Result:** Server starts without errors

### ☐ Step 5: Test Database Sync
```sql
-- Find a PENDING leave
SELECT id FROM leave_requests WHERE status = 'PENDING' LIMIT 1;

-- Approve it (replace ID)
UPDATE leave_requests SET status = 'APPROVED', actioned_at = NOW() WHERE id = <ID>;

-- Check if balance updated automatically
SELECT * FROM leave_balances WHERE employee_id = 1;
```
**Expected Result:** `used` and `remaining` update automatically

### ☐ Step 6: Test Frontend
1. Refresh app
2. Go to Dashboard
3. Check USED and REM. values

**Expected Result:** Frontend matches database exactly

## Verification

### Database Check:
```sql
SELECT 
  lt.name as leave_type,
  lb.total_allowed,
  lb.used,
  lb.remaining,
  (SELECT COUNT(*) FROM leave_requests 
   WHERE employee_id = lb.employee_id 
   AND leave_type_id = lb.leave_type_id 
   AND status = 'APPROVED') as approved_count,
  (SELECT SUM(total_days) FROM leave_requests 
   WHERE employee_id = lb.employee_id 
   AND leave_type_id = lb.leave_type_id 
   AND status = 'APPROVED') as approved_days
FROM leave_balances lb
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE lb.employee_id = 1;
```

**Expected Result:** `used` = `approved_days` for all leave types

## Success Criteria

✅ Database `used` and `remaining` match frontend
✅ Trigger is installed and active
✅ Backend server runs without errors
✅ Approving a leave updates database automatically
✅ Frontend shows same values as database

## If Something Doesn't Work

1. **Database doesn't update:**
   - Check if trigger exists: `SHOW TRIGGERS;`
   - Check server logs for errors
   - Verify database connection

2. **Frontend doesn't match:**
   - Run `sync-existing-data.sql` again
   - Restart backend server
   - Clear app cache and refresh

3. **Trigger fails:**
   - Check MySQL error log
   - Verify TRIGGER privilege
   - Make sure database name is correct

## Quick Test Command

```sql
-- All-in-one verification
SELECT 
  'Database Sync Status' as check_type,
  CASE 
    WHEN lb.used = (SELECT COALESCE(SUM(total_days), 0) 
                    FROM leave_requests 
                    WHERE employee_id = lb.employee_id 
                    AND leave_type_id = lb.leave_type_id 
                    AND status = 'APPROVED')
    THEN '✅ SYNCED'
    ELSE '❌ NOT SYNCED'
  END as status,
  lt.name as leave_type,
  lb.used as db_used,
  (SELECT COALESCE(SUM(total_days), 0) 
   FROM leave_requests 
   WHERE employee_id = lb.employee_id 
   AND leave_type_id = lb.leave_type_id 
   AND status = 'APPROVED') as actual_used
FROM leave_balances lb
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE lb.employee_id = 1;
```

**Expected Result:** All rows show '✅ SYNCED'

---

**Setup Complete!** 🎉

Your database will now automatically update whenever leaves are approved or rejected!
