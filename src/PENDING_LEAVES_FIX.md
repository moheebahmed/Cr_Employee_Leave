# Fixed: Pending Leaves Balance Check

## The Problem
When applying for leave, the system only checked APPROVED leaves, not PENDING leaves. This allowed users to apply for more leaves than available.

### Example of the Bug:
- Annual Leave: 13 total
- Apply 7 days → Status: PENDING
- Apply 7 more days → System checks: 0 APPROVED, 13 available ✅ Allows it
- Total applied: 14 days (but only 13 allowed) ❌ **BUG!**

## The Fix
Now the system checks APPROVED + PENDING leaves before allowing new applications.

### How It Works Now:
- Annual Leave: 13 total
- Apply 7 days → Status: PENDING
- Apply 7 more days → System checks: 0 APPROVED + 7 PENDING = 7 used, 6 available ❌ **BLOCKS IT!**
- Error message: "Insufficient balance. You have 6 days available (including pending leaves)"

## What Changed

### File: `src/controllers/leave.controller.js`

**Before:**
```javascript
// Only checked APPROVED leaves
if (balance.remaining < total_days) {
  return errorResponse(res, `Insufficient balance. You have ${balance.remaining} days remaining`, 400);
}
```

**After:**
```javascript
// Now checks APPROVED + PENDING leaves
const approvedAndPendingLeaves = await LeaveRequest.findAll({
  where: {
    employee_id: employeeId,
    leave_type_id: leave_type_id,
    status: ['APPROVED', 'PENDING']
  }
});

const totalUsedAndPending = approvedAndPendingLeaves.reduce((sum, leave) => sum + leave.total_days, 0);
const actualAvailable = balance.total_allowed - totalUsedAndPending;

if (actualAvailable < total_days) {
  return errorResponse(res, `Insufficient balance. You have ${actualAvailable} days available (including pending leaves)`, 400);
}
```

## Test Scenarios

### Scenario 1: Normal Application (Should Work)
- Annual Leave: 13 total
- APPROVED: 5 days
- PENDING: 0 days
- Available: 13 - 5 = 8 days
- Apply: 7 days ✅ **ALLOWED** (7 ≤ 8)

### Scenario 2: With Pending Leaves (Should Work)
- Annual Leave: 13 total
- APPROVED: 5 days
- PENDING: 3 days
- Available: 13 - 5 - 3 = 5 days
- Apply: 4 days ✅ **ALLOWED** (4 ≤ 5)

### Scenario 3: Exceeding Balance (Should Block)
- Annual Leave: 13 total
- APPROVED: 5 days
- PENDING: 3 days
- Available: 13 - 5 - 3 = 5 days
- Apply: 6 days ❌ **BLOCKED** (6 > 5)
- Error: "Insufficient balance. You have 5 days available (including pending leaves)"

### Scenario 4: Multiple Pending Applications (Should Block)
- Annual Leave: 13 total
- Apply 7 days → PENDING
- Available: 13 - 7 = 6 days
- Apply 7 more days ❌ **BLOCKED** (7 > 6)
- Error: "Insufficient balance. You have 6 days available (including pending leaves)"

## Server Logs

When applying for leave, you'll now see detailed logs:

```
📊 Balance Check for Leave Type 3:
   Total Allowed: 13
   Already Used (APPROVED): 5
   Pending Approval: 3
   Total Used + Pending: 8
   Actually Available: 5
   Requesting: 4 days
✅ Leave request created: 123
```

If insufficient balance:
```
📊 Balance Check for Leave Type 3:
   Total Allowed: 13
   Already Used (APPROVED): 5
   Pending Approval: 3
   Total Used + Pending: 8
   Actually Available: 5
   Requesting: 7 days
❌ Insufficient balance. You have 5 days available (including pending leaves)
```

## Testing

### Test 1: Apply Within Available Balance
```bash
# Should succeed
curl -X POST http://192.168.3.39:3000/api/employee/leave/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "leave_type_id": 3,
    "start_date": "2026-03-01",
    "end_date": "2026-03-03",
    "total_days": 3,
    "reason": "Test application"
  }'
```

### Test 2: Apply Exceeding Balance
```bash
# Should fail with error message
curl -X POST http://192.168.3.39:3000/api/employee/leave/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "leave_type_id": 3,
    "start_date": "2026-03-01",
    "end_date": "2026-03-10",
    "total_days": 10,
    "reason": "Test exceeding balance"
  }'
```

### Test 3: Multiple Applications
```bash
# First application (7 days) - should succeed
# Second application (7 days) - should fail
```

## Frontend Impact

The frontend will now show proper error messages:

**Before:**
- User could apply for more leaves than available
- No warning until HR rejects

**After:**
- User gets immediate error: "Insufficient balance. You have X days available (including pending leaves)"
- Cannot submit application if exceeding balance
- Clear indication of available balance

## Summary

✅ **Fixed:** System now checks APPROVED + PENDING leaves
✅ **Prevents:** Over-application of leaves
✅ **Shows:** Clear error messages with available balance
✅ **Logs:** Detailed balance calculation in server logs

## Deployment

1. Copy updated `src/controllers/leave.controller.js` to backend
2. Restart backend server
3. Test by applying for leaves
4. Check server logs for balance calculations

No database changes needed - this is a backend logic fix only!
