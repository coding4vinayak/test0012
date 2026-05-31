const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Handle short link redirect
router.get('/:code', (req, res, next) => {
  const { code } = req.params;

  // Skip if it looks like a static file or known route
  if (code.includes('.') || ['auth', 'links', 'analytics', 'dashboard'].includes(code)) {
    return next();
  }

  const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get(code);

  if (!link) {
    return next();
  }

  // Log click data
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const referrer = req.headers['referer'] || req.headers['referrer'] || null;

  try {
    db.prepare(
      'INSERT INTO clicks (link_id, ip_address, user_agent, referrer, country) VALUES (?, ?, ?, ?, ?)'
    ).run(link.id, ipAddress, userAgent, referrer, null);

    // Increment click count
    db.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?').run(link.id);
  } catch (err) {
    // Don't block redirect if tracking fails
    console.error('Click tracking error:', err);
  }

  res.redirect(301, link.original_url);
});

module.exports = router;
