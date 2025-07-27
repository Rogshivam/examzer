const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { sendEmail } = require('../utils/email');
const { logAudit } = require('../utils/audit');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Multer setup for exam document upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// All admin endpoints require admin role
router.use(authenticateJWT, authorizeRoles('admin'));

// Add a new student
router.post('/students', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, hash, 'student']);
    await logAudit(req.user.id, 'add_student', `Added student ${email}`);
    res.json({ message: 'Student added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding student' });
  }
});

// Create a new exam
router.post('/exams', async (req, res) => {
  const { name, date, description, created_by } = req.body;
  try {
    await pool.query('INSERT INTO exams (name, date, description, created_by) VALUES (?, ?, ?, ?)', [name, date, description, created_by]);
    await logAudit(req.user.id, 'create_exam', `Created exam ${name}`);
    res.json({ message: 'Exam created' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating exam' });
  }
});

// Add a student group
router.post('/groups', async (req, res) => {
  const { name, exam_id } = req.body;
  try {
    await pool.query('INSERT INTO student_groups (name, exam_id) VALUES (?, ?)', [name, exam_id]);
    await logAudit(req.user.id, 'add_group', `Added group ${name}`);
    res.json({ message: 'Group added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding group' });
  }
});

// Upload or edit exam document
router.post('/exams/:id/document', upload.single('document'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const filePath = `/uploads/${req.file.filename}`;
  try {
    await pool.query('UPDATE exams SET document_path = ? WHERE id = ?', [filePath, id]);
    await logAudit(req.user.id, 'upload_exam_document', `Uploaded document for exam ${id}`);
    res.json({ message: 'Document uploaded', filePath });
  } catch (err) {
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// Serve exam document (for students and admins)
router.get('/exams/:id/document', async (req, res) => {
  const { id } = req.params;
  try {
    const [[exam]] = await pool.query('SELECT document_path FROM exams WHERE id = ?', [id]);
    if (!exam || !exam.document_path) return res.status(404).json({ message: 'Document not found' });
    res.sendFile(path.join(__dirname, '../../', exam.document_path));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching document' });
  }
});

// View all students
router.get('/students', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE role = "student"');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// View all exams
router.get('/exams', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exams');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching exams' });
  }
});

// View all groups
router.get('/groups', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT g.*, e.name as examName FROM student_groups g LEFT JOIN exams e ON g.exam_id = e.id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching groups' });
  }
});

// View all submitted forms
router.get('/forms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT f.*, u.name as studentName, e.name as examName FROM exam_forms f LEFT JOIN users u ON f.student_id = u.id LEFT JOIN exams e ON f.exam_id = e.id');
    await logAudit(req.user.id, 'view_forms', 'Viewed all forms');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching forms' });
  }
});

// Accept a form and send email
router.post('/forms/:id/accept', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE exam_forms SET status = "accepted" WHERE id = ?', [id]);
    // Fetch student email
    const [[form]] = await pool.query('SELECT u.email, u.name, e.name as examName FROM exam_forms f JOIN users u ON f.student_id = u.id JOIN exams e ON f.exam_id = e.id WHERE f.id = ?', [id]);
    if (form) {
      await sendEmail(form.email, 'Hall Ticket Accepted', `Dear ${form.name}, your hall ticket for exam ${form.examName} has been accepted.`);
    }
    await logAudit(req.user.id, 'accept_form', `Accepted form ${id}`);
    res.json({ message: 'Form accepted and email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Error accepting form' });
  }
});

// View audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT l.*, u.name as userName FROM audit_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

module.exports = router; 