const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { generateHallTicket } = require('../utils/pdf');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// All student endpoints require student role
router.use(authenticateJWT, authorizeRoles('student'));

// Get available exams for the student (by group membership)
router.get('/exams/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT e.* FROM exams e
      JOIN student_groups g ON g.exam_id = e.id
      JOIN group_members m ON m.group_id = g.id
      WHERE m.student_id = ?
    `, [studentId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching exams' });
  }
});

// Submit exam form
router.post('/forms', async (req, res) => {
  const { student_id, exam_id, submission_data } = req.body;
  try {
    await pool.query('INSERT INTO exam_forms (student_id, exam_id, submission_data) VALUES (?, ?, ?)', [student_id, exam_id, JSON.stringify(submission_data)]);
    res.json({ message: 'Form submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting form' });
  }
});

// View my forms
router.get('/forms/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const [rows] = await pool.query('SELECT f.*, e.name as examName FROM exam_forms f LEFT JOIN exams e ON f.exam_id = e.id WHERE f.student_id = ?', [studentId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching forms' });
  }
});

// Download hall ticket (PDF)
router.get('/hallticket/:formId', async (req, res) => {
  const { formId } = req.params;
  try {
    const [[form]] = await pool.query('SELECT * FROM exam_forms WHERE id = ?', [formId]);
    if (!form || form.status !== 'accepted') return res.status(403).json({ message: 'Form not accepted or not found' });
    const [[student]] = await pool.query('SELECT * FROM users WHERE id = ?', [form.student_id]);
    const [[exam]] = await pool.query('SELECT * FROM exams WHERE id = ?', [form.exam_id]);
    form.submission_data = JSON.parse(form.submission_data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=hall_ticket.pdf');
    generateHallTicket(res, student, exam, form);
  } catch (err) {
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

module.exports = router; 