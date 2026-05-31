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

describe('AI Content Generator', () => {
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
      assert.ok(res.body.includes('Generate Amazing Content with AI'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Powerful Features'));
    });

    it('should include pricing section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Simple Pricing'));
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
      // Should redirect to dashboard after successful registration
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/dashboard'));
    });

    it('should reject duplicate registration', async () => {
      sessionCookie = null; // Clear session
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
      sessionCookie = null; // Clear session
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
      // Login first
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const res = await request('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Content Generator'));
    });
  });

  describe('Content generation', () => {
    it('should require authentication', async () => {
      sessionCookie = null;
      const res = await request('/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'blog', prompt: 'Test' })
      });
      assert.strictEqual(res.status, 401);
    });

    it('should generate blog post content', async () => {
      // Login first
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const res = await request('/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'blog', prompt: 'Artificial Intelligence' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.type, 'blog');
      assert.ok(data.result.length > 100);
      assert.ok(data.result.includes('Artificial Intelligence'));
    });

    it('should generate social media content', async () => {
      const res = await request('/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'social', prompt: 'Productivity Tips' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.type, 'social');
      assert.ok(data.result.length > 50);
    });

    it('should generate email content', async () => {
      const res = await request('/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', prompt: 'Project Update' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.type, 'email');
      assert.ok(data.result.includes('Subject:'));
    });

    it('should reject invalid content type', async () => {
      const res = await request('/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invalid', prompt: 'Test' })
      });
      assert.strictEqual(res.status, 400);
    });

    it('should reject missing prompt', async () => {
      const res = await request('/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'blog' })
      });
      assert.strictEqual(res.status, 400);
    });

    it('should save generated content to database', async () => {
      const res = await request('/content/history', {
        headers: { 'Content-Type': 'application/json' }
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 3); // We generated 3 pieces of content above
    });
  });
});
