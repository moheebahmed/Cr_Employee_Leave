# Quick Fix Checklist ✅

## The Problem
- ✅ Leave approvals/rejections are working in database
- ❌ Dashboard/Leave History showing wrong numbers
- ❌ Numbers don't match database

## The Solution (3 Simple Steps)

### Step 1: Sync Existing Data (One-Time)
```bash
cd ConceptRecall
node src/sync-all-balances.js
```

Wait for:
```
✅ Sync completed successfully!
   Total records updated: 5
```

### Step 2: Restart Backend Server
```bash
# Press Ctrl+C to stop current server
# Then start again:
node src/server.js
```

### Step 3: Refresh Your App
- Close the app completely
- Open it again
- Login
- Check all screens

## What to Check

### ✅ Dashboard Screen
- TOTAL column = database `total_allowed`
- USED column = database `used`
- REM. column = database `remaining`

### ✅ Leave History Screen  
- ENTITLED = sum of all `total_allowed`
- TAKEN = sum of all `used`
- BALANCE = sum of all `remaining`

### ✅ Apply Leave Screen
- AVAILABLE = database `remaining` for each leave type

## Test New Approval

1. Apply for 2 days Casual Leave
2. HR approves it
3. Check server logs - should see:
   ```
   🔄 Automatically updating leave_balances in database...
   ✅ Database synced: used=X, remaining=Y
   ```
4. Refresh app - numbers updated automatically!

## Everything Working?

If yes:
- ✅ Database syncs automatically on approval/rejection
- ✅ All screens show correct values
- ✅ No manual work needed anymore

If no:
- Run sync script again
- Check server logs for errors
- Verify database connection

## Summary

Your code is correct! You just need to:
1. Run sync script once (to fix existing data)
2. Restart server (to load new code)
3. Refresh app (to see updated values)

After that, everything works automatically! 🎉
