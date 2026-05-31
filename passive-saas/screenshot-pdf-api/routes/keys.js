const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Generate API key
function generateApiKey() {
  return 'sk_' + crypto.randomBytes(24).toString('hex');
}

// Create a new API key
router.post('/create', requireAuth, (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'API key name is required' });
  }

  const key = generateApiKey();
  const result = db.prepare(
    'INSERT INTO api_keys (user_id, key, name) VALUES (?, ?, ?)'
  ).run(req.session.user.id, key, name.trim());

  res.status(201).json({
    success: true,
    apiKey: {
      id: result.lastInsertRowid,
      key,
      name: name.trim(),
      requests_count: 0,
      created_at: new Date().toISOString()
    }
  });
});

// Revoke an API key
router.post('/:id/revoke', requireAuth, (req, res) => {
  const { id } = req.params;

  const apiKey = db.prepare(
    'SELECT * FROM api_keys WHERE id = ? AND user_id = ?'
  ).get(id, req.session.user.id);

  if (!apiKey) {
    return res.status(404).json({ error: 'API key not found' });
  }

  db.prepare('UPDATE api_keys SET active = 0 WHERE id = ?').run(id);

  res.json({ success: true, message: 'API key revoked' });
});

// List API keys
router.get('/', requireAuth, (req, res) => {
  const keys = db.prepare(
    'SELECT id, name, key, requests_count, active, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);

  res.json(keys);
});

module.exports = router;
