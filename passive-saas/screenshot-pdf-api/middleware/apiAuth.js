const db = require('../db/database');

// Rate limit: max requests per hour per key
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// In-memory rate limit tracking
const rateLimitStore = new Map();

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required. Pass it via X-API-Key header or api_key query parameter.' });
  }

  const keyData = db.prepare(
    'SELECT * FROM api_keys WHERE key = ? AND active = 1'
  ).get(apiKey);

  if (!keyData) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }

  // Rate limiting
  const now = Date.now();
  const windowKey = `${keyData.id}`;

  if (!rateLimitStore.has(windowKey)) {
    rateLimitStore.set(windowKey, { count: 0, windowStart: now });
  }

  const rateData = rateLimitStore.get(windowKey);

  // Reset window if expired
  if (now - rateData.windowStart > RATE_WINDOW_MS) {
    rateData.count = 0;
    rateData.windowStart = now;
  }

  if (rateData.count >= RATE_LIMIT) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
      retryAfter: Math.ceil((rateData.windowStart + RATE_WINDOW_MS - now) / 1000)
    });
  }

  req.apiKeyData = keyData;
  next();
}

function trackUsage(req, res, next) {
  const keyData = req.apiKeyData;

  // Increment request count
  db.prepare('UPDATE api_keys SET requests_count = requests_count + 1 WHERE id = ?').run(keyData.id);

  // Update rate limit counter
  const windowKey = `${keyData.id}`;
  const rateData = rateLimitStore.get(windowKey);
  if (rateData) {
    rateData.count++;
  }

  next();
}

// Export for testing
function resetRateLimits() {
  rateLimitStore.clear();
}

module.exports = { authenticateApiKey, trackUsage, resetRateLimits, RATE_LIMIT };
