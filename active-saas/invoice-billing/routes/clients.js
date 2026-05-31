const express = require('express');
const db = require('../db/database');

const router = express.Router();

// List clients
router.get('/', (req, res) => {
  const clients = db.prepare(
    'SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC'
  ).all(req.session.user.id);
  res.render('clients/index', { clients });
});

// New client form
router.get('/new', (req, res) => {
  res.render('clients/form', { client: null, error: null });
});

// Create client
router.post('/', (req, res) => {
  const { name, email, address, phone } = req.body;

  if (!name || !email) {
    return res.render('clients/form', {
      client: req.body,
      error: 'Name and email are required'
    });
  }

  db.prepare(
    'INSERT INTO clients (user_id, name, email, address, phone) VALUES (?, ?, ?, ?, ?)'
  ).run(req.session.user.id, name, email, address || '', phone || '');

  res.redirect('/clients');
});

// Edit client form
router.get('/:id/edit', (req, res) => {
  const client = db.prepare(
    'SELECT * FROM clients WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!client) {
    return res.redirect('/clients');
  }

  res.render('clients/form', { client, error: null });
});

// Update client
router.post('/:id', (req, res) => {
  const { name, email, address, phone } = req.body;

  if (!name || !email) {
    return res.render('clients/form', {
      client: { ...req.body, id: req.params.id },
      error: 'Name and email are required'
    });
  }

  db.prepare(
    'UPDATE clients SET name = ?, email = ?, address = ?, phone = ? WHERE id = ? AND user_id = ?'
  ).run(name, email, address || '', phone || '', req.params.id, req.session.user.id);

  res.redirect('/clients');
});

// Delete client
router.post('/:id/delete', (req, res) => {
  db.prepare(
    'DELETE FROM clients WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.session.user.id);

  res.redirect('/clients');
});

module.exports = router;
