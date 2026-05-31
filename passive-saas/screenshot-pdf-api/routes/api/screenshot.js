const express = require('express');
const db = require('../../db/database');
const { authenticateApiKey, trackUsage } = require('../../middleware/apiAuth');

const router = express.Router();

// Generate a placeholder screenshot image (PNG)
function generateScreenshotBuffer(url, width, height) {
  // Create a minimal valid PNG representing the screenshot
  // This is a 1x1 pixel PNG that serves as a placeholder
  // In production, you would use puppeteer or a headless browser service
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    // IHDR chunk
    0x00, 0x00, 0x00, 0x0D, // length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, // bit depth: 8, color type: RGB
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x1E, 0x92, 0x6E, 0x05, // CRC
    // IDAT chunk
    0x00, 0x00, 0x00, 0x0C, // length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00,
    0x00, 0x02, 0x00, 0x01, // compressed data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, // length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  return pngHeader;
}

// POST /api/screenshot - Capture a screenshot
router.post('/', authenticateApiKey, trackUsage, (req, res) => {
  const { url, width, height, format } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const viewportWidth = parseInt(width) || 1280;
  const viewportHeight = parseInt(height) || 720;
  const outputFormat = format || 'png';

  if (!['png', 'jpeg', 'webp'].includes(outputFormat)) {
    return res.status(400).json({ error: 'Invalid format. Supported: png, jpeg, webp' });
  }

  try {
    const screenshotBuffer = generateScreenshotBuffer(url, viewportWidth, viewportHeight);

    // Record the request
    db.prepare(
      'INSERT INTO requests (user_id, api_key_id, type, input_url, status) VALUES (?, ?, ?, ?, ?)'
    ).run(req.apiKeyData.user_id, req.apiKeyData.id, 'screenshot', url, 'completed');

    const contentType = outputFormat === 'jpeg' ? 'image/jpeg' : outputFormat === 'webp' ? 'image/webp' : 'image/png';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="screenshot.${outputFormat}"`,
      'X-Screenshot-URL': url,
      'X-Viewport': `${viewportWidth}x${viewportHeight}`
    });

    res.send(screenshotBuffer);
  } catch (err) {
    // Record failure
    db.prepare(
      'INSERT INTO requests (user_id, api_key_id, type, input_url, status) VALUES (?, ?, ?, ?, ?)'
    ).run(req.apiKeyData.user_id, req.apiKeyData.id, 'screenshot', url, 'failed');

    res.status(500).json({ error: 'Screenshot capture failed' });
  }
});

module.exports = router;
