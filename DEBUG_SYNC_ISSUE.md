# Debug: Why Sync is Not Working

## The Problem
When HR approves a leave, the `used` and `remaining` fields in `leave_balances` table are NOT updating automatically.

## Possible Causes

### 1. HR is NOT using the correct endpoint
**Check:** Is HR using this endpoint?
```
PUT /api/hr/leave-requests/:id/status
```

**If NO:** HR might be:
- Updating database directly through MySQL Workbench
- Using a different endpoint
- Using the old `leave.service.js` (but we checked, it's not imported anywhere)

### 2. The endpoint is being called but sync is failing
**Check server logs** when HR approves a leave. You should see:
```
🔄 Automatically updating leave_balances in database...
   Employee ID: 1
   Leave Type ID: 1
   Status: APPROVED
🔄 Auto-syncing balance for employee 1, leave type 1...
✅ Database synced: used=X, remaining=Y
```

**If you DON'T see these logs:** The endpoint is not being called

**If you see error logs:** There's a problem with the sync function

### 3. Database connection issue
The sync might be failing silently due to database connection problems.

## How to Debug

### Step 1: Check if endpoint is being called

Add this at the very beginning of `updateLeaveRequestStatus` in `hr.controller.js`:

```javascript
console.log('========================================');
console.log('🎯 APPROVAL ENDPOINT CALLED!');
console.log('Request ID:', requestId);
console.log('Status:', status);
console.log('========================================');
```

Then when HR approves a leave, check server logs. If you see this message, the endpoint is being called.

### Step 2: Test manually with curl

```bash
# Replace YOUR_HR_TOKEN with actual HR token
# Replace 21 with actual pending leave request ID

curl -X PUT http://192.168.3.39:3000/api/hr/leave-requests/21/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  -d '{"status": "APPROVED"}'
```

Check server logs immediately after running this command.

### Step 3: Test the sync function directly

Run this script to test if sync works:

```bash
node src/sync-all-balances.js
```

If this works, the sync function is fine. The problem is that it's not being called during approval.

### Step 4: Check database directly

Before approval:
```sql
SELECT * FROM leave_balances WHERE employee_id = 1;
SELECT * FROM leave_requests WHERE id = 21;
```

Approve the leave (ID 21)

After approval:
```sql
SELECT * FROM leave_balances WHERE employee_id = 1;
SELECT * FROM leave_requests WHERE id = 21;
```

Compare the values. If `leave_requests.status` changed but `leave_balances.used` didn't, the sync is not running.

## Solutions Based on Findings

### If endpoint is NOT being called:
**Problem:** HR is using a different method to approve leaves

**Solution:** 
1. Find out how HR is approving leaves
2. Update that method to call the sync function
3. Or tell HR to use the correct endpoint

### If endpoint IS called but sync fails:
**Problem:** Error in sync function or database connection

**Solution:**
1. Check server logs for error messages
2. Verify database connection in `src/config/db.js`
3. Check if `leave_balances` table exists and has correct structure

### If sync works manually but not during approval:
**Problem:** The sync call in `hr.controller.js` is not executing

**Solution:**
1. Check if there's an error being thrown before the sync call
2. Make sure `syncLeaveBalance` is imported correctly
3. Add try-catch around the sync call to catch errors

## Quick Test

Run this to see current state:

```sql
-- Check pending leaves
SELECT id, employee_id, leave_type_id, total_days, status 
FROM leave_requests 
WHERE employee_id = 1 AND status = 'PENDING'
LIMIT 1;

-- Note the ID, then approve it through HR

-- Check if status changed
SELECT id, status, actioned_at 
FROM leave_requests 
WHERE id = <THE_ID_FROM_ABOVE>;

-- Check if balance updated
SELECT * FROM leave_balances 
WHERE employee_id = 1;
```

## Expected Behavior

When HR approves leave ID 21 (2 days, Casual Leave):

1. **leave_requests table:**
   - status changes from 'PENDING' to 'APPROVED'
   - actioned_at gets current timestamp
   - actioned_by gets HR user ID

2. **leave_balances table:**
   - used increases by 2
   - remaining decreases by 2

3. **Server logs show:**
   ```
   🔄 Automatically updating leave_balances in database...
   ✅ Database synced: used=6, remaining=6
   ```

4. **Frontend (after refresh):**
   - Dashboard shows updated values
   - Leave History shows updated TAKEN/BALANCE
   - Apply Leave shows updated AVAILABLE

## Most Likely Issue

Based on your description, the most likely issue is:

**HR is updating the database directly (through MySQL Workbench or another tool) instead of using the API endpoint.**

**Solution:** Tell HR to use the proper endpoint or HR panel that calls the API.

## Alternative Solution

If HR must update database directly, create a database trigger:

```sql
DELIMITER $$

CREATE TRIGGER after_leave_approval
AFTER UPDATE ON leave_requests
FOR EACH ROW
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status = 'PENDING' THEN
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
      )
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id;
  END IF;
END$$

DELIMITER ;
```

This will automatically update balances whenever a leave is approved, even if done directly in the database.
