 
const pool = require('../config/db');

async function approveLeave(leaveId, hrUserId) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[leave]] = await conn.query(
      `SELECT * FROM leave_requests WHERE id = ? AND status = 'PENDING' FOR UPDATE`,
      [leaveId]
    );

    if (!leave) throw new Error('Leave not found or already processed');

    const [[balance]] = await conn.query(
      `SELECT * FROM leave_balances 
       WHERE employee_id = ? AND leave_type_id = ?
       FOR UPDATE`,
      [leave.employee_id, leave.leave_type_id]
    );

    if (balance.remaining < leave.total_days) {
      throw new Error('Insufficient leave balance');
    }

    await conn.query(
      `UPDATE leave_requests 
       SET status = 'APPROVED', actioned_by = ?, actioned_at = NOW()
       WHERE id = ?`,
      [hrUserId, leaveId]
    );

    await conn.query(
      `UPDATE leave_balances 
       SET used = used + ?, remaining = remaining - ?
       WHERE id = ?`,
      [leave.total_days, leave.total_days, balance.id]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { approveLeave };
