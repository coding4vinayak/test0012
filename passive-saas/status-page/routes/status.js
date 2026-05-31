const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Auth middleware for page management
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
}

// Create status page form
router.get('/pages/new', requireAuth, (req, res) => {
  res.render('status-pages/form', { page: null, error: null });
});

// Create status page
router.post('/pages', requireAuth, (req, res) => {
  const { slug, title, description, theme } = req.body;

  if (!slug || !title) {
    return res.render('status-pages/form', {
      page: null,
      error: 'Slug and title are required'
    });
  }

  const existing = db.prepare('SELECT id FROM status_pages WHERE slug = ?').get(slug);
  if (existing) {
    return res.render('status-pages/form', {
      page: null,
      error: 'Slug is already taken'
    });
  }

  db.prepare(
    'INSERT INTO status_pages (user_id, slug, title, description, theme) VALUES (?, ?, ?, ?, ?)'
  ).run(req.session.user.id, slug, title, description || '', theme || 'light');

  res.redirect('/dashboard');
});

// Edit status page form
router.get('/pages/:id/edit', requireAuth, (req, res) => {
  const page = db.prepare('SELECT * FROM status_pages WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.user.id);

  if (!page) {
    return res.redirect('/dashboard');
  }

  res.render('status-pages/form', { page, error: null });
});

// Update status page
router.post('/pages/:id', requireAuth, (req, res) => {
  const { slug, title, description, theme } = req.body;

  if (!slug || !title) {
    const page = db.prepare('SELECT * FROM status_pages WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.session.user.id);
    return res.render('status-pages/form', {
      page,
      error: 'Slug and title are required'
    });
  }

  db.prepare(
    'UPDATE status_pages SET slug = ?, title = ?, description = ?, theme = ? WHERE id = ? AND user_id = ?'
  ).run(slug, title, description || '', theme || 'light', req.params.id, req.session.user.id);

  res.redirect('/dashboard');
});

// Delete status page
router.post('/pages/:id/delete', requireAuth, (req, res) => {
  db.prepare('DELETE FROM status_pages WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.user.id);
  res.redirect('/dashboard');
});

// Public status page - render by slug
router.get('/:slug', (req, res) => {
  const page = db.prepare(`
    SELECT sp.*, u.email as owner_email
    FROM status_pages sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.slug = ?
  `).get(req.params.slug);

  if (!page) {
    return res.status(404).send('Status page not found');
  }

  const monitors = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM checks WHERE monitor_id = m.id AND status_code >= 200 AND status_code < 400) as successful_checks,
      (SELECT COUNT(*) FROM checks WHERE monitor_id = m.id) as total_checks,
      (SELECT AVG(response_time_ms) FROM checks WHERE monitor_id = m.id AND checked_at >= datetime('now', '-24 hours')) as avg_response_time
    FROM monitors m
    WHERE m.user_id = ?
    ORDER BY m.name ASC
  `).all(page.user_id);

  // Calculate uptime and get daily status for last 30 days
  monitors.forEach(m => {
    m.uptime_percent = m.total_checks > 0
      ? ((m.successful_checks / m.total_checks) * 100).toFixed(2)
      : 'N/A';
    m.avg_response_time = m.avg_response_time
      ? Math.round(m.avg_response_time)
      : 'N/A';

    // Get daily uptime for last 30 days
    m.daily_status = [];
    for (let i = 29; i >= 0; i--) {
      const dayChecks = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status_code >= 200 AND status_code < 400 THEN 1 ELSE 0 END) as successful
        FROM checks
        WHERE monitor_id = ?
          AND checked_at >= datetime('now', '-' || ? || ' days')
          AND checked_at < datetime('now', '-' || ? || ' days')
      `).get(m.id, i + 1, i);

      if (dayChecks.total > 0) {
        const pct = (dayChecks.successful / dayChecks.total) * 100;
        m.daily_status.push(pct >= 99 ? 'up' : pct >= 90 ? 'degraded' : 'down');
      } else {
        m.daily_status.push('none');
      }
    }
  });

  // Get recent incidents
  const incidents = db.prepare(`
    SELECT i.*, m.name as monitor_name
    FROM incidents i
    JOIN monitors m ON i.monitor_id = m.id
    WHERE m.user_id = ?
    ORDER BY i.started_at DESC
    LIMIT 20
  `).all(page.user_id);

  res.render('status-public', { page, monitors, incidents });
});

module.exports = router;
