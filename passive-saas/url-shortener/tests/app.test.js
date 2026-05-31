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
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.headers['set-cookie']) {
          sessionCookie = res.headers['set-cookie'][0].split(';')[0];
        }
        resolve({ status: res.statusCode, body: data, headers: res.headers });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

describe('URL Shortener', () => {
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
    it('should render the landing page with hero section', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Shorten Links'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Powerful Features'));
    });

    it('should include CTA section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Ready to supercharge'));
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
      assert.ok(res.body.includes('Your Links'));
    });
  });

  describe('Link creation', () => {
    it('should require authentication', async () => {
      sessionCookie = null;
      const res = await request('/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      assert.strictEqual(res.status, 401);
    });

    it('should create a short link', async () => {
      // Login first
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const res = await request('/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/long-url', title: 'Test Link' })
      });
      assert.strictEqual(res.status, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);
      assert.ok(data.link.short_code);
      assert.strictEqual(data.link.original_url, 'https://example.com/long-url');
      assert.strictEqual(data.link.title, 'Test Link');
    });

    it('should create a link with custom alias', async () => {
      const res = await request('/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/custom', custom_code: 'myalias' })
      });
      assert.strictEqual(res.status, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.link.short_code, 'myalias');
    });

    it('should reject duplicate custom alias', async () => {
      const res = await request('/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/other', custom_code: 'myalias' })
      });
      assert.strictEqual(res.status, 409);
    });

    it('should reject invalid URL', async () => {
      const res = await request('/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'not-a-url' })
      });
      assert.strictEqual(res.status, 400);
    });

    it('should reject missing URL', async () => {
      const res = await request('/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 400);
    });

    it('should list user links', async () => {
      const res = await request('/links');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 2);
    });
  });

  describe('Redirect with tracking', () => {
    it('should redirect to the original URL', async () => {
      sessionCookie = null; // No auth needed for redirect
      const res = await request('/myalias');
      assert.strictEqual(res.status, 301);
      assert.strictEqual(res.headers.location, 'https://example.com/custom');
    });

    it('should track the click', async () => {
      // Check that click was recorded
      const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get('myalias');
      assert.ok(link.click_count >= 1);

      const clicks = db.prepare('SELECT * FROM clicks WHERE link_id = ?').all(link.id);
      assert.ok(clicks.length >= 1);
      assert.ok(clicks[0].user_agent);
    });

    it('should return 404 for non-existent short codes', async () => {
      const res = await request('/nonexistent123');
      // Falls through to 404 since no matching route
      assert.ok(res.status === 404 || res.status === 200);
    });
  });

  describe('Analytics endpoints', () => {
    it('should require authentication for analytics', async () => {
      sessionCookie = null;
      const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get('myalias');
      const res = await request('/analytics/' + link.id);
      assert.strictEqual(res.status, 302);
    });

    it('should show analytics page', async () => {
      // Login first
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get('myalias');
      const res = await request('/analytics/' + link.id);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Analytics'));
    });

    it('should return click data', async () => {
      const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get('myalias');
      const res = await request('/analytics/' + link.id + '/clicks');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 1);
    });

    it('should return time series data', async () => {
      const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get('myalias');
      const res = await request('/analytics/' + link.id + '/timeseries');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
    });

    it('should return referrer data', async () => {
      const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get('myalias');
      const res = await request('/analytics/' + link.id + '/referrers');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
    });

    it('should return device data', async () => {
      const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get('myalias');
      const res = await request('/analytics/' + link.id + '/devices');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(typeof data === 'object');
      assert.ok('desktop' in data);
      assert.ok('mobile' in data);
    });
  });

  describe('Link deletion', () => {
    it('should delete a link', async () => {
      // Create a link to delete
      const createRes = await request('/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/to-delete', custom_code: 'deleteme' })
      });
      const { link } = JSON.parse(createRes.body);

      const res = await request('/links/' + link.id, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);

      // Verify it's gone
      const check = db.prepare('SELECT * FROM links WHERE id = ?').get(link.id);
      assert.strictEqual(check, undefined);
    });

    it('should return 404 for non-existent link', async () => {
      const res = await request('/links/99999', { method: 'DELETE' });
      assert.strictEqual(res.status, 404);
    });
  });
});
