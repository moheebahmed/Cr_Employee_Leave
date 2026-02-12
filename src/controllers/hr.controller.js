const { successResponse, errorResponse } = require('../utils/response');
const { User, Employee, LeaveBalance, LeaveType, LeaveRequest, Notification } = require('../models');
const { syncLeaveBalance, syncAllBalances } = require('../utils/syncBalances');

const getAllEmployees = async (req, res, next) => {
    try {
        const employees = await Employee.findAll({ include: [{ model: User, attributes: ['id', 'email', 'role'] }] });
        return successResponse(res, 'Employees list', { employees });
    } catch (err) {
        next(err);
    }
};

const getEmployeeById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const employee = await Employee.findByPk(id, { include: [{ model: User, attributes: ['id', 'email', 'role'] }] });
        if (!employee) return errorResponse(res, 'Employee not found', 404);
        return successResponse(res, 'Employee fetched', { employee });
    } catch (err) {
        next(err);
    }
};

const getEmployeeBalancesById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const balances = await LeaveBalance.findAll({ where: { employee_id: id }, include: [{ model: LeaveType }] });
        return successResponse(res, 'Employee balances', { balances });
    } catch (err) {
        next(err);
    }
};

//NEW FUNCTION: Update Leave Status & Create Notification
const updateLeaveRequestStatus = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { status, rejection_reason } = req.body; // status: 'APPROVED' or 'REJECTED'

    // 1. Find the Leave Request
    const request = await LeaveRequest.findByPk(requestId);
    if (!request) {
      return errorResponse(res, 'Leave request not found', 404);
    }

    // 2. Check if already processed
    if (request.status !== 'PENDING') {
      return errorResponse(res, 'Request already processed', 400);
    }

    // 3. Update Request Status
    request.status = status;
    request.actioned_by = req.user.id; 
    request.actioned_at = new Date();
    if (status === 'REJECTED' && rejection_reason) {
      request.rejection_reason = rejection_reason;
    }
    await request.save();

    // 4. AUTOMATIC DATABASE UPDATE: Update leave_balances table
    console.log('🔄 Automatically updating leave_balances in database...');
    console.log(`   Employee ID: ${request.employee_id}`);
    console.log(`   Leave Type ID: ${request.leave_type_id}`);
    console.log(`   Status: ${status}`);
    
    // Use the sync utility function
    const syncResult = await syncLeaveBalance(request.employee_id, request.leave_type_id);
    
    if (syncResult.success) {
      console.log(`✅ Sync successful: used=${syncResult.used}, remaining=${syncResult.remaining}`);
    } else {
      console.error(`❌ Sync failed:`, syncResult);
    }

    // 5. Create Notification for the Employee
    const employee = await Employee.findByPk(request.employee_id);
    
    if (employee && employee.user_id) {
      let title = 'Leave Request Update';
      let message = '';

      if (status === 'APPROVED') {
        title = 'Leave Approved';
        message = `Your request for ${request.total_days} days has been approved. Enjoy your leave!`;
      } else {
        title = 'Leave Rejected';
        message = rejection_reason || 'Your leave request has been rejected by management.';
      }

      await Notification.create({
        user_id: employee.user_id,
        title: title,
        message: message,
        is_read: false
      });
    }

    return successResponse(res, `Leave request ${status.toLowerCase()} successfully`, { request });

  } catch (err) {
    console.error('Update Status Error:', err);
    next(err);
  }
};

// HELPER FUNCTION: Sync all leave balances for an employee
const syncEmployeeBalances = async (employeeId) => {
  return await syncAllBalances(employeeId);
};

module.exports = {
    getAllEmployees,
    getEmployeeById,
    getEmployeeBalancesById,
    updateLeaveRequestStatus,
    syncEmployeeBalances
};