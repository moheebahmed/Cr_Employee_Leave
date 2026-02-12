// Test script to check holidays in database
const { sequelize } = require('./config/db');

async function testHolidays() {
  try {
    console.log('🔍 Testing holidays database...\n');

    // Test 1: Check if holidays table exists and has data
    const allHolidays = await sequelize.query(
      'SELECT * FROM holidays ORDER BY date',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('📊 Total holidays in database:', allHolidays.length);
    console.log('First 3 holidays:', allHolidays.slice(0, 3));
    console.log('');

    // Test 2: Check current date
    const currentDate = await sequelize.query(
      'SELECT CURDATE() as today',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('📅 Current date in MySQL:', currentDate[0].today);
    console.log('');

    // Test 3: Check upcoming holidays
    const upcoming = await sequelize.query(
      'SELECT * FROM holidays WHERE date >= CURDATE() ORDER BY date LIMIT 5',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('🎉 Upcoming holidays:', upcoming.length);
    console.log('Upcoming holidays data:', upcoming);
    console.log('');

    // Test 4: Check specific date
    const valentines = await sequelize.query(
      "SELECT * FROM holidays WHERE date = '2026-02-14'",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('💝 Valentine\'s Day (2026-02-14):', valentines);
    console.log('');

    // Test 5: Check date comparison
    const comparison = await sequelize.query(
      "SELECT date, name, date >= CURDATE() as is_upcoming FROM holidays ORDER BY date LIMIT 5",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('🔍 Date comparison check:', comparison);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testHolidays();
