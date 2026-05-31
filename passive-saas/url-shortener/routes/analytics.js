const express = require('express');
const db = require('../db/database');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/auth/login');
  }
  next();
}

// Analytics detail page for a link
router.get('/:id', requireAuth, (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(
    req.params.id, req.session.user.id
  );

  if (!link) {
    return res.status(404).send('Link not found');
  }

  res.render('analytics', { link });
});

// API: Get click data for a link
router.get('/:id/clicks', requireAuth, (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(
    req.params.id, req.session.user.id
  );

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const clicks = db.prepare(
    'SELECT * FROM clicks WHERE link_id = ? ORDER BY created_at DESC LIMIT 100'
  ).all(link.id);

  res.json(clicks);
});

// API: Time series data (clicks per day)
router.get('/:id/timeseries', requireAuth, (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(
    req.params.id, req.session.user.id
  );

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const timeseries = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM clicks
    WHERE link_id = ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(link.id);

  res.json(timeseries);
});

// API: Top referrers
router.get('/:id/referrers', requireAuth, (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(
    req.params.id, req.session.user.id
  );

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const referrers = db.prepare(`
    SELECT referrer, COUNT(*) as count
    FROM clicks
    WHERE link_id = ? AND referrer IS NOT NULL
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT 10
  `).all(link.id);

  res.json(referrers);
});

// API: Device breakdown (based on user agent)
router.get('/:id/devices', requireAuth, (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(
    req.params.id, req.session.user.id
  );

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const clicks = db.prepare('SELECT user_agent FROM clicks WHERE link_id = ?').all(link.id);

  const devices = { desktop: 0, mobile: 0, tablet: 0, other: 0 };

  clicks.forEach(click => {
    const ua = (click.user_agent || '').toLowerCase();
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      if (ua.includes('tablet') || ua.includes('ipad')) {
        devices.tablet++;
      } else {
        devices.mobile++;
      }
    } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox')) {
      devices.desktop++;
    } else {
      devices.other++;
    }
  });

  res.json(devices);
});

module.exports = router;
