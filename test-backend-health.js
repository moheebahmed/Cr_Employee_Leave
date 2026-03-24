require('dotenv').config();
const { sequelize } = require('./src/config/db');
const { User, Employee, LeaveType, LeaveBalance, LeaveRequest, Notification } = require('./src/models');

async function testBackendHealth() {
  try {
    console.log('🔍 Testing Backend Health...\n');
    console.log('═══════════════════════════════════════════════════');

    // 1. Test Database Connection
    console.log('\n1️⃣ Testing Database Connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // 2. Test LeaveType Model
    console.log('\n2️⃣ Testing LeaveType Model...');
    try {
      const leaveTypes = await LeaveType.findAll({
        attributes: ['id', 'name', 'code'],
        order: [['name', 'ASC']]
      });
      console.log(`✅ LeaveType query successful - Found ${leaveTypes.length} types`);
      leaveTypes.forEach(type => {
        console.log(`   - ${type.name} (${type.code})`);
      });
    } catch (error) {
      console.error('❌ LeaveType query failed:', error.message);
      throw error;
    }

    // 3. Test LeaveRequest with associations
    console.log('\n3️⃣ Testing LeaveRequest with associations...');
    try {
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
        order: [['applied_at', 'DESC']],
        limit: 5
      });
      console.log(`✅ LeaveRequest query successful - Found ${leaves.length} pending leaves`);
    } catch (error) {
      console.error('❌ LeaveRequest query failed:', error.message);
      throw error;
    }

    // 4. Test all models
    console.log('\n4️⃣ Testing All Models...');
    const models = [
      { name: 'User', model: User },
      { name: 'Employee', model: Employee },
      { name: 'LeaveType', model: LeaveType },
      { name: 'LeaveBalance', model: LeaveBalance },
      { name: 'LeaveRequest', model: LeaveRequest },
      { name: 'Notification', model: Notification }
    ];

    for (const { name, model } of models) {
      try {
        const count = await model.count();
        console.log(`✅ ${name}: ${count} records`);
      } catch (error) {
        console.error(`❌ ${name}: ${error.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ All tests passed!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════');
    console.error('❌ BACKEND HEALTH CHECK FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

testBackendHealth();
