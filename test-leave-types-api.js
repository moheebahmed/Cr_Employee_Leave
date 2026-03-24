require('dotenv').config();
const { sequelize } = require('./src/config/db');
const { LeaveType } = require('./src/models');

async function testLeaveTypes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Fetch all leave types
    const leaveTypes = await LeaveType.findAll({
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']]
    });

    console.log('📋 Leave Types in Database:');
    console.log('═══════════════════════════════════════════════════\n');

    leaveTypes.forEach((type, index) => {
      console.log(`${index + 1}. ${type.name} (${type.code})`);
      console.log(`   ID: ${type.id}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════');
    console.log(`Total: ${leaveTypes.length} leave types\n`);

    // Show what the API will return
    console.log('📤 API Response Format:');
    console.log(JSON.stringify({
      success: true,
      data: {
        leaveTypes: leaveTypes.map(t => ({
          id: t.id,
          name: t.name,
          code: t.code
        }))
      }
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLeaveTypes();
