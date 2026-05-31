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

// List monitors
router.get('/', (req, res) => {
  const monitors = db.prepare('SELECT * FROM monitors WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.user.id);
  res.render('monitors/index', { monitors });
});

// New monitor form
router.get('/new', (req, res) => {
  res.render('monitors/form', { monitor: null, error: null });
});

// Create monitor
router.post('/', (req, res) => {
  const { name, url, check_interval_seconds } = req.body;

  if (!name || !url) {
    return res.render('monitors/form', {
      monitor: null,
      error: 'Name and URL are required'
    });
  }

  const interval = parseInt(check_interval_seconds) || 300;

  db.prepare(
    'INSERT INTO monitors (user_id, name, url, check_interval_seconds) VALUES (?, ?, ?, ?)'
  ).run(req.session.user.id, name, url, interval);

  res.redirect('/monitors');
});

// Edit monitor form
router.get('/:id/edit', (req, res) => {
  const monitor = db.prepare('SELECT * FROM monitors WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.user.id);

  if (!monitor) {
    return res.redirect('/monitors');
  }

  res.render('monitors/form', { monitor, error: null });
});

// Update monitor
router.post('/:id', (req, res) => {
  const { name, url, check_interval_seconds } = req.body;

  if (!name || !url) {
    const monitor = db.prepare('SELECT * FROM monitors WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.session.user.id);
    return res.render('monitors/form', {
      monitor,
      error: 'Name and URL are required'
    });
  }

  const interval = parseInt(check_interval_seconds) || 300;

  db.prepare(
    'UPDATE monitors SET name = ?, url = ?, check_interval_seconds = ? WHERE id = ? AND user_id = ?'
  ).run(name, url, interval, req.params.id, req.session.user.id);

  res.redirect('/monitors');
});

// Delete monitor
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM checks WHERE monitor_id = ?').run(req.params.id);
  db.prepare('DELETE FROM incidents WHERE monitor_id = ?').run(req.params.id);
  db.prepare('DELETE FROM monitors WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.user.id);
  res.redirect('/monitors');
});

// Manual check trigger
router.post('/:id/check', async (req, res) => {
  const monitor = db.prepare('SELECT * FROM monitors WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.user.id);

  if (!monitor) {
    return res.status(404).json({ error: 'Monitor not found' });
  }

  try {
    const start = Date.now();
    const response = await fetch(monitor.url, {
      method: 'GET',
      signal: AbortSignal.timeout(30000)
    });
    const responseTime = Date.now() - start;
    const statusCode = response.status;

    db.prepare(
      'INSERT INTO checks (monitor_id, status_code, response_time_ms) VALUES (?, ?, ?)'
    ).run(monitor.id, statusCode, responseTime);

    const newStatus = statusCode >= 200 && statusCode < 400 ? 'up' : 'down';
    db.prepare(
      'UPDATE monitors SET status = ?, last_checked_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(newStatus, monitor.id);

    res.json({ status: newStatus, status_code: statusCode, response_time_ms: responseTime });
  } catch (err) {
    db.prepare(
      'INSERT INTO checks (monitor_id, status_code, response_time_ms) VALUES (?, ?, ?)'
    ).run(monitor.id, 0, 0);

    db.prepare(
      'UPDATE monitors SET status = ?, last_checked_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('down', monitor.id);

    res.json({ status: 'down', status_code: 0, response_time_ms: 0, error: err.message });
  }
});

// API endpoint for dashboard auto-refresh
router.get('/api/status', (req, res) => {
  const monitors = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM checks WHERE monitor_id = m.id AND status_code >= 200 AND status_code < 400) as successful_checks,
      (SELECT COUNT(*) FROM checks WHERE monitor_id = m.id) as total_checks,
      (SELECT AVG(response_time_ms) FROM checks WHERE monitor_id = m.id AND checked_at >= datetime('now', '-24 hours')) as avg_response_time
    FROM monitors m
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `).all(req.session.user.id);

  monitors.forEach(m => {
    m.uptime_percent = m.total_checks > 0
      ? ((m.successful_checks / m.total_checks) * 100).toFixed(2)
      : null;
    m.avg_response_time = m.avg_response_time
      ? Math.round(m.avg_response_time)
      : null;
  });

  res.json(monitors);
});

module.exports = router;
