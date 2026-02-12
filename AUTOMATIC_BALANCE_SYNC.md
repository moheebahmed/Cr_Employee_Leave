# Automatic Leave Balance Synchronization

## Overview
Your leave management system now automatically updates the `leave_balances` table in the database whenever leaves are approved or rejected. The database will always stay in sync with the real-time calculations.

## How It Works

### 1. Automatic Sync on Leave Approval/Rejection
When HR approves or rejects a leave request:
- The system automatically recalculates the `used` and `remaining` fields
- Updates the `leave_balances` table in MySQL
- Both frontend and database show matching values

**File:** `src/controllers/hr.controller.js`
```javascript
// When HR approves/rejects leave
await syncLeaveBalance(request.employee_id, request.leave_type_id);
```

### 2. Real-Time Calculation (Frontend)
The frontend always shows accurate data by:
- Counting all APPROVED leaves from `leave_requests` table
- Calculating: `used = sum of APPROVED leave days`
- Calculating: `remaining = total_allowed - used`

**File:** `src/controllers/employee.controller.js`

### 3. Database Stays in Sync
The `leave_balances` table is automatically updated:
- `used` field = total APPROVED leave days
- `remaining` field = total_allowed - used
- No manual queries needed

## One-Time Database Sync

To sync all existing records in your database, run this command once:

```bash
node src/sync-all-balances.js
```

This will:
- Process all employees
- Calculate correct `used` and `remaining` values
- Update the `leave_balances` table
- Show you the results

## Manual Sync (If Needed)

HR can manually trigger a sync for any employee using this API endpoint:

```
POST /api/hr/employees/:id/sync-balances
Authorization: Bearer <HR_TOKEN>
```

Example:
```bash
curl -X POST http://192.168.3.39:3000/api/hr/employees/1/sync-balances \
  -H "Authorization: Bearer YOUR_HR_TOKEN"
```

## Files Modified

1. **src/utils/syncBalances.js** (NEW)
   - Utility functions for syncing balances
   - `syncLeaveBalance()` - Sync one leave type
   - `syncAllBalances()` - Sync all leave types for an employee

2. **src/controllers/hr.controller.js** (UPDATED)
   - Automatically calls sync when leave is approved/rejected
   - Added `syncEmployeeBalances()` helper function

3. **src/routes/hr.routes.js** (UPDATED)
   - Added manual sync endpoint for HR

4. **src/sync-all-balances.js** (NEW)
   - One-time script to sync all existing data

## Testing

1. Apply for a leave (status = PENDING)
2. Check database - `used` and `remaining` unchanged
3. HR approves the leave
4. Check database - `used` and `remaining` automatically updated!
5. Check frontend - matches database values

## Math Verification

```
ENTITLED = total_allowed (from leave_balances)
TAKEN = sum of APPROVED leave days (from leave_requests)
BALANCE = ENTITLED - TAKEN

Example:
- Casual Leave: 12 allowed
- Approved leaves: 3 + 1 = 4 days
- Database shows: used=4, remaining=8
- Frontend shows: USED=4, REM.=8
✅ Perfect match!
```

## Summary

Your system now works automatically:
- ✅ Frontend shows real-time accurate data
- ✅ Database updates automatically on approval/rejection
- ✅ No manual queries needed
- ✅ Always in sync
- ✅ Your senior will be happy!
