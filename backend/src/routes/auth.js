const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  // ...rest of code...
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    // Only allow admin registration if no admin exists
    let regRole = role === 'admin' ? 'admin' : 'student';
    if (role === 'admin') {
      const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      if (admins.length > 0) {
        return res.status(403).json({ message: 'Admin registration is closed.' });
      }
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, hash, regRole]);
    // Auto-login: return JWT and user info
    const user = { id: result.insertId, name, role: regRole };
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

module.exports = router; 