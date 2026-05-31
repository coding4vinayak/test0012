const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
}

router.use(requireAuth);

// List incidents
router.get('/', (req, res) => {
  const incidents = db.prepare(`
    SELECT i.*, m.name as monitor_name
    FROM incidents i
    JOIN monitors m ON i.monitor_id = m.id
    WHERE m.user_id = ?
    ORDER BY i.started_at DESC
  `).all(req.session.user.id);

  res.render('incidents/index', { incidents });
});

// New incident form
router.get('/new', (req, res) => {
  const monitors = db.prepare('SELECT * FROM monitors WHERE user_id = ?')
    .all(req.session.user.id);
  res.render('incidents/form', { incident: null, monitors, error: null });
});

// Create incident
router.post('/', (req, res) => {
  const { monitor_id, title, description, status } = req.body;

  if (!monitor_id || !title) {
    const monitors = db.prepare('SELECT * FROM monitors WHERE user_id = ?')
      .all(req.session.user.id);
    return res.render('incidents/form', {
      incident: null,
      monitors,
      error: 'Monitor and title are required'
    });
  }

  // Verify monitor belongs to user
  const monitor = db.prepare('SELECT * FROM monitors WHERE id = ? AND user_id = ?')
    .get(monitor_id, req.session.user.id);

  if (!monitor) {
    return res.redirect('/incidents');
  }

  db.prepare(
    'INSERT INTO incidents (monitor_id, title, description, status) VALUES (?, ?, ?, ?)'
  ).run(monitor_id, title, description || '', status || 'investigating');

  res.redirect('/incidents');
});

// Edit incident form
router.get('/:id/edit', (req, res) => {
  const incident = db.prepare(`
    SELECT i.* FROM incidents i
    JOIN monitors m ON i.monitor_id = m.id
    WHERE i.id = ? AND m.user_id = ?
  `).get(req.params.id, req.session.user.id);

  if (!incident) {
    return res.redirect('/incidents');
  }

  const monitors = db.prepare('SELECT * FROM monitors WHERE user_id = ?')
    .all(req.session.user.id);

  res.render('incidents/form', { incident, monitors, error: null });
});

// Update incident
router.post('/:id', (req, res) => {
  const { title, description, status } = req.body;

  if (!title) {
    const incident = db.prepare(`
      SELECT i.* FROM incidents i
      JOIN monitors m ON i.monitor_id = m.id
      WHERE i.id = ? AND m.user_id = ?
    `).get(req.params.id, req.session.user.id);
    const monitors = db.prepare('SELECT * FROM monitors WHERE user_id = ?')
      .all(req.session.user.id);
    return res.render('incidents/form', {
      incident,
      monitors,
      error: 'Title is required'
    });
  }

  db.prepare(
    'UPDATE incidents SET title = ?, description = ?, status = ? WHERE id = ?'
  ).run(title, description || '', status, req.params.id);

  res.redirect('/incidents');
});

// Resolve incident
router.post('/:id/resolve', (req, res) => {
  db.prepare(
    'UPDATE incidents SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run('resolved', req.params.id);

  res.redirect('/incidents');
});

// Delete incident
router.post('/:id/delete', (req, res) => {
  db.prepare(`
    DELETE FROM incidents WHERE id = ? AND monitor_id IN (
      SELECT id FROM monitors WHERE user_id = ?
    )
  `).run(req.params.id, req.session.user.id);

  res.redirect('/incidents');
});

module.exports = router;
