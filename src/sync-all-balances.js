/**
 * One-time script to sync all employee balances in the database
 * Run this once to update all existing records
 * 
 * Usage: node src/sync-all-balances.js
 */

const { Employee, LeaveBalance, LeaveRequest } = require('./models');
const { sequelize } = require('./config/db');

async function syncAllEmployeeBalances() {
  try {
    console.log('🚀 Starting database sync for all employees...\n');

    // Get all employees
    const employees = await Employee.findAll({
      attributes: ['id', 'employee_code']
    });

    console.log(`Found ${employees.length} employees\n`);

    let totalUpdated = 0;

    for (const employee of employees) {
      console.log(`\n📋 Processing Employee ID: ${employee.id} (${employee.employee_code})`);
      console.log('═══════════════════════════════════════');

      // Get all leave balances for this employee
      const balances = await LeaveBalance.findAll({
        where: { employee_id: employee.id }
      });

      console.log(`  Found ${balances.length} leave types`);

      for (const balance of balances) {
        // Get all APPROVED leaves for this leave type
        const approvedLeaves = await LeaveRequest.findAll({
          where: {
            employee_id: employee.id,
            leave_type_id: balance.leave_type_id,
            status: 'APPROVED'
          }
        });

        // Calculate total used days
        const totalUsed = approvedLeaves.reduce((sum, leave) => sum + leave.total_days, 0);
        const newRemaining = balance.total_allowed - totalUsed;

        // Update database
        await balance.update({
          used: totalUsed,
          remaining: newRemaining
        });

        console.log(`  ✅ Leave Type ${balance.leave_type_id}: Allowed=${balance.total_allowed}, Used=${totalUsed}, Remaining=${newRemaining}`);
        totalUpdated++;
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ Sync completed successfully!`);
    console.log(`   Total records updated: ${totalUpdated}`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error syncing balances:', error);
    process.exit(1);
  }
}

// Run the sync
syncAllEmployeeBalances();
