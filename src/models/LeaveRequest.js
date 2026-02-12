const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  leave_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  total_days: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachment_url: {
    type: DataTypes.STRING(255)
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING'
  },
  applied_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  actioned_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  actioned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'leave_requests',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['status'], name: 'idx_leave_requests_status' },
    { fields: ['employee_id'], name: 'idx_leave_requests_employee' }
  ]
});

module.exports = LeaveRequest;
