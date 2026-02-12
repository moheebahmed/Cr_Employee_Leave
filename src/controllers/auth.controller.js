 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'User already exists', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Normalize role to match DB enum values (EMPLOYEE or HR)
    const normalizedRole = (role || 'EMPLOYEE').toUpperCase();

    // Create user (password field in DB is `password_hash`)
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      role: normalizedRole
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password_hash from response
    const userResponse = { ...user.toJSON() };
    delete userResponse.password_hash;

    return successResponse(res, 'User registered successfully', {
      user: userResponse,
      token
    }, 201);

  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    console.log(req.body );
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }
 
    // Check password against password_hash
    // const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    // if (!isPasswordValid) {
    //   return errorResponse(res, 'Invalid credentials', 401);
    // }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password_hash from response
    const userResponse = { ...user.toJSON() };
    delete userResponse.password_hash;

    return successResponse(res, 'Login successful', {
      user: userResponse,
      token
    });

  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // In a real app, you might want to blacklist the token
    return successResponse(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout
};