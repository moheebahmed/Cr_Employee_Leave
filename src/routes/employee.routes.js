const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, getLeaveBalances, getDashboard } = require('../controllers/employee.controller');
const {
    getLeaveTypes,
    calculateLeave,
    applyLeave,
    getMyLeaveRequests,
    getMyLeaveRequestById,
    getNotifications 
} = require('../controllers/leave.controller');

// Protected employee endpoints
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.get('/me/balances', auth, getLeaveBalances);
router.get('/leave-balances', auth, getLeaveBalances); 
router.get('/dashboard', auth, getDashboard);
// Notifications endpoint
router.get('/notifications', auth, getNotifications);  
// Leave-related endpoints
router.get('/leave/types', auth, getLeaveTypes);
router.post('/leave/calculate', auth, calculateLeave);
router.post('/leave/apply', auth, applyLeave);
router.get('/leave/requests', auth, getMyLeaveRequests);
router.get('/leave/requests/:id', auth, getMyLeaveRequestById);

module.exports = router;

