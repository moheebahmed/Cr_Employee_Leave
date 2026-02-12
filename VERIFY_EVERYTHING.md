# Verify Everything is Working

## Current Status Check

Based on your screenshots:

### Database (`leave_requests` table):
✅ Approvals/Rejections are working
- ID 18: APPROVED
- ID 17: REJECTED  
- ID 19: APPROVED
- ID 21: NULL (PENDING)
- ID 31: APPROVED
- ID 32: REJECTED
- ID 33: APPROVED
- ID 58: APPROVED
- ID 59: REJECTED
- ID 61: REJECTED
- ID 62: APPROVED

### Leave History Screen:
✅ Shows correct statuses (APPROVED/REJECTED)
✅ Shows correct messages
❓ ENTITLED/TAKEN/BALANCE totals need verification

## Step-by-Step Verification

### Step 1: Sync Database (IMPORTANT - Do this first!)

Run this command to sync all existing data:

```bash
cd ConceptRecall
node src/sync-all-balances.js
```

Expected output:
```
🚀 Starting database sync for all employees...

Found 1 employees

📋 Processing Employee ID: 1 (CR-EMP-001)
═══════════════════════════════════════
  Found 5 leave types
  ✅ Leave Type 1: Allowed=12, Used=X, Remaining=Y
  ✅ Leave Type 2: Allowed=10, Used=X, Remaining=Y
  ✅ Leave Type 3: Allowed=20, Used=X, Remaining=Y
  ✅ Leave Type 4: Allowed=0, Used=X, Remaining=Y
  ✅ Leave Type 5: Allowed=5, Used=X, Remaining=Y

✅ Sync completed successfully!
```

### Step 2: Verify Database

Check your `leave_balances` table:

```sql
SELECT 
  lb.id,
  lb.employee_id,
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

This will show:
- What's in the database (`used`, `remaining`)
- What it should be (`approved_days`)
- They should match!

### Step 3: Restart Backend Server

```bash
# Stop your current server (Ctrl+C)
# Then restart it
cd ConceptRecall
node src/server.js
```

### Step 4: Test Frontend

1. **Open your app**
2. **Login** with ali@conceptrecall.com
3. **Go to Dashboard**
   - Check if USED and REM. values match database
4. **Go to Leave History**
   - Check if ENTITLED, TAKEN, BALANCE match database totals
5. **Go to Apply Leave**
   - Check if AVAILABLE values match database remaining

### Step 5: Test Approval Flow

1. **Apply for a new leave** (e.g., 2 days Casual Leave)
2. **Check database before approval:**
   ```sql
   SELECT * FROM leave_balances WHERE employee_id = 1 AND leave_type_id = 1;
   -- Note the current used/remaining values
   ```

3. **HR approves the leave** (using API or HR panel)

4. **Check server logs** - Should see:
   ```
   🔄 Automatically updating leave_balances in database...
   🔄 Auto-syncing balance for employee 1, leave type 1...
   ✅ Database synced: used=X, remaining=Y
   ```

5. **Check database after approval:**
   ```sql
   SELECT * FROM leave_balances WHERE employee_id = 1 AND leave_type_id = 1;
   -- used should increase by 2
   -- remaining should decrease by 2
   ```

6. **Refresh app** - All screens should show updated values

## Expected Results

### After Sync Script:

✅ Database `used` field = sum of APPROVED leave days
✅ Database `remaining` field = total_allowed - used
✅ Math verification: total_allowed - used = remaining

### After Approval:

✅ Leave status changes to APPROVED
✅ Database automatically updates (used increases, remaining decreases)
✅ Server logs show sync messages
✅ Frontend shows updated values after refresh

### After Rejection:

✅ Leave status changes to REJECTED
✅ Database stays the same (rejected leaves don't count)
✅ Frontend shows correct status

## Troubleshooting

### If values don't match:

1. **Run sync script again:**
   ```bash
   node src/sync-all-balances.js
   ```

2. **Check server logs** for errors

3. **Verify HR approval endpoint is being called:**
   ```
   PUT /api/hr/leave-requests/:id/status
   ```

4. **Check if syncLeaveBalance is imported correctly** in hr.controller.js

### If sync script fails:

1. Check database connection in `src/config/db.js`
2. Verify all tables exist (leave_balances, leave_requests, leave_types)
3. Check for any SQL errors in console

## Quick Database Check

Run this to see current state:

```sql
-- Total leaves by status
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_days) as total_days
FROM leave_requests
WHERE employee_id = 1
GROUP BY status;

-- Should show something like:
-- APPROVED: X requests, Y days
-- REJECTED: X requests, Y days  
-- PENDING: X requests, Y days
```

The APPROVED total_days should match the sum of `used` in leave_balances table!

## Summary

Your approval/rejection is working correctly in the database. The issue is just that:

1. ✅ You need to run the sync script once to update existing data
2. ✅ Restart the backend server
3. ✅ Refresh the app

After that, everything will work automatically for new approvals/rejections!
