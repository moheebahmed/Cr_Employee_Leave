
const { successResponse, errorResponse } = require('../utils/response');
const { User, Employee, LeaveBalance, LeaveType, LeaveRequest } = require('../models');
const { getUpcoming } = require('../services/holidays.service');

// Get profile for the currently authenticated user (employee)
const getProfile = async (req, res, next) => {
	try {
		const userId = req.user?.id;
		if (!userId) return errorResponse(res, 'Unauthorized', 401);

		const employee = await Employee.findOne({
			where: { user_id: userId },
			include: [{ model: User, attributes: ['id', 'email', 'role', 'is_active'] }]
		});

		if (!employee) return errorResponse(res, 'Employee profile not found', 404);

		return successResponse(res, 'Profile fetched', { profile: employee });
	} catch (err) {
		next(err);
	}
};

// Update profile for the authenticated user (partial updates)
const updateProfile = async (req, res, next) => {
	try {
		const userId = req.user?.id;
		if (!userId) return errorResponse(res, 'Unauthorized', 401);

		const employee = await Employee.findOne({ where: { user_id: userId } });
		if (!employee) return errorResponse(res, 'Employee profile not found', 404);

		await employee.update(req.body || {});
		return successResponse(res, 'Profile updated', { profile: employee });
	} catch (err) {
		next(err);
	}
};

// Get leave balances for the authenticated employee (with real-time calculation)
const getLeaveBalances = async (req, res, next) => {
	try {
		const userId = req.user?.id;
		if (!userId) return errorResponse(res, 'Unauthorized', 401);

		const employee = await Employee.findOne({ where: { user_id: userId } });
		if (!employee) return errorResponse(res, 'Employee profile not found', 404);

		const balances = await LeaveBalance.findAll({
			where: { employee_id: employee.id },
			include: [{ model: LeaveType }]
		});

		// Calculate real-time 'used' and 'remaining' from APPROVED leaves
		const balancesWithRealTimeData = await Promise.all(
			balances.map(async (balance) => {
				// Get all APPROVED leaves for this leave type
				const approvedLeaves = await LeaveRequest.findAll({
					where: {
						employee_id: employee.id,
						leave_type_id: balance.leave_type_id,
						status: 'APPROVED'
					}
				});

				// Calculate total used days
				const realUsed = approvedLeaves.reduce((sum, leave) => sum + leave.total_days, 0);
				const realRemaining = balance.total_allowed - realUsed;

				console.log(`Leave Type ${balance.leave_type_id}: Allowed=${balance.total_allowed}, Used=${realUsed}, Remaining=${realRemaining}`);

				// Return balance with real-time calculated values
				return {
					...balance.toJSON(),
					used: realUsed,
					remaining: realRemaining
				};
			})
		);

		console.log('📊 Total balances calculated:', balancesWithRealTimeData.length);

		return successResponse(res, 'Leave balances fetched', { balances: balancesWithRealTimeData });
	} catch (err) {
		next(err);
	}
};

// Combined dashboard data: profile + balances + recent leave requests (basic)
const getDashboard = async (req, res, next) => {
	try {
		const userId = req.user?.id;
		if (!userId) return errorResponse(res, 'Unauthorized', 401);

		const employee = await Employee.findOne({
			where: { user_id: userId },
			include: [{ model: User, attributes: ['id', 'email', 'role', 'is_active'] }]
		});
		if (!employee) return errorResponse(res, 'Employee profile not found', 404);

		const [balances, requests] = await Promise.all([
			LeaveBalance.findAll({ where: { employee_id: employee.id }, include: [{ model: LeaveType }] }),
			LeaveRequest.findAll({ where: { employee_id: employee.id }, limit: 5, order: [['applied_at', 'DESC']] })
		]);

		// Calculate real-time 'used' and 'remaining' from APPROVED leaves
		const balancesWithRealTimeData = await Promise.all(
			balances.map(async (balance) => {
				// Get all APPROVED leaves for this leave type
				const approvedLeaves = await LeaveRequest.findAll({
					where: {
						employee_id: employee.id,
						leave_type_id: balance.leave_type_id,
						status: 'APPROVED'
					}
				});

				// Calculate total used days
				const realUsed = approvedLeaves.reduce((sum, leave) => sum + leave.total_days, 0);
				const realRemaining = balance.total_allowed - realUsed;

				// Return balance with real-time calculated values
				return {
					...balance.toJSON(),
					used: realUsed,
					remaining: realRemaining
				};
			})
		);

		const holidays = await getUpcoming(2); // Show only 2 holidays

		return successResponse(res, 'Dashboard data', { profile: employee, balances: balancesWithRealTimeData, recent_requests: requests, upcoming_holidays: holidays });
	} catch (err) {
		next(err);
	}
};

module.exports = {
	getProfile,
	updateProfile,
	getLeaveBalances,
	getDashboard
};

