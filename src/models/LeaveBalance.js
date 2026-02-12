const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LeaveBalance = sequelize.define('LeaveBalance', {
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
  total_allowed: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  remaining: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'leave_balances',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    { unique: true, fields: ['employee_id', 'leave_type_id'], name: 'uniq_employee_leave' }
  ]
});

module.exports = LeaveBalance;
