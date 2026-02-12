// Holiday service - Fetches holidays from MySQL database
const { sequelize } = require('../config/db');

/**
 * Get upcoming holidays from database
 * @param {number} limit - Number of holidays to return (default: 5)
 * @returns {Promise<Array>} Array of upcoming holidays
 */
async function getUpcoming(limit = 5) {
  try {
    const rows = await sequelize.query(
      `SELECT 
        date,
        name,
        weekday
      FROM holidays 
      WHERE date >= CURDATE() 
      ORDER BY date ASC 
      LIMIT ?`,
      {
        replacements: [limit],
        type: sequelize.QueryTypes.SELECT
      }
    );

    console.log('📅 Fetched holidays from database:', rows.length);

    // Format dates to YYYY-MM-DD string
    return rows.map(holiday => ({
      date: new Date(holiday.date).toISOString().split('T')[0],
      name: holiday.name,
      weekday: holiday.weekday
    }));
  } catch (error) {
    console.error('❌ Error fetching holidays from database:', error);
    // Fallback to empty array if database fails
    return [];
  }
}

/**
 * Check if a specific date is a holiday
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Promise<boolean>} True if date is a holiday
 */
async function isHoliday(dateStr) {
  if (!dateStr) return false;

  try {
    const rows = await sequelize.query(
      'SELECT id FROM holidays WHERE date = ?',
      {
        replacements: [dateStr],
        type: sequelize.QueryTypes.SELECT
      }
    );

    return rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking holiday:', error);
    return false;
  }
}

/**
 * Get all holidays
 * @returns {Promise<Array>} Array of all holidays
 */
async function getAll() {
  try {
    const rows = await sequelize.query(
      `SELECT 
        date,
        name,
        weekday
      FROM holidays 
      ORDER BY date ASC`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    return rows.map(holiday => ({
      date: new Date(holiday.date).toISOString().split('T')[0],
      name: holiday.name,
      weekday: holiday.weekday
    }));
  } catch (error) {
    console.error('❌ Error fetching all holidays:', error);
    return [];
  }
}

module.exports = { 
  getUpcoming, 
  isHoliday,
  getAll
};
