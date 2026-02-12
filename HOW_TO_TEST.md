# How to Test Automatic Balance Sync

## Step 1: Sync Existing Database (One-Time)

Run this command once to update all existing records:

```bash
cd ConceptRecall
node src/sync-all-balances.js
```

You should see output like:
```
🚀 Starting database sync for all employees...

Found 1 employees

📋 Processing Employee ID: 1 (CR-EMP-001)
═══════════════════════════════════════
  Found 5 leave types
  ✅ Leave Type 1: Allowed=12, Used=4, Remaining=8
  ✅ Leave Type 2: Allowed=10, Used=1, Remaining=9
  ✅ Leave Type 3: Allowed=20, Used=5, Remaining=15
  ✅ Leave Type 4: Allowed=0, Used=0, Remaining=0
  ✅ Leave Type 5: Allowed=5, Used=1, Remaining=4

═══════════════════════════════════════
✅ Sync completed successfully!
   Total records updated: 5
═══════════════════════════════════════
```

## Step 2: Check Your Database

Open your MySQL database and check the `leave_balances` table:

```sql
SELECT * FROM leave_balances WHERE employee_id = 1;
```

You should now see:
- Casual Leave: used=4, remaining=8
- Sick Leave: used=1, remaining=9
- Annual Leave: used=5, remaining=15
- Hajj Leave: used=0, remaining=0
- Paternity Leave: used=1, remaining=4

## Step 3: Check Frontend

1. Open your app
2. Login with ali@conceptrecall.com
3. Go to Dashboard
4. Check Leave Overview section

You should see the SAME values as the database!

## Step 4: Test Automatic Sync

### Apply for a new leave:
1. Click "+" button
2. Select "Casual Leave"
3. Select dates (e.g., 2 days)
4. Enter reason
5. Submit

### Check database (should NOT change yet):
```sql
SELECT * FROM leave_balances WHERE employee_id = 1 AND leave_type_id = 1;
-- Still shows: used=4, remaining=8
```

### HR Approves the leave:
(You'll need HR access or use Postman/API tool)

```bash
# Replace <REQUEST_ID> with the actual leave request ID
# Replace <HR_TOKEN> with actual HR token

curl -X PUT http://192.168.3.39:3000/api/hr/leave-requests/<REQUEST_ID>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <HR_TOKEN>" \
  -d '{"status": "APPROVED"}'
```

### Check database again (should UPDATE automatically):
```sql
SELECT * FROM leave_balances WHERE employee_id = 1 AND leave_type_id = 1;
-- Now shows: used=6, remaining=6 (automatically updated!)
```

### Check frontend:
1. Refresh the app
2. Go to Dashboard
3. Casual Leave should show: USED=6, REM.=6

## Step 5: Verify Math

```
Before approval:
- Casual Leave: 12 allowed, 4 used, 8 remaining

After approving 2-day leave:
- Casual Leave: 12 allowed, 6 used, 6 remaining

Math: 12 - 6 = 6 ✅
```

## Expected Results

✅ Database `used` and `remaining` fields update automatically
✅ Frontend shows matching values
✅ No manual queries needed
✅ Everything stays in sync

## Troubleshooting

If values don't match:
1. Run the sync script again: `node src/sync-all-balances.js`
2. Restart your backend server
3. Refresh your app
4. Check server logs for sync messages

## Server Logs

When HR approves a leave, you should see:
```
🔄 Automatically updating leave_balances in database...
🔄 Auto-syncing balance for employee 1, leave type 1...
✅ Database synced: used=6, remaining=6
```

This confirms the automatic sync is working!
