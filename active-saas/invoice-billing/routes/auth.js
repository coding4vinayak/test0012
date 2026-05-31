const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/database');

const router = express.Router();

// Show login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Show register page
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Handle registration
router.post('/register', async (req, res) => {
  const { email, password, business_name } = req.body;

  if (!email || !password) {
    return res.render('register', { error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.render('register', { error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.render('register', { error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, business_name) VALUES (?, ?, ?)'
    ).run(email, passwordHash, business_name || '');

    req.session.user = { id: result.lastInsertRowid, email, business_name: business_name || '' };
    res.redirect('/dashboard');
  } catch (err) {
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

// Handle login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    req.session.user = { id: user.id, email: user.email, business_name: user.business_name };
    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', { error: 'Login failed. Please try again.' });
  }
});

// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
