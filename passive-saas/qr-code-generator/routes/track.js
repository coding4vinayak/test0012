const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Track a scan and redirect to content
router.get('/:id', (req, res) => {
  const qrCode = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);

  if (!qrCode) {
    return res.status(404).send('QR code not found');
  }

  // Record the scan
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  db.prepare(
    'INSERT INTO scans (qr_code_id, ip_address, user_agent) VALUES (?, ?, ?)'
  ).run(qrCode.id, ipAddress, userAgent);

  // Increment scan count
  db.prepare('UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = ?').run(qrCode.id);

  // Redirect based on type
  if (qrCode.type === 'url') {
    const url = qrCode.content.startsWith('http') ? qrCode.content : 'http://' + qrCode.content;
    return res.redirect(301, url);
  }

  // For non-URL types, show the content
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>QR Code Content</title></head>
    <body>
      <h1>QR Code Content</h1>
      <pre>${qrCode.content}</pre>
    </body>
    </html>
  `);
});

module.exports = router;
