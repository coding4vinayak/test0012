const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const { app, db } = require('../server');

let server;
let baseUrl;
let sessionCookie;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (sessionCookie) {
      opts.headers['Cookie'] = sessionCookie;
    }

    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', chunk => { chunks.push(chunk); });
      res.on('end', () => {
        if (res.headers['set-cookie']) {
          sessionCookie = res.headers['set-cookie'][0].split(';')[0];
        }
        const body = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          body: body.toString(),
          rawBody: body,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

describe('QR Code Generator', () => {
  before((_, done) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  describe('Server startup', () => {
    it('should start and respond to requests', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
    });

    it('should serve static files', async () => {
      const res = await request('/css/style.css');
      assert.strictEqual(res.status, 200);
    });
  });

  describe('Landing page', () => {
    it('should render the landing page', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Generate QR Codes'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Powerful Features'));
    });

    it('should include live preview section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Try It Now'));
    });

    it('should include CTA section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Ready to Create QR Codes'));
    });
  });

  describe('Auth routes', () => {
    it('should show registration page', async () => {
      const res = await request('/auth/register');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Create Account'));
    });

    it('should show login page', async () => {
      const res = await request('/auth/login');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Welcome Back'));
    });

    it('should register a new user', async () => {
      sessionCookie = null;
      const body = 'email=test@example.com&password=password123';
      const res = await request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/dashboard'));
    });

    it('should reject duplicate registration', async () => {
      sessionCookie = null;
      const body = 'email=test@example.com&password=password123';
      const res = await request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Email already registered'));
    });

    it('should login with valid credentials', async () => {
      sessionCookie = null;
      const body = 'email=test@example.com&password=password123';
      const res = await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/dashboard'));
    });

    it('should reject invalid credentials', async () => {
      sessionCookie = null;
      const body = 'email=test@example.com&password=wrongpassword';
      const res = await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Invalid email or password'));
    });
  });

  describe('Dashboard', () => {
    it('should redirect unauthenticated users to login', async () => {
      sessionCookie = null;
      const res = await request('/dashboard');
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/auth/login'));
    });

    it('should show dashboard for authenticated users', async () => {
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const res = await request('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Your QR Codes'));
    });
  });

  describe('QR Code Generation', () => {
    it('should require authentication for creating QR codes', async () => {
      sessionCookie = null;
      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', content: 'https://example.com' })
      });
      assert.strictEqual(res.status, 401);
    });

    it('should create a URL QR code', async () => {
      sessionCookie = null;
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=test@example.com&password=password123'
      });

      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', content: 'https://example.com' })
      });
      assert.strictEqual(res.status, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);
      assert.ok(data.qrcode.id);
      assert.strictEqual(data.qrcode.type, 'url');
    });

    it('should create a text QR code', async () => {
      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', content: 'Hello World' })
      });
      assert.strictEqual(res.status, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.qrcode.type, 'text');
    });

    it('should create a WiFi QR code', async () => {
      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'wifi', content: 'MyNetwork' })
      });
      assert.strictEqual(res.status, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.qrcode.type, 'wifi');
    });

    it('should create a vCard QR code', async () => {
      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'vcard', content: 'John Doe' })
      });
      assert.strictEqual(res.status, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.qrcode.type, 'vcard');
    });

    it('should support custom colors', async () => {
      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          content: 'https://colored.example.com',
          foreground_color: '#ff0000',
          background_color: '#00ff00',
          size: 400
        })
      });
      assert.strictEqual(res.status, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.qrcode.foreground_color, '#ff0000');
      assert.strictEqual(data.qrcode.background_color, '#00ff00');
      assert.strictEqual(data.qrcode.size, 400);
    });

    it('should reject missing type', async () => {
      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' })
      });
      assert.strictEqual(res.status, 400);
    });

    it('should reject missing content', async () => {
      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url' })
      });
      assert.strictEqual(res.status, 400);
    });

    it('should reject invalid type', async () => {
      const res = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invalid', content: 'test' })
      });
      assert.strictEqual(res.status, 400);
    });

    it('should list user QR codes', async () => {
      const res = await request('/qrcodes');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 4);
    });
  });

  describe('QR Code Download', () => {
    it('should download QR code as PNG', async () => {
      const qr = db.prepare('SELECT * FROM qr_codes LIMIT 1').get();
      const res = await request(`/qrcodes/${qr.id}/download/png`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('image/png'));
      assert.ok(res.headers['content-disposition'].includes('.png'));
    });

    it('should download QR code as SVG', async () => {
      const qr = db.prepare('SELECT * FROM qr_codes LIMIT 1').get();
      const res = await request(`/qrcodes/${qr.id}/download/svg`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('image/svg+xml'));
      assert.ok(res.body.includes('<svg'));
    });

    it('should return 404 for non-existent QR code download', async () => {
      const res = await request('/qrcodes/99999/download/png');
      assert.strictEqual(res.status, 404);
    });
  });

  describe('QR Code Preview', () => {
    it('should generate a preview without authentication', async () => {
      sessionCookie = null;
      const res = await request('/qrcodes/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', content: 'https://example.com' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);
      assert.ok(data.dataUrl.startsWith('data:image/png;base64,'));
    });

    it('should support custom colors in preview', async () => {
      const res = await request('/qrcodes/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          content: 'Hello',
          foreground_color: '#ff0000',
          background_color: '#0000ff'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);
    });

    it('should reject empty content in preview', async () => {
      const res = await request('/qrcodes/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', content: '' })
      });
      assert.strictEqual(res.status, 400);
    });
  });

  describe('Scan Tracking', () => {
    it('should track a scan and redirect for URL type', async () => {
      sessionCookie = null;
      const qr = db.prepare("SELECT * FROM qr_codes WHERE type = 'url' LIMIT 1").get();
      const res = await request(`/track/${qr.id}`);
      assert.strictEqual(res.status, 301);
      assert.ok(res.headers.location.includes('example.com'));
    });

    it('should increment scan count', async () => {
      const qr = db.prepare("SELECT * FROM qr_codes WHERE type = 'url' LIMIT 1").get();
      assert.ok(qr.scan_count >= 1);
    });

    it('should record scan metadata', async () => {
      const qr = db.prepare("SELECT * FROM qr_codes WHERE type = 'url' LIMIT 1").get();
      const scans = db.prepare('SELECT * FROM scans WHERE qr_code_id = ?').all(qr.id);
      assert.ok(scans.length >= 1);
      assert.ok(scans[0].user_agent);
      assert.ok(scans[0].scanned_at);
    });

    it('should show content for non-URL types', async () => {
      const qr = db.prepare("SELECT * FROM qr_codes WHERE type = 'text' LIMIT 1").get();
      const res = await request(`/track/${qr.id}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('QR Code Content'));
    });

    it('should return 404 for non-existent QR code', async () => {
      const res = await request('/track/99999');
      assert.strictEqual(res.status, 404);
    });
  });

  describe('Analytics', () => {
    it('should require authentication for analytics', async () => {
      sessionCookie = null;
      const qr = db.prepare('SELECT * FROM qr_codes LIMIT 1').get();
      const res = await request(`/analytics/${qr.id}`);
      assert.strictEqual(res.status, 302);
    });

    it('should show analytics page', async () => {
      sessionCookie = null;
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=test@example.com&password=password123'
      });

      const qr = db.prepare('SELECT * FROM qr_codes LIMIT 1').get();
      const res = await request(`/analytics/${qr.id}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Scan Analytics'));
    });

    it('should return scan data as JSON', async () => {
      const qr = db.prepare('SELECT * FROM qr_codes LIMIT 1').get();
      const res = await request(`/analytics/${qr.id}/scans`);
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
    });

    it('should return timeseries data', async () => {
      const qr = db.prepare('SELECT * FROM qr_codes LIMIT 1').get();
      const res = await request(`/analytics/${qr.id}/timeseries`);
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
    });

    it('should return 404 for QR code not owned by user', async () => {
      // Create another user and QR code
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('pass2', 10);
      const user2 = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run('other@example.com', hash);
      db.prepare('INSERT INTO qr_codes (user_id, content, type) VALUES (?, ?, ?)').run(user2.lastInsertRowid, 'test', 'text');
      const otherQr = db.prepare('SELECT * FROM qr_codes WHERE user_id = ?').get(user2.lastInsertRowid);

      const res = await request(`/analytics/${otherQr.id}`);
      assert.strictEqual(res.status, 404);
    });
  });

  describe('QR Code Deletion', () => {
    it('should delete a QR code', async () => {
      // Create a QR code to delete
      const createRes = await request('/qrcodes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', content: 'Delete me' })
      });
      const { qrcode } = JSON.parse(createRes.body);

      const res = await request(`/qrcodes/${qrcode.id}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);

      // Verify it is gone
      const check = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(qrcode.id);
      assert.strictEqual(check, undefined);
    });

    it('should return 404 for non-existent QR code', async () => {
      const res = await request('/qrcodes/99999', { method: 'DELETE' });
      assert.strictEqual(res.status, 404);
    });
  });
});
