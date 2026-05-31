const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// Create a short link
router.post('/create', requireAuth, (req, res) => {
  const { url, title, custom_code } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  let shortCode = custom_code || generateShortCode();

  // Check if custom code is already taken
  if (custom_code) {
    const existing = db.prepare('SELECT id FROM links WHERE short_code = ?').get(custom_code);
    if (existing) {
      return res.status(409).json({ error: 'Custom alias already taken' });
    }
  } else {
    // Generate unique code
    let attempts = 0;
    while (attempts < 10) {
      const existing = db.prepare('SELECT id FROM links WHERE short_code = ?').get(shortCode);
      if (!existing) break;
      shortCode = generateShortCode();
      attempts++;
    }
  }

  try {
    const result = db.prepare(
      'INSERT INTO links (user_id, short_code, original_url, title) VALUES (?, ?, ?, ?)'
    ).run(req.session.user.id, shortCode, url, title || null);

    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, link });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create short link' });
  }
});

// List user's links
router.get('/', requireAuth, (req, res) => {
  const links = db.prepare(
    'SELECT * FROM links WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);
  res.json(links);
});

// Delete a link
router.delete('/:id', requireAuth, (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(
    req.params.id, req.session.user.id
  );

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  db.prepare('DELETE FROM clicks WHERE link_id = ?').run(link.id);
  db.prepare('DELETE FROM links WHERE id = ?').run(link.id);

  res.json({ success: true });
});

module.exports = router;
