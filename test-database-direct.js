require('dotenv').config();
const { sequelize } = require('./src/config/db');

async function testDatabaseDirect() {
  try {
    console.log('🔍 Testing Direct Database Query...\n');
    
    // Raw SQL query to get actual database values
    const [results] = await sequelize.query(`
      SELECT 
        lb.id,
        lb.employee_id,
        lb.leave_type_id,
        lb.total_allowed,
        lb.used,
        lb.remaining,
        lb.updated_at,
        lt.name as leave_type_name,
        lt.code as leave_type_code
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = 1
      ORDER BY lb.id
    `);

    console.log('📊 Database Values (Raw SQL):');
    console.log('================================');
    results.forEach(row => {
      console.log(`${row.leave_type_name.padEnd(20)} | Total: ${row.total_allowed} | Used: ${row.used} | Remaining: ${row.remaining}`);
    });

    console.log('\n✅ These are the ACTUAL database values');
    console.log('Your API should return exactly these numbers!\n');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDatabaseDirect();
