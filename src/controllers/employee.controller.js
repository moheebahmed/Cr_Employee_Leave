
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

// Get leave balances for the authenticated employee (uses database values updated by trigger)
const getLeaveBalances = async (req, res, next) => {
	try {
		const userId = req.user?.id;
		if (!userId) return errorResponse(res, 'Unauthorized', 401);

		const employee = await Employee.findOne({ where: { user_id: userId } });
		if (!employee) return errorResponse(res, 'Employee profile not found', 404);

		const balances = await LeaveBalance.findAll({
			where: { employee_id: employee.id },
			attributes: ['id', 'employee_id', 'leave_type_id', 'total_allowed', 'used', 'remaining', 'updated_at'],
			include: [{ 
				model: LeaveType,
				attributes: ['id', 'code', 'name', 'min_notice_days', 'allow_past_dates', 'created_at']
			}],
			raw: false,
			nest: true
		});

		const balancesData = balances.map(balance => {
			const data = balance.get({ plain: true });
			return data;
		});

		console.log('📊 Leave balances fetched:', JSON.stringify(balancesData, null, 2));

		return successResponse(res, 'Leave balances fetched', { balances: balancesData });
	} catch (err) {
		console.error('❌ Error fetching balances:', err);
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
			LeaveBalance.findAll({ 
				where: { employee_id: employee.id },
				attributes: ['id', 'employee_id', 'leave_type_id', 'total_allowed', 'used', 'remaining', 'updated_at'],
				include: [{ 
					model: LeaveType,
					attributes: ['id', 'code', 'name', 'min_notice_days', 'allow_past_dates', 'created_at']
				}],
				raw: false,
				nest: true
			}),
			LeaveRequest.findAll({ where: { employee_id: employee.id }, limit: 5, order: [['applied_at', 'DESC']] })
		]);

		const balancesData = balances.map(balance => {
			const data = balance.get({ plain: true });
			return data;
		});

		const holidays = await getUpcoming(2); // Show only 2 holidays

		console.log('📊 Dashboard balances:', JSON.stringify(balancesData, null, 2));

		return successResponse(res, 'Dashboard data', { profile: employee, balances: balancesData, recent_requests: requests, upcoming_holidays: holidays });
	} catch (err) {
		console.error('❌ Error fetching dashboard:', err);
		next(err);
	}
};

module.exports = {
	getProfile,
	updateProfile,
	getLeaveBalances,
	getDashboard
};

