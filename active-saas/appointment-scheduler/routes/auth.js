const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/database');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  const { email, password, business_name } = req.body;

  if (!email || !password) {
    return res.render('register', { error: 'Email and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.render('register', { error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password, business_name) VALUES (?, ?, ?)'
  ).run(email, hashedPassword, business_name || 'My Business');

  req.session.user = { id: result.lastInsertRowid, email, business_name: business_name || 'My Business' };
  res.redirect('/dashboard');
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.render('login', { error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.render('login', { error: 'Invalid email or password' });
  }

  req.session.user = { id: user.id, email: user.email, business_name: user.business_name };
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
