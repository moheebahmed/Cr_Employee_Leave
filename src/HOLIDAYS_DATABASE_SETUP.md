# Holidays Database Setup Guide

## Problem
Currently, holidays are hardcoded in `holidays.service.js` file. We need to move them to MySQL database.

## Solution (3 Steps)

### Step 1: Create Holidays Table in MySQL

1. Open **MySQL Workbench**
2. Connect to your database
3. Open file: `src/create-holidays-table.sql`
4. Copy ALL the code
5. Paste in MySQL Workbench
6. Click **Execute** (⚡)

**Result:** 
- ✅ `holidays` table created
- ✅ 17 holidays inserted (2026-2027)

### Step 2: Update Holidays Service

Replace the old service file with the new one:

**Old file:** `src/services/holidays.service.js` (hardcoded array)
**New file:** `src/services/holidays.service.NEW.js` (fetches from database)

**How to replace:**
1. Rename old file: `holidays.service.js` → `holidays.service.OLD.js` (backup)
2. Rename new file: `holidays.service.NEW.js` → `holidays.service.js`

Or simply copy the content from `.NEW.js` to `.js` file.

### Step 3: Restart Backend Server

```bash
# Stop current server (Ctrl+C)
# Start again
node src/server.js
```

**Done!** Holidays now come from database! 🎉

## What Changed

### Before (Hardcoded):
```javascript
const holidays = [
  { date: '2026-01-01', name: 'New Year\'s Day', weekday: 'Thursday' },
  // ... more holidays
];

function getUpcoming(limit = 5) {
  // Returns from array
}
```

### After (Database):
```javascript
async function getUpcoming(limit = 5) {
  const [rows] = await pool.query(
    'SELECT date, name, weekday FROM holidays WHERE date >= CURDATE() ORDER BY date LIMIT ?',
    [limit]
  );
  return rows;
}
```

## Benefits

✅ **Easy to Update:** Add/edit holidays in database without code changes
✅ **Scalable:** Can add holidays for many years
✅ **Manageable:** HR can manage holidays through admin panel (future feature)
✅ **Queryable:** Can filter by year, month, date range

## Testing

### Test 1: Check Table Created
```sql
USE employee_app;
SELECT * FROM holidays ORDER BY date;
```

**Expected:** See 17 holidays

### Test 2: Get Upcoming Holidays
```sql
SELECT * FROM holidays 
WHERE date >= CURDATE() 
ORDER BY date 
LIMIT 5;
```

**Expected:** See next 5 upcoming holidays

### Test 3: Test Backend API
```bash
# Start backend server
node src/server.js

# Test dashboard endpoint (should show 2 holidays)
curl -X GET http://192.168.3.39:3000/api/employee/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Response includes `upcoming_holidays` array with 2 holidays

### Test 4: Test Frontend
1. Open your app
2. Login
3. Go to Dashboard
4. Scroll to "Upcoming Holidays" section

**Expected:** See 2 upcoming holidays (Feb 14, Mar 23, etc.)

## Managing Holidays

### Add New Holiday
```sql
INSERT INTO holidays (date, name, weekday, year) 
VALUES ('2026-12-31', 'New Year Eve', 'Thursday', 2026);
```

### Update Holiday
```sql
UPDATE holidays 
SET name = 'Eid ul-Fitr (Confirmed)' 
WHERE date = '2026-04-10';
```

### Delete Holiday
```sql
DELETE FROM holidays 
WHERE date = '2026-02-14';
```

### Add Holidays for 2028
```sql
INSERT INTO holidays (date, name, weekday, year) VALUES
('2028-01-01', 'New Year''s Day', 'Saturday', 2028),
('2028-03-23', 'Pakistan Day', 'Thursday', 2028),
('2028-08-14', 'Independence Day', 'Monday', 2028);
```

## Useful Queries

### Get holidays for specific month
```sql
SELECT * FROM holidays 
WHERE MONTH(date) = 3 AND year = 2026;
```

### Count holidays by year
```sql
SELECT year, COUNT(*) as total 
FROM holidays 
GROUP BY year;
```

### Get holidays between dates
```sql
SELECT * FROM holidays 
WHERE date BETWEEN '2026-01-01' AND '2026-12-31'
ORDER BY date;
```

### Check if today is a holiday
```sql
SELECT * FROM holidays 
WHERE date = CURDATE();
```

## Troubleshooting

### Error: Table 'holidays' doesn't exist
- Run `create-holidays-table.sql` again
- Make sure you're connected to `employee_app` database

### Error: Cannot find module '../config/db'
- Make sure `src/config/db.js` exists
- Check database connection configuration

### Frontend shows no holidays
- Check backend logs for errors
- Verify holidays table has data: `SELECT * FROM holidays;`
- Make sure backend server is running

### Holidays not updating
- Restart backend server after database changes
- Clear app cache and refresh

## Files Summary

### SQL Files:
- `create-holidays-table.sql` - Creates table and inserts data

### Service Files:
- `holidays.service.js` - OLD (hardcoded array)
- `holidays.service.NEW.js` - NEW (fetches from database)

### Steps:
1. ✅ Run SQL file in MySQL
2. ✅ Replace service file
3. ✅ Restart backend
4. ✅ Test frontend

## Summary

✅ **Created:** `holidays` table in MySQL
✅ **Inserted:** 17 holidays (2026-2027)
✅ **Updated:** Service to fetch from database
✅ **Result:** Holidays now managed in database!

No more hardcoded holidays! 🎉
