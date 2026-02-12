const { connectDB, sequelize } = require('./config/db');

async function testConnection() {
  try {
    await connectDB();
    
    // Test query
    const [results] = await sequelize.query('SELECT 1 + 1 AS result');
    console.log('Test query result:', results[0].result);
    
    console.log('✅ MySQL connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MySQL connection test failed:', error);
    process.exit(1);
  }
}

testConnection();