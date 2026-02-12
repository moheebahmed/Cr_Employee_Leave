# 🚀 START HERE - Database Auto-Sync Setup

## What This Does
Makes your MySQL `leave_balances` table automatically update when leaves are approved or rejected, just like the frontend does.

## Quick Start (3 Minutes)

### 1️⃣ Copy src Folder
✅ You already did this! This entire `src` folder is now in your backend.

### 2️⃣ Run 2 SQL Scripts
Open **MySQL Workbench** and run these 2 files:

**First:** `src/sync-existing-data.sql`
- Fixes current database to match frontend
- Run this FIRST

**Second:** `src/install-trigger.sql`  
- Installs automatic update trigger
- Run this SECOND

### 3️⃣ Restart Backend
```bash
node src/server.js
```

### ✅ Done!
Your database will now automatically update forever!

## What's Inside This Folder

### 📁 Backend Code (Already Working)
- `controllers/employee.controller.js` - Real-time calculation
- `controllers/hr.controller.js` - Auto-sync on approval
- `utils/syncBalances.js` - Sync utility functions

### 📄 Database Scripts (Run Once)
- `sync-existing-data.sql` - Fix current data
- `install-trigger.sql` - Enable auto-update

### 📖 Documentation
- `README_DATABASE_SYNC.md` - Full documentation
- `SETUP_CHECKLIST.md` - Step-by-step checklist
- `START_HERE.md` - This file

### 🧪 Test Scripts (Optional)
- `sync-all-balances.js` - Test sync via Node.js
- `test-balance-calculation.js` - Verify calculations

## How to Use

### Option 1: Quick Setup (Recommended)
1. Run `sync-existing-data.sql` in MySQL Workbench
2. Run `install-trigger.sql` in MySQL Workbench
3. Restart backend server
4. Done! ✅

### Option 2: Detailed Setup
Follow the checklist in `SETUP_CHECKLIST.md`

### Option 3: Full Documentation
Read `README_DATABASE_SYNC.md` for complete details

## Test It Works

### Quick Test:
```sql
-- Check if database matches frontend
SELECT * FROM leave_balances WHERE employee_id = 1;
```

Compare with your app's Dashboard screen - should match exactly!

### Full Test:
```sql
-- Approve a pending leave
UPDATE leave_requests 
SET status = 'APPROVED', actioned_at = NOW()
WHERE id = <PENDING_LEAVE_ID>;

-- Check if balance updated automatically
SELECT * FROM leave_balances WHERE employee_id = 1;
```

The `used` and `remaining` should update automatically! 🎉

## Expected Results

### Before:
- ❌ Database: Sick Leave used=1
- ✅ Frontend: Sick Leave USED=4
- ❌ They don't match

### After:
- ✅ Database: Sick Leave used=4
- ✅ Frontend: Sick Leave USED=4
- ✅ Perfect match!
- ✅ Updates automatically forever

## Need Help?

1. **Check:** `SETUP_CHECKLIST.md` - Step-by-step guide
2. **Read:** `README_DATABASE_SYNC.md` - Full documentation
3. **Test:** Run the SQL queries in the test section above

## Files You Need to Run

### Must Run (In MySQL Workbench):
1. ✅ `sync-existing-data.sql` - Run FIRST
2. ✅ `install-trigger.sql` - Run SECOND

### No Need to Touch:
- All other files are already integrated in the backend code
- Just restart your server after running the SQL scripts

---

## Summary

✅ **Step 1:** Run `sync-existing-data.sql`
✅ **Step 2:** Run `install-trigger.sql`
✅ **Step 3:** Restart backend server
✅ **Result:** Database auto-updates forever! 🎉

**Time Required:** 3 minutes
**Difficulty:** Easy (just run 2 SQL files)
**Result:** Database and frontend always match automatically!

---

**Ready?** Open MySQL Workbench and run those 2 SQL files! 🚀
