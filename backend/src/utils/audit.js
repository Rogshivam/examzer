const pool = require('../models/db');

async function logAudit(user_id, action, details) {
  await pool.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [user_id, action, details]);
}

module.exports = { logAudit }; 