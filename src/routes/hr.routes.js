const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { getAllEmployees, getEmployeeById, getEmployeeBalancesById, updateLeaveRequestStatus, syncEmployeeBalances } = require('../controllers/hr.controller');

// Only HR role allowed
router.get('/employees', auth, role('HR'), getAllEmployees);
router.get('/employees/:id', auth, role('HR'), getEmployeeById);
router.get('/employees/:id/balances', auth, role('HR'), getEmployeeBalancesById);

// ✅ NEW ROUTE: Update Leave Request Status (Approve/Reject)
router.put('/leave-requests/:id/status', auth, role('HR'), updateLeaveRequestStatus);

// ✅ NEW ROUTE: Manually sync employee balances (if needed)
router.post('/employees/:id/sync-balances', auth, role('HR'), async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    const result = await syncEmployeeBalances(employeeId);
    
    if (result.success) {
      return res.json({ success: true, message: 'Balances synced successfully', data: result });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to sync balances', error: result.error });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error syncing balances', error: error.message });
  }
});

module.exports = router;