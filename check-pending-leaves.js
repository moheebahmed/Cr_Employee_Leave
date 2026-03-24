require('dotenv').config();
const { sequelize } = require('./src/config/db');
const { LeaveRequest, Employee, User, LeaveType } = require('./src/models');

async function checkPendingLeaves() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check raw SQL
    const [rawResults] = await sequelize.query(`
      SELECT 
        lr.id,
        lr.status,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        e.full_name as employee_name,
        lt.name as leave_type
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.status = 'PENDING'
      ORDER BY lr.applied_at DESC
    `);

    console.log('\n📊 RAW SQL RESULTS:');
    console.log(`Found ${rawResults.length} pending leaves`);
    console.log(JSON.stringify(rawResults, null, 2));

    // Check using Sequelize
    const leaves = await LeaveRequest.findAll({
      where: { status: 'PENDING' },
      include: [
        { 
          model: Employee, 
          attributes: ['id', 'full_name'],
          include: [{ model: User, attributes: ['email'] }]
        },
        { model: LeaveType, attributes: ['name', 'code'] }
      ],
      order: [['applied_at', 'DESC']]
    });

    console.log('\n📊 SEQUELIZE RESULTS:');
    console.log(`Found ${leaves.length} pending leaves`);
    leaves.forEach(leave => {
      console.log({
        id: leave.id,
        employee: leave.Employee?.full_name,
        leave_type: leave.LeaveType?.name,
        days: leave.total_days,
        status: leave.status
      });
    });

    // Check all leave statuses
    const [allStatuses] = await sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM leave_requests 
      GROUP BY status
    `);

    console.log('\n📈 ALL LEAVE STATUSES:');
    console.log(allStatuses);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPendingLeaves();
