const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LeaveType = sequelize.define('LeaveType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  min_notice_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  allow_past_dates: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'leave_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = LeaveType;
