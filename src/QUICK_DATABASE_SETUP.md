# Quick Database Setup (3 Steps)

## Your senior wants you to create the database in MySQL

### Step 1: Open MySQL Workbench
- Launch MySQL Workbench
- Connect to your MySQL server

### Step 2: Run the SQL File
1. Open file: `src/create-database.sql`
2. Copy ALL the code
3. Paste in MySQL Workbench
4. Click Execute (⚡)

### Step 3: Done!
Database created with:
- ✅ 6 tables (users, employees, leave_types, leave_balances, leave_requests, notifications)
- ✅ Sample data (3 users, 5 leave types)
- ✅ Automatic trigger (updates balances when leaves approved)

## What Gets Created

### Database Name: `employee_app`

### Tables:
1. **users** - Login accounts
2. **employees** - Employee details
3. **leave_types** - Casual, Sick, Annual, Hajj, Paternity
4. **leave_balances** - Leave balance for each employee
5. **leave_requests** - Leave applications
6. **notifications** - System notifications

### Sample Users:
- ali@conceptrecall.com (Employee)
- hr@conceptrecall.com (HR)
- admin@conceptrecall.com (Admin)

### Sample Leave Types:
- Casual Leave: 12 days
- Sick Leave: 10 days
- Annual Leave: 20 days
- Hajj Leave: 0 days
- Paternity Leave: 5 days

## Verify It Worked

Run this in MySQL Workbench:
```sql
USE employee_app;
SHOW TABLES;
SELECT * FROM leave_types;
```

You should see 5 leave types!

## That's It!

Your database is ready. Now just:
1. Update backend config with database credentials
2. Start your backend server
3. Login with ali@conceptrecall.com

---

**Need detailed instructions?** See `DATABASE_SETUP_GUIDE.md`
