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

describe('AI Excuse Generator', () => {
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
    it('should render the landing page with situation input', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('situation-input'));
    });

    it('should include category selection cards', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('category-card'));
      assert.ok(res.body.includes('data-category="work"'));
      assert.ok(res.body.includes('data-category="social"'));
      assert.ok(res.body.includes('data-category="family"'));
      assert.ok(res.body.includes('data-category="school"'));
      assert.ok(res.body.includes('data-category="fitness"'));
    });

    it('should include example excuses', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Example Excuses'));
    });

    it('should have features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Why Use AI Excuse Generator'));
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
      assert.ok(res.body.includes('Your Excuse History'));
    });
  });

  describe('Excuse generation', () => {
    it('should generate an excuse for a valid input', async () => {
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const res = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'I need to skip the meeting', category: 'work' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.excuse);
      assert.ok(data.deliveryTips);
      assert.ok(data.riskLevel);
      assert.ok(data.believabilityScore >= 1 && data.believabilityScore <= 10);
      assert.ok(data.creativityScore >= 1 && data.creativityScore <= 10);
      assert.ok(data.shareId);
      assert.strictEqual(data.category, 'work');
    });

    it('should generate an excuse without authentication', async () => {
      sessionCookie = null;
      const res = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'Cannot make it to dinner', category: 'social' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.shareId);
      assert.ok(data.excuse);
      assert.strictEqual(data.category, 'social');
    });

    it('should reject missing situation', async () => {
      const res = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'work' })
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('Situation'));
    });

    it('should reject missing category', async () => {
      const res = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'I need an excuse' })
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('Category'));
    });

    it('should reject invalid category', async () => {
      const res = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'I need an excuse', category: 'invalid' })
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('Invalid category'));
    });

    it('should generate different excuses for different categories', async () => {
      const resWork = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'same situation text here', category: 'work' })
      });
      const resFamily = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'same situation text here', category: 'family' })
      });
      const workData = JSON.parse(resWork.body);
      const familyData = JSON.parse(resFamily.body);
      assert.notStrictEqual(workData.excuse, familyData.excuse);
    });

    it('should generate unique share IDs for each excuse', async () => {
      const res1 = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'first situation', category: 'work' })
      });
      const res2 = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'second situation', category: 'social' })
      });
      const data1 = JSON.parse(res1.body);
      const data2 = JSON.parse(res2.body);
      assert.notStrictEqual(data1.shareId, data2.shareId);
    });
  });

  describe('Share page', () => {
    it('should display a shared excuse without authentication', async () => {
      const genRes = await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'Need to skip gym today', category: 'fitness' })
      });
      const genData = JSON.parse(genRes.body);

      sessionCookie = null;
      const res = await request('/excuse/' + genData.shareId);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Excuse Card'));
      assert.ok(res.body.includes('fitness'));
    });

    it('should return 404 for non-existent share ID', async () => {
      const res = await request('/excuse/nonexistent123');
      assert.strictEqual(res.status, 404);
    });
  });

  describe('Excuse history', () => {
    it('should show excuses in dashboard for authenticated user', async () => {
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      await request('/excuse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: 'Late to work again', category: 'work' })
      });

      const res = await request('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Late to work again'));
    });
  });
});
