const { LeaveType, LeaveRequest, LeaveBalance, Employee, User, Notification } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

const inclusiveDays = (startDate, endDate) => {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const workingDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

//  GET /api/employee/leave/types - Get all leave types
const getLeaveTypes = async (req, res, next) => {
  try {
    const leaveTypes = await LeaveType.findAll({
      attributes: ['id', 'code', 'name', 'min_notice_days', 'allow_past_dates'],
      order: [['name', 'ASC']]
    });

    return successResponse(res, 'Leave types retrieved successfully', {
      leave_types: leaveTypes
    });
  } catch (err) {
    console.error('Get Leave Types Error:', err);
    next(err);
  }
};

//   POST /api/employee/leave/calculate - Calculate leave duration
const calculateLeave = async (req, res, next) => {
  try {
    const { leave_type_id, start_date, end_date } = req.body;

    console.log('=== Calculate Leave Request ===');
    console.log('Leave Type ID:', leave_type_id);
    console.log('Start Date:', start_date);
    console.log('End Date:', end_date);

    // Validation
    if (!leave_type_id || !start_date || !end_date) {
      return errorResponse(res, 'Missing required fields: leave_type_id, start_date, end_date', 400);
    }

    // Get leave type
    const type = await LeaveType.findByPk(leave_type_id);
    if (!type) {
      return errorResponse(res, 'Leave type not found', 404);
    }

    // Date setup
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(start_date + 'T00:00:00');
    const end = new Date(end_date + 'T00:00:00');
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Date validation
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse(res, 'Invalid date format. Use YYYY-MM-DD', 400);
    }

    if (end < start) {
      return errorResponse(res, 'End date cannot be before start date', 400);
    }

    const allowPast = !!type.allow_past_dates;
    const minNotice = parseInt(type.min_notice_days || 0, 10);

    //   Calculate days
    const raw_total_days = inclusiveDays(start_date, end_date);
    const working_days = workingDaysBetween(start_date, end_date);

    //  FIX: Define total_days (use working_days for most companies)
    const total_days = working_days;

    console.log('Raw Days:', raw_total_days);
    console.log('Working Days:', working_days);
    console.log('Total Days:', total_days);

    // Validate past date
    if (!allowPast && start < today) {
      return errorResponse(res, 'Start date cannot be in the past for this leave type', 400);
    }

    // Notice days validation: start s"My work is going fine, you’ll let me know."uld be at least minNotice days after today
    const diffDays = Math.round((start - today) / (24 * 60 * 60 * 1000));
    if (diffDays < minNotice) {
      return errorResponse(res, `This leave must be applied at least ${minNotice} day(s) in advance`, 400);
    }

    console.log(' Calculation successful!');

    //    Return proper response
    return successResponse(res, 'Leave duration calculated successfully', {
      total_days: total_days,
      raw_days: raw_total_days,
      working_days: working_days,
      start_date: start_date,
      end_date: end_date,
      min_notice_days: minNotice,
      allow_past_dates: allowPast
    });
  } catch (err) {
    console.error('  Calculate Leave Error:', err);
    next(err); 
  }
};

//   POST /api/employee/leave/apply - Apply for leave
const applyLeave = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const { leave_type_id, start_date, end_date, total_days, reason, attachment_url } = req.body;

    console.log('=== Apply Leave Request ===');
    console.log('Employee ID:', employeeId);
    console.log('Leave Type ID:', leave_type_id);
    console.log('Start Date:', start_date);
    console.log('End Date:', end_date);
    console.log('Total Days:', total_days);

    // Validation
    if (!leave_type_id || !start_date || !end_date || !total_days || !reason) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    if (total_days <= 0) {
      return errorResponse(res, 'Invalid total_days value', 400);
    }

    // Check leave type exists
    const leaveType = await LeaveType.findByPk(leave_type_id);
    if (!leaveType) {
      return errorResponse(res, 'Leave type not found', 404);
    }

    // Check employee balance
    const balance = await LeaveBalance.findOne({
      where: {
        employee_id: employeeId,
        leave_type_id: leave_type_id
      }
    });

    if (!balance) {
      return errorResponse(res, 'No leave balance found for this leave type', 404);
    }

    // Calculate real available balance (considering APPROVED + PENDING leaves)
    const approvedAndPendingLeaves = await LeaveRequest.findAll({
      where: {
        employee_id: employeeId,
        leave_type_id: leave_type_id,
        status: ['APPROVED', 'PENDING']
      }
    });

    const totalUsedAndPending = approvedAndPendingLeaves.reduce((sum, leave) => sum + leave.total_days, 0);
    const actualAvailable = balance.total_allowed - totalUsedAndPending;

    console.log(`📊 Balance Check for Leave Type ${leave_type_id}:`);
    console.log(`   Total Allowed: ${balance.total_allowed}`);
    console.log(`   Already Used (APPROVED): ${approvedAndPendingLeaves.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + l.total_days, 0)}`);
    console.log(`   Pending Approval: ${approvedAndPendingLeaves.filter(l => l.status === 'PENDING').reduce((sum, l) => sum + l.total_days, 0)}`);
    console.log(`   Total Used + Pending: ${totalUsedAndPending}`);
    console.log(`   Actually Available: ${actualAvailable}`);
    console.log(`   Requesting: ${total_days} days`);

    if (actualAvailable < total_days) {
      return errorResponse(res, `Insufficient balance. You have ${actualAvailable} days available (including pending leaves)`, 400);
    }

    // Check for date overlaps with existing PENDING leaves (any leave type)
    const requestStartDate = new Date(start_date);
    const requestEndDate = new Date(end_date);

    const pendingLeaves = await LeaveRequest.findAll({
      where: {
        employee_id: employeeId,
        status: 'PENDING'
      },
      include: [{
        model: LeaveType,
        attributes: ['name']
      }]
    });

    console.log('🔍 Checking for date overlaps with pending leaves...');
    
    for (const pendingLeave of pendingLeaves) {
      const pendingStartDate = new Date(pendingLeave.start_date);
      const pendingEndDate = new Date(pendingLeave.end_date);
      
      // Check if dates overlap
      const hasOverlap = requestStartDate <= pendingEndDate && requestEndDate >= pendingStartDate;
      
      if (hasOverlap) {
        console.log(`❌ Date overlap detected with pending leave:`);
        console.log(`   Pending Leave: ${pendingStartDate.toDateString()} to ${pendingEndDate.toDateString()} (${pendingLeave.LeaveType.name})`);
        console.log(`   New Request: ${requestStartDate.toDateString()} to ${requestEndDate.toDateString()}`);
        
        return errorResponse(res, 
          `Cannot submit leave request. You have a pending ${pendingLeave.LeaveType.name} leave from ${pendingStartDate.toDateString()} to ${pendingEndDate.toDateString()}. Please wait for approval or cancel the existing request.`, 
          400
        );
      }
    }

    console.log('✅ No date overlaps found with pending leaves');

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      employee_id: employeeId,
      leave_type_id: leave_type_id,
      start_date: start_date,
      end_date: end_date,
      total_days: total_days,
      reason: reason.trim(),
      attachment_url: attachment_url || null,
      status: 'PENDING',
      applied_at: new Date()
    });

    console.log('  Leave request created:', leaveRequest.id);

    return successResponse(res, 'Leave request submitted successfully', {
      request_id: leaveRequest.id,
      status: leaveRequest.status,
      total_days: leaveRequest.total_days
    }, 201);

  } catch (err) {
    console.error('  Apply Leave Error:', err);
    next(err);
  }
};

//   GET /api/employee/leave/requests - Get my leave requests
const getMyLeaveRequests = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;

    const requests = await LeaveRequest.findAll({
      where: { employee_id: employeeId },
      include: [
        {
          model: LeaveType,
          attributes: ['id', 'code', 'name']
        }
      ],
      order: [['applied_at', 'DESC']]
    });

    return successResponse(res, 'Leave requests retrieved successfully', {
      requests: requests
    });

  } catch (err) {
    console.error('Get Leave Requests Error:', err);
    next(err);
  }
};

//  GET /api/employee/leave/requests/:id - Get specific leave request
const getMyLeaveRequestById = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const requestId = req.params.id;

    const request = await LeaveRequest.findOne({
      where: {
        id: requestId,
        employee_id: employeeId
      },
      include: [
        {
          model: LeaveType,
          attributes: ['id', 'code', 'name']
        }
      ]
    });

    if (!request) {
      return errorResponse(res, 'Leave request not found', 404);
    }

    return successResponse(res, 'Leave request retrieved successfully', {
      request: request
    });

  } catch (err) {
    console.error('Get Leave Request Error:', err);
    next(err);
  }
};

//  GET /api/employee/notifications - Get user notifications (NEW FUNCTION)
//  GET /api/employee/notifications - Get user notifications (Merged with LeaveStatus)
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id; // User ID from token
    const employeeId = req.user.employee_id; // Employee ID from token

    console.log('=== Fetching Notifications ===');
    console.log('User ID:', userId);
    console.log('Employee ID:', employeeId);

    // 1. Fetch Standard Notifications from 'Notification' table
    const dbNotifications = await Notification.findAll({
      where: { user_id: userId },
      raw: true
    });

    const leaveRequests = await LeaveRequest.findAll({
      where: {
        employee_id: employeeId
      },
      // ✅ FIX: Use 'applied_at' and 'actioned_at' instead of created_at/updated_at
      attributes: ['id', 'status', 'start_date', 'total_days', 'applied_at', 'actioned_at'],
      include: [{ model: LeaveType, attributes: ['name'] }],
      order: [['applied_at', 'DESC']],
      raw: true,
      nest: true
    });

    console.log(`Found ${dbNotifications.length} DB notifications and ${leaveRequests.length} leave requests.`);

    // 3. Convert Leave Requests to Notification Format
    const leaveNotifications = leaveRequests.map(leave => {
      let title = '';
      let message = '';
      let date = leave.actioned_at || leave.applied_at;

      const leaveName = leave.LeaveType.name;
      const startDate = new Date(leave.start_date).toLocaleDateString();

      switch (leave.status) {
        case 'APPROVED':
          title = 'Leave Request Approved';
          message = `Your ${leaveName} application starting ${startDate} has been approved.`;
          break;
        case 'REJECTED':
          title = 'Leave Request Rejected';
          message = `Your ${leaveName} application starting ${startDate} has been rejected.`;
          break;
        case 'PENDING':
          title = 'Leave Application Submitted';
          message = `Your ${leaveName} application for ${leave.total_days} days is pending review.`;
          date = leave.applied_at;  
          break;
        default:
          return null;
      }

      return {
        id: `leave-${leave.id}-${leave.status}`, 
        title: title,
        message: message,
        is_read: false, 
        created_at: date,
        type: 'leave_status'
      };
    }).filter(n => n !== null); 

    // 4. Merge and Sort
    const allNotifications = [...dbNotifications, ...leaveNotifications];

    // Sort by created_at DESC (Newest first)
    allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return successResponse(res, 'Notifications retrieved successfully', {
      notifications: allNotifications
    });

  } catch (err) {
    console.error('Get Notifications Error:', err);
    next(err);
  }
};
module.exports = {
  getLeaveTypes,
  calculateLeave,
  applyLeave,
  getMyLeaveRequests,
  getMyLeaveRequestById,
  getNotifications //   add  
};