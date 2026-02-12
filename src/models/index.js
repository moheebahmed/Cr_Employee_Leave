const { sequelize } = require('../config/db');

const User = require('./User');
const Employee = require('./Employee');
const LeaveType = require('./LeaveType');
const LeaveBalance = require('./LeaveBalance');
const LeaveRequest = require('./LeaveRequest');
const Notification = require('./Notification');

// Associations
User.hasOne(Employee, { foreignKey: 'user_id' });
Employee.belongsTo(User, { foreignKey: 'user_id' });

Employee.hasMany(LeaveBalance, { foreignKey: 'employee_id' });
LeaveBalance.belongsTo(Employee, { foreignKey: 'employee_id' });

LeaveType.hasMany(LeaveBalance, { foreignKey: 'leave_type_id' });
LeaveBalance.belongsTo(LeaveType, { foreignKey: 'leave_type_id' });

Employee.hasMany(LeaveRequest, { foreignKey: 'employee_id' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employee_id' });

LeaveType.hasMany(LeaveRequest, { foreignKey: 'leave_type_id' });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leave_type_id' });

// actioned_by references users(id)
User.hasMany(LeaveRequest, { foreignKey: 'actioned_by', as: 'actionedRequests' });
LeaveRequest.belongsTo(User, { foreignKey: 'actioned_by', as: 'actionedBy' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Employee,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Notification
};
