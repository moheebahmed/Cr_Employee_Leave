 /**
 * Utility function to automatically sync leave_balances table
 * This keeps the database in sync with real-time calculations
 */

const { LeaveBalance, LeaveRequest } = require('../models');

/**
 * Sync a specific leave balance for an employee
 * @param {number} employeeId - Employee ID
 * @param {number} leaveTypeId - Leave Type ID
 */
const syncLeaveBalance = async (employeeId, leaveTypeId) => {
  try {
    console.log(`🔄 Auto-syncing balance for employee ${employeeId}, leave type ${leaveTypeId}...`);

    // Get all APPROVED leaves for this employee and leave type
    const approvedLeaves = await LeaveRequest.findAll({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        status: 'APPROVED'
      }
    });

    // Calculate total used days
    const totalUsed = approvedLeaves.reduce((sum, leave) => sum + leave.total_days, 0);

    // Find the balance record
    const balance = await LeaveBalance.findOne({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId
      }
    });

    if (balance) {
      const newRemaining = balance.total_allowed - totalUsed;
      
      // Update database
      await balance.update({
        used: totalUsed,
        remaining: newRemaining
      });

      console.log(`✅ Database synced: used=${totalUsed}, remaining=${newRemaining}`);
      return { success: true, used: totalUsed, remaining: newRemaining };
    } else {
      console.log('⚠️ Balance record not found');
      return { success: false, message: 'Balance record not found' };
    }
  } catch (error) {
    console.error('❌ Error syncing balance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync all leave balances for an employee
 * @param {number} employeeId - Employee ID
 */
const syncAllBalances = async (employeeId) => {
  try {
    console.log(`🔄 Auto-syncing all balances for employee ${employeeId}...`);

    const balances = await LeaveBalance.findAll({
      where: { employee_id: employeeId }
    });

    const results = [];

    for (const balance of balances) {
      const result = await syncLeaveBalance(employeeId, balance.leave_type_id);
      results.push({
        leave_type_id: balance.leave_type_id,
        ...result
      });
    }

    console.log('✅ All balances synced successfully!');
    return { success: true, results };
  } catch (error) {
    console.error('❌ Error syncing all balances:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  syncLeaveBalance,
  syncAllBalances
};
