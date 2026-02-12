# Automatic Database Sync Setup

## Overview
This folder contains everything needed to make the `leave_balances` table in MySQL automatically update when leaves are approved or rejected.

## What's Included

### 1. Backend Code (Already Integrated)
- **`controllers/employee.controller.js`** - Calculates leave balances in real-time
- **`controllers/hr.controller.js`** - Handles leave approval/rejection with automatic sync
- **`utils/syncBalances.js`** - Utility functions for syncing database

### 2. Database Scripts (Need to Run Once)
- **`sync-existing-data.sql`** - Fixes current database mismatches
- **`install-trigger.sql`** - Installs automatic database trigger

## Quick Setup (3 Steps)

### Step 1: Copy src Folder to Backend
```bash
# Copy this entire src folder to your backend
# Replace the existing src folder
```

### Step 2: Run Database Sync Script
1. Open **MySQL Workbench**
2. Connect to your database (`employee_app`)
3. Open file: `src/sync-existing-data.sql`
4. Execute it (⚡ lightning bolt icon)
5. Check results - database should now match frontend

### Step 3: Install Database Trigger
1. Still in **MySQL Workbench**
2. Open file: `src/install-trigger.sql`
3. Execute it (⚡ lightning bolt icon)
4. Verify trigger was created:
   ```sql
   SHOW TRIGGERS WHERE `Trigger` = 'after_leave_status_change';
   ```

### Step 4: Restart Backend Server
```bash
cd ConceptRecall
node src/server.js
```

## How It Works

### Frontend (Already Working)
- Calculates `used` and `remaining` from APPROVED leaves in real-time
- Always shows accurate values
- No changes needed

### Backend API (Already Integrated)
- When HR approves/rejects via API endpoint, calls `syncLeaveBalance()`
- Updates database automatically
- Endpoint: `PUT /api/hr/leave-requests/:id/status`

### Database Trigger (Need to Install)
- Automatically updates `leave_balances` table
- Triggers whenever `leave_requests.status` changes
- Works even if database is updated directly (not through API)

## Testing

### Test 1: Verify Current Sync
```sql
-- Check database
SELECT * FROM leave_balances WHERE employee_id = 1;

-- Check actual APPROVED leaves
SELECT 
  lt.name,
  COUNT(*) as count,
  SUM(lr.total_days) as total_days
FROM leave_requests lr
JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE lr.employee_id = 1 AND lr.status = 'APPROVED'
GROUP BY lt.name;

-- They should match!
```

### Test 2: Test Automatic Update
```sql
-- Find a PENDING leave
SELECT id, leave_type_id, total_days, status 
FROM leave_requests 
WHERE employee_id = 1 AND status = 'PENDING' 
LIMIT 1;

-- Note the current balance
SELECT * FROM leave_balances 
WHERE employee_id = 1 AND leave_type_id = <LEAVE_TYPE_ID>;

-- Approve the leave
UPDATE leave_requests 
SET status = 'APPROVED', actioned_at = NOW()
WHERE id = <LEAVE_ID>;

-- Check balance again - should update automatically!
SELECT * FROM leave_balances 
WHERE employee_id = 1 AND leave_type_id = <LEAVE_TYPE_ID>;
```

### Test 3: Verify Frontend
1. Refresh your app
2. Go to Dashboard
3. Check USED and REM. values
4. Should match database exactly!

## Expected Results

### Before Setup:
- ❌ Database shows old values (e.g., Sick Leave used=1)
- ✅ Frontend shows correct values (e.g., Sick Leave USED=4)
- ❌ They don't match

### After Setup:
- ✅ Database shows correct values (e.g., Sick Leave used=4)
- ✅ Frontend shows correct values (e.g., Sick Leave USED=4)
- ✅ They match perfectly!
- ✅ Database updates automatically when leaves are approved

## File Structure

```
src/
├── controllers/
│   ├── employee.controller.js  ✅ Real-time calculation
│   ├── hr.controller.js        ✅ Automatic sync on approval
│   └── leave.controller.js
├── utils/
│   └── syncBalances.js         ✅ Sync utility functions
├── sync-existing-data.sql      🔧 Run once to fix current data
├── install-trigger.sql         🔧 Run once to enable auto-update
└── README_DATABASE_SYNC.md     📖 This file
```

## Troubleshooting

### If database doesn't update:
1. Check if trigger is installed:
   ```sql
   SHOW TRIGGERS WHERE `Trigger` = 'after_leave_status_change';
   ```
2. Check server logs for sync messages
3. Verify HR is using the correct API endpoint

### If frontend doesn't match database:
1. Run `sync-existing-data.sql` again
2. Restart backend server
3. Refresh app

### If trigger fails:
1. Check MySQL error log
2. Verify you have TRIGGER privilege:
   ```sql
   SHOW GRANTS FOR CURRENT_USER();
   ```
3. Make sure database name is correct in SQL files

## Summary

✅ **Backend Code:** Already integrated, calculates in real-time
✅ **Database Scripts:** Run once to sync and enable auto-update
✅ **Database Trigger:** Ensures database always stays in sync
✅ **Result:** Database and frontend always match automatically!

## Support

If you encounter any issues:
1. Check server logs for error messages
2. Verify database connection in `config/db.js`
3. Make sure all SQL scripts executed successfully
4. Test with the SQL queries provided above

---

**Last Updated:** February 11, 2026
**Version:** 1.0
