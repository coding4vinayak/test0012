const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../../db/database');
const { authenticateApiKey, trackUsage } = require('../../middleware/apiAuth');

const router = express.Router();

// POST /api/pdf - Generate a PDF from HTML or URL
router.post('/', authenticateApiKey, trackUsage, (req, res) => {
  const { html, url, title, pageSize, orientation } = req.body;

  if (!html && !url) {
    return res.status(400).json({ error: 'Either html or url is required' });
  }

  if (url) {
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
  }

  const size = pageSize || 'A4';
  const layout = orientation === 'landscape' ? 'landscape' : 'portrait';

  if (!['A4', 'A3', 'Letter', 'Legal'].includes(size)) {
    return res.status(400).json({ error: 'Invalid page size. Supported: A4, A3, Letter, Legal' });
  }

  try {
    const doc = new PDFDocument({ size, layout });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Record the request
      db.prepare(
        'INSERT INTO requests (user_id, api_key_id, type, input_url, input_html, status) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(req.apiKeyData.user_id, req.apiKeyData.id, 'pdf', url || null, html ? 'provided' : null, 'completed');

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${title || 'document'}.pdf"`,
        'Content-Length': pdfBuffer.length
      });

      res.send(pdfBuffer);
    });

    // Generate PDF content
    if (title) {
      doc.fontSize(24).text(title, { align: 'center' });
      doc.moveDown();
    }

    if (html) {
      // Strip HTML tags for plain text PDF rendering
      const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      doc.fontSize(12).text(plainText, {
        align: 'left',
        lineGap: 4
      });
    } else if (url) {
      doc.fontSize(14).text(`Content captured from: ${url}`, { align: 'left' });
      doc.moveDown();
      doc.fontSize(12).text('This PDF was generated from the provided URL using the Screenshot/PDF API.', {
        align: 'left',
        lineGap: 4
      });
    }

    doc.end();
  } catch (err) {
    // Record failure
    db.prepare(
      'INSERT INTO requests (user_id, api_key_id, type, input_url, status) VALUES (?, ?, ?, ?, ?)'
    ).run(req.apiKeyData.user_id, req.apiKeyData.id, 'pdf', url || null, 'failed');

    res.status(500).json({ error: 'PDF generation failed' });
  }
});

module.exports = router;
