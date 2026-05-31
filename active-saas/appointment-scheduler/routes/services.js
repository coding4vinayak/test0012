const express = require('express');
const db = require('../db/database');

const router = express.Router();

// List services
router.get('/', (req, res) => {
  const userId = req.session.user.id;
  const services = db.prepare('SELECT * FROM services WHERE user_id = ? ORDER BY name ASC').all(userId);
  res.render('services/index', { services, error: null });
});

// New service form
router.get('/new', (req, res) => {
  res.render('services/form', { service: null, error: null });
});

// Create service
router.post('/', (req, res) => {
  const userId = req.session.user.id;
  const { name, duration_minutes, price, description } = req.body;

  if (!name || !duration_minutes) {
    const services = db.prepare('SELECT * FROM services WHERE user_id = ? ORDER BY name ASC').all(userId);
    return res.render('services/index', { services, error: 'Name and duration are required' });
  }

  db.prepare(
    'INSERT INTO services (user_id, name, duration_minutes, price, description) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, name, parseInt(duration_minutes), parseFloat(price) || 0, description || '');

  res.redirect('/services');
});

// Edit service form
router.get('/:id/edit', (req, res) => {
  const userId = req.session.user.id;
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND user_id = ?').get(req.params.id, userId);

  if (!service) {
    return res.redirect('/services');
  }

  res.render('services/form', { service, error: null });
});

// Update service
router.post('/:id', (req, res) => {
  const userId = req.session.user.id;
  const { name, duration_minutes, price, description } = req.body;

  if (!name || !duration_minutes) {
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    return res.render('services/form', { service, error: 'Name and duration are required' });
  }

  db.prepare(
    'UPDATE services SET name = ?, duration_minutes = ?, price = ?, description = ? WHERE id = ? AND user_id = ?'
  ).run(name, parseInt(duration_minutes), parseFloat(price) || 0, description || '', req.params.id, userId);

  res.redirect('/services');
});

// Delete service
router.post('/:id/delete', (req, res) => {
  const userId = req.session.user.id;
  db.prepare('DELETE FROM services WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.redirect('/services');
});

module.exports = router;
