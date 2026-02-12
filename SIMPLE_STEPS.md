# Simple Steps to Fix Database Auto-Update

## Your Request
Make the `leave_balances` table in MySQL update automatically, just like the frontend does.

## The Solution
Install a database trigger that automatically updates the table whenever a leave is approved or rejected.

## Step-by-Step Instructions

### Step 1: Sync Existing Data (Fix Current Mismatch)

1. Open **MySQL Workbench**
2. Connect to your database (`employee_app`)
3. Open the file: `sync-existing-data.sql`
4. Copy all the SQL code
5. Paste it in MySQL Workbench
6. Click **Execute** (⚡ lightning bolt icon)
7. Check the results - you should see:
   - BEFORE values (old_used, old_remaining)
   - AFTER values (new_used, new_remaining)
   - They should now match the frontend!

### Step 2: Install Automatic Trigger (For Future Updates)

1. Still in **MySQL Workbench**
2. Open the file: `install-trigger.sql`
3. Copy all the SQL code
4. Paste it in MySQL Workbench
5. Click **Execute** (⚡ lightning bolt icon)
6. You should see: "Trigger 'after_leave_status_change' created successfully"

### Step 3: Test It!

1. **Check current database:**
   ```sql
   SELECT * FROM leave_balances WHERE employee_id = 1;
   ```
   Note the values

2. **Find a PENDING leave:**
   ```sql
   SELECT id, leave_type_id, total_days, status 
   FROM leave_requests 
   WHERE employee_id = 1 AND status = 'PENDING' 
   LIMIT 1;
   ```

3. **Approve it:**
   ```sql
   UPDATE leave_requests 
   SET status = 'APPROVED', actioned_at = NOW()
   WHERE id = <THE_ID_FROM_ABOVE>;
   ```

4. **Check database again:**
   ```sql
   SELECT * FROM leave_balances WHERE employee_id = 1;
   ```
   The `used` and `remaining` should update automatically! 🎉

### Step 4: Verify Frontend Matches

1. Refresh your app
2. Go to Dashboard
3. Check the USED and REM. values
4. They should match the database exactly!

## What Happens Now

✅ **When HR approves a leave:**
- `leave_requests` table: status changes to 'APPROVED'
- `leave_balances` table: **automatically updates** (used increases, remaining decreases)
- Frontend: shows updated values (after refresh)

✅ **When HR rejects a leave:**
- `leave_requests` table: status changes to 'REJECTED'
- `leave_balances` table: stays the same (rejected leaves don't count)
- Frontend: shows correct status

## Expected Results

### Before (Current State):
**Database:**
- Casual Leave: used=4, remaining=8
- Sick Leave: used=1, remaining=9 ❌ (Wrong!)
- Annual Leave: used=5, remaining=15
- Paternity Leave: used=1, remaining=4

**Frontend:**
- Casual Leave: USED=4, REM.=8
- Sick Leave: USED=4, REM.=6 ✅ (Correct!)
- Annual Leave: USED=5, REM.=15
- Paternity Leave: USED=1, REM.=4

### After Running sync-existing-data.sql:
**Database:**
- Casual Leave: used=4, remaining=8 ✅
- Sick Leave: used=4, remaining=6 ✅ (Fixed!)
- Annual Leave: used=5, remaining=15 ✅
- Paternity Leave: used=1, remaining=4 ✅

**Frontend:**
- Same as before (already correct)

### After Installing Trigger:
From now on, whenever a leave is approved:
- Database updates automatically
- Frontend shows same values as database
- Everything stays in sync! 🎉

## Files You Need

1. **sync-existing-data.sql** - Run this FIRST to fix current data
2. **install-trigger.sql** - Run this SECOND to enable auto-update

Both files are in your `ConceptRecall` folder.

## Summary

✅ Step 1: Run `sync-existing-data.sql` → Fixes current mismatch
✅ Step 2: Run `install-trigger.sql` → Enables automatic updates
✅ Step 3: Test by approving a leave → Database updates automatically
✅ Done! Database and frontend always match from now on

No code changes needed! Just run these 2 SQL scripts and you're done! 🚀
