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

// Analytics page for a QR code
router.get('/:id', requireAuth, (req, res) => {
  const qrCode = db.prepare(
    'SELECT * FROM qr_codes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!qrCode) {
    return res.status(404).send('QR code not found');
  }

  const scans = db.prepare(
    'SELECT * FROM scans WHERE qr_code_id = ? ORDER BY scanned_at DESC LIMIT 50'
  ).all(qrCode.id);

  res.render('analytics', { qrCode, scans });
});

// Get scan data as JSON
router.get('/:id/scans', requireAuth, (req, res) => {
  const qrCode = db.prepare(
    'SELECT * FROM qr_codes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!qrCode) {
    return res.status(404).json({ error: 'QR code not found' });
  }

  const scans = db.prepare(
    'SELECT * FROM scans WHERE qr_code_id = ? ORDER BY scanned_at DESC'
  ).all(qrCode.id);

  res.json(scans);
});

// Get scan time series data
router.get('/:id/timeseries', requireAuth, (req, res) => {
  const qrCode = db.prepare(
    'SELECT * FROM qr_codes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!qrCode) {
    return res.status(404).json({ error: 'QR code not found' });
  }

  const timeseries = db.prepare(
    `SELECT DATE(scanned_at) as date, COUNT(*) as count
     FROM scans WHERE qr_code_id = ?
     GROUP BY DATE(scanned_at)
     ORDER BY date DESC LIMIT 30`
  ).all(qrCode.id);

  res.json(timeseries);
});

module.exports = router;
