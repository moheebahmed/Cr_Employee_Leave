const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  employee_code: {
    type: DataTypes.STRING(50),
    unique: true
  },
  full_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100)
  },
  designation: {
    type: DataTypes.STRING(100)
  },
  joining_date: {
    type: DataTypes.DATEONLY
  },
  confirmation_date: {
    type: DataTypes.DATEONLY
  }
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Employee;
