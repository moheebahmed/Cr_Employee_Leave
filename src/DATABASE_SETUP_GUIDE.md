# Database Setup Guide

## How to Create the Database in MySQL

### Step 1: Open MySQL Workbench
1. Open **MySQL Workbench** on your computer
2. Connect to your MySQL server (localhost or remote)

### Step 2: Run the Database Creation Script
1. Open the file: `src/create-database.sql`
2. Copy **ALL** the SQL code
3. Paste it into MySQL Workbench query window
4. Click **Execute** (⚡ lightning bolt icon) or press `Ctrl+Shift+Enter`

### Step 3: Verify Database Creation
After execution, you should see:
```
✅ Database 'employee_app' created
✅ 6 tables created
✅ Sample data inserted
✅ Trigger created
```

### Step 4: Check the Database
Run these commands to verify:

```sql
-- Show all databases
SHOW DATABASES;

-- Use the database
USE employee_app;

-- Show all tables
SHOW TABLES;

-- Check sample data
SELECT * FROM users;
SELECT * FROM employees;
SELECT * FROM leave_types;
SELECT * FROM leave_balances;
```

## Database Structure

### Tables Created:

1. **users** - User accounts (login credentials)
2. **employees** - Employee information
3. **leave_types** - Types of leaves (Casual, Sick, Annual, etc.)
4. **leave_balances** - Leave balance for each employee
5. **leave_requests** - Leave applications
6. **notifications** - System notifications

### Sample Data Included:

**Users:**
- ali@conceptrecall.com (Employee)
- hr@conceptrecall.com (HR)
- admin@conceptrecall.com (Admin)

**Leave Types:**
- Casual Leave (12 days)
- Sick Leave (10 days)
- Annual Leave (20 days)
- Hajj Leave (0 days)
- Paternity Leave (5 days)

**Automatic Trigger:**
- Updates leave_balances automatically when leaves are approved

## Connection Configuration

Update your backend configuration file:

**File:** `src/config/db.js`

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'employee_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

## Testing the Database

### Test 1: Login
```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'ali@conceptrecall.com';
```

### Test 2: Check Leave Balances
```sql
-- Check employee's leave balances
SELECT 
  e.employee_code,
  lt.name as leave_type,
  lb.total_allowed,
  lb.used,
  lb.remaining
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE e.employee_code = 'CR-EMP-001';
```

### Test 3: Apply for Leave
```sql
-- Insert a leave request
INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status)
VALUES (1, 1, '2026-03-01', '2026-03-03', 3, 'Personal work', 'PENDING');

-- Check if it was created
SELECT * FROM leave_requests WHERE employee_id = 1;
```

### Test 4: Approve Leave (Test Trigger)
```sql
-- Approve the leave
UPDATE leave_requests 
SET status = 'APPROVED', actioned_at = NOW()
WHERE id = 1;

-- Check if balance updated automatically
SELECT * FROM leave_balances WHERE employee_id = 1 AND leave_type_id = 1;
-- Should show: used = 3, remaining = 9
```

## Troubleshooting

### Error: Database already exists
```sql
-- Drop existing database first
DROP DATABASE IF EXISTS employee_app;
-- Then run create-database.sql again
```

### Error: Access denied
- Check your MySQL username and password
- Make sure you have CREATE DATABASE privilege
- Try running MySQL Workbench as Administrator

### Error: Table already exists
```sql
-- Drop all tables first
USE employee_app;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS users;
-- Then run create-database.sql again
```

## Important Notes

### Passwords
The sample data includes hashed passwords. To create real users:

```javascript
// In Node.js
const bcrypt = require('bcrypt');
const password = 'your_password';
const hash = await bcrypt.hash(password, 10);
console.log(hash); // Use this hash in INSERT statement
```

### Default Credentials
For testing, you can use:
- Email: ali@conceptrecall.com
- Password: (You need to hash and update in database)

### Production Setup
For production:
1. Change all default passwords
2. Use strong passwords
3. Update database credentials in `.env` file
4. Enable SSL for database connection
5. Set up regular backups

## Summary

✅ **Step 1:** Open MySQL Workbench
✅ **Step 2:** Run `create-database.sql`
✅ **Step 3:** Verify tables and data
✅ **Step 4:** Update backend config
✅ **Step 5:** Test the connection

Your database is now ready to use! 🎉
