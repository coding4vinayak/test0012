const express = require('express');
const db = require('../db/database');
const { buildContent, generatePNG, generateSVG, generateDataURL } = require('../lib/generator');

const router = express.Router();

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Create a QR code
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { type, content, foreground_color, background_color, size, ...extra } = req.body;

    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    const validTypes = ['url', 'text', 'vcard', 'wifi'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid QR code type' });
    }

    const qrContent = buildContent(type, { content, ...extra });
    const fgColor = foreground_color || '#000000';
    const bgColor = background_color || '#ffffff';
    const qrSize = parseInt(size) || 300;

    const result = db.prepare(
      `INSERT INTO qr_codes (user_id, content, type, foreground_color, background_color, size)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.session.user.id, qrContent, type, fgColor, bgColor, qrSize);

    const qrCode = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, qrcode: qrCode });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create QR code' });
  }
});

// List user's QR codes
router.get('/', requireAuth, (req, res) => {
  const qrcodes = db.prepare(
    'SELECT * FROM qr_codes WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);
  res.json(qrcodes);
});

// Download QR code as PNG
router.get('/:id/download/png', requireAuth, async (req, res) => {
  const qrCode = db.prepare(
    'SELECT * FROM qr_codes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!qrCode) {
    return res.status(404).json({ error: 'QR code not found' });
  }

  try {
    const buffer = await generatePNG(qrCode.content, {
      size: qrCode.size,
      foreground_color: qrCode.foreground_color,
      background_color: qrCode.background_color
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qrcode-${qrCode.id}.png"`
    });
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PNG' });
  }
});

// Download QR code as SVG
router.get('/:id/download/svg', requireAuth, async (req, res) => {
  const qrCode = db.prepare(
    'SELECT * FROM qr_codes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!qrCode) {
    return res.status(404).json({ error: 'QR code not found' });
  }

  try {
    const svg = await generateSVG(qrCode.content, {
      size: qrCode.size,
      foreground_color: qrCode.foreground_color,
      background_color: qrCode.background_color
    });

    res.set({
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="qrcode-${qrCode.id}.svg"`
    });
    res.send(svg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate SVG' });
  }
});

// Preview QR code (data URL)
router.post('/preview', async (req, res) => {
  try {
    const { type, content, foreground_color, background_color, size, ...extra } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const qrContent = buildContent(type || 'text', { content, ...extra });
    const dataUrl = await generateDataURL(qrContent, {
      size: parseInt(size) || 200,
      foreground_color: foreground_color || '#000000',
      background_color: background_color || '#ffffff'
    });

    res.json({ success: true, dataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// Delete a QR code
router.delete('/:id', requireAuth, (req, res) => {
  const qrCode = db.prepare(
    'SELECT * FROM qr_codes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!qrCode) {
    return res.status(404).json({ error: 'QR code not found' });
  }

  db.prepare('DELETE FROM scans WHERE qr_code_id = ?').run(qrCode.id);
  db.prepare('DELETE FROM qr_codes WHERE id = ?').run(qrCode.id);

  res.json({ success: true });
});

module.exports = router;
