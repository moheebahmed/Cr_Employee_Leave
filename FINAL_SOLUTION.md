# Final Solution: Automatic Balance Sync

## The Problem
When HR approves/rejects leaves, the `used` and `remaining` fields in `leave_balances` table don't update automatically.

## The Solution (Choose ONE)

### Solution 1: Use API Endpoint (Recommended)
Make sure HR uses this endpoint to approve/reject leaves:

```
PUT http://192.168.3.39:3000/api/hr/leave-requests/:id/status

Headers:
  Authorization: Bearer <HR_TOKEN>
  Content-Type: application/json

Body:
{
  "status": "APPROVED"  // or "REJECTED"
}
```

This will automatically sync the database.

### Solution 2: Database Trigger (Backup)
If HR updates the database directly, run this SQL to create a trigger:

```sql
-- Copy and run the SQL from: src/utils/database-trigger.sql
```

This trigger will automatically update balances whenever a leave status changes, even if updated directly in MySQL.

## How to Implement

### Option A: API Endpoint (Best Practice)

1. **Make sure backend is running:**
   ```bash
   cd ConceptRecall
   node src/server.js
   ```

2. **HR should use the API endpoint** (not direct database updates)

3. **Check server logs** when approving - should see:
   ```
   🔄 Automatically updating leave_balances in database...
   ✅ Database synced: used=X, remaining=Y
   ```

### Option B: Database Trigger (Quick Fix)

1. **Open MySQL Workbench**

2. **Run this SQL:**
   ```sql
   DROP TRIGGER IF EXISTS after_leave_status_change;

   DELIMITER $$

   CREATE TRIGGER after_leave_status_change
   AFTER UPDATE ON leave_requests
   FOR EACH ROW
   BEGIN
     IF OLD.status = 'PENDING' AND (NEW.status = 'APPROVED' OR NEW.status = 'REJECTED') THEN
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
         ),
         updated_at = NOW()
       WHERE employee_id = NEW.employee_id
         AND leave_type_id = NEW.leave_type_id;
     END IF;
   END$$

   DELIMITER ;
   ```

3. **Test it:**
   ```sql
   -- Approve a pending leave
   UPDATE leave_requests 
   SET status = 'APPROVED', actioned_at = NOW()
   WHERE id = 21;

   -- Check if balance updated automatically
   SELECT * FROM leave_balances WHERE employee_id = 1;
   ```

## Testing

### Test 1: Check Current State
```sql
SELECT * FROM leave_balances WHERE employee_id = 1;
SELECT * FROM leave_requests WHERE employee_id = 1 AND status = 'PENDING';
```

### Test 2: Approve a Leave
Pick a PENDING leave and approve it (using API or direct SQL)

### Test 3: Verify Update
```sql
-- Check if status changed
SELECT * FROM leave_requests WHERE id = <THE_ID>;

-- Check if balance updated
SELECT * FROM leave_balances WHERE employee_id = 1;
```

### Test 4: Check Frontend
1. Restart backend server
2. Refresh app
3. Check Dashboard - should show updated values
4. Check Leave History - should show updated TAKEN/BALANCE

## Expected Results

### Before Approval:
- Casual Leave: used=4, remaining=8
- Leave Request ID 21: status='PENDING'

### After Approving 2-day Casual Leave:
- Casual Leave: used=6, remaining=6
- Leave Request ID 21: status='APPROVED'

### Frontend Shows:
- Dashboard: Casual Leave USED=6, REM.=6
- Leave History: TAKEN increases by 2, BALANCE decreases by 2
- Apply Leave: Casual Leave 06 AVAILABLE

## Troubleshooting

### If trigger doesn't work:
1. Check if trigger was created:
   ```sql
   SHOW TRIGGERS LIKE 'leave_requests';
   ```

2. Check MySQL error log

3. Make sure you have TRIGGER privilege:
   ```sql
   SHOW GRANTS FOR CURRENT_USER();
   ```

### If API endpoint doesn't work:
1. Check server logs for errors
2. Verify HR token is valid
3. Test with curl or Postman
4. Check if route is registered in `src/app.js`

## Recommendation

**Use BOTH solutions:**
1. API endpoint for normal operations
2. Database trigger as backup (in case someone updates database directly)

This ensures the sync always works, no matter how the leave is approved!

## Summary

✅ **Solution 1 (API):** Best practice, includes logging, error handling
✅ **Solution 2 (Trigger):** Backup, works even with direct database updates
✅ **Both together:** Maximum reliability

Choose based on how HR approves leaves in your system!
