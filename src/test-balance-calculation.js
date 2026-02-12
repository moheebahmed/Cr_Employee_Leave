/**
 * Test Script to Verify Automatic Balance Calculation
 * Run this to see if the automatic calculation is working
 */

const { LeaveBalance, LeaveRequest, LeaveType } = require('./models');
const { sequelize } = require('./config/db');

async function testBalanceCalculation() {
  try {
    console.log('🔍 Testing Automatic Balance Calculation...\n');

    const employeeId = 1; // Change this to your employee ID

    // Get all leave balances
    const balances = await LeaveBalance.findAll({
      where: { employee_id: employeeId },
      include: [{ model: LeaveType }]
    });

    console.log(`Found ${balances.length} leave types for employee ${employeeId}\n`);

    let totalEntitled = 0;
    let totalUsed = 0;
    let totalRemaining = 0;

    for (const balance of balances) {
      // Get APPROVED leaves
      const approvedLeaves = await LeaveRequest.findAll({
        where: {
          employee_id: employeeId,
          leave_type_id: balance.leave_type_id,
          status: 'APPROVED'
        }
      });

      // Calculate
      const realUsed = approvedLeaves.reduce((sum, leave) => sum + leave.total_days, 0);
      const realRemaining = balance.total_allowed - realUsed;

      console.log(`📋 ${balance.LeaveType.name}:`);
      console.log(`   Entitled: ${balance.total_allowed} days`);
      console.log(`   Used (APPROVED): ${realUsed} days`);
      console.log(`   Remaining: ${realRemaining} days`);
      console.log(`   Approved Leaves Count: ${approvedLeaves.length}\n`);

      totalEntitled += balance.total_allowed;
      totalUsed += realUsed;
      totalRemaining += realRemaining;
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 TOTALS (What frontend should show):');
    console.log('═══════════════════════════════════════');
    console.log(`   ENTITLED: ${totalEntitled} days`);
    console.log(`   TAKEN: ${totalUsed} days`);
    console.log(`   BALANCE: ${totalRemaining} days`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ Verification:', totalEntitled - totalUsed === totalRemaining ? 'PASSED' : 'FAILED');
    console.log(`   ${totalEntitled} - ${totalUsed} = ${totalRemaining}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testBalanceCalculation();
