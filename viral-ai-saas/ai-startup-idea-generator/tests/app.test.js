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

describe('AI Startup Idea Generator', () => {
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
    it('should render the landing page with industry selector', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('industry-card'));
      assert.ok(res.body.includes('data-industry="AI"'));
      assert.ok(res.body.includes('data-industry="Blockchain"'));
      assert.ok(res.body.includes('data-industry="Fintech"'));
    });

    it('should include vibe toggle', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('vibe-btn'));
      assert.ok(res.body.includes('data-vibe="serious"'));
      assert.ok(res.body.includes('data-vibe="absurd"'));
      assert.ok(res.body.includes('data-vibe="moonshot"'));
    });

    it('should include example ideas', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Example Ideas'));
    });

    it('should have features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Why Use Startup Idea Generator'));
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
      assert.ok(res.body.includes('Your Startup Ideas'));
    });
  });

  describe('Idea generation', () => {
    it('should generate an idea with industry and vibe', async () => {
      sessionCookie = null;
      const res = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'AI', vibe: 'absurd' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.startupName);
      assert.ok(data.tagline);
      assert.ok(data.description);
      assert.ok(data.valuation);
      assert.ok(data.investorFeedback);
      assert.ok(data.teamRoles);
      assert.ok(data.marketSize);
      assert.ok(data.shareId);
      assert.strictEqual(data.industry, 'AI');
      assert.strictEqual(data.vibe, 'absurd');
    });

    it('should generate an idea without specifying industry', async () => {
      const res = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibe: 'serious' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.startupName);
      assert.ok(data.industry);
      assert.strictEqual(data.vibe, 'serious');
    });

    it('should reject missing vibe', async () => {
      const res = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'AI' })
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('Vibe'));
    });

    it('should reject invalid vibe', async () => {
      const res = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'AI', vibe: 'invalid' })
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('Invalid vibe'));
    });

    it('should produce different results for different vibes', async () => {
      const resSerious = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Blockchain', vibe: 'serious' })
      });
      const resAbsurd = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Blockchain', vibe: 'absurd' })
      });
      const resMoonshot = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Blockchain', vibe: 'moonshot' })
      });
      const seriousData = JSON.parse(resSerious.body);
      const absurdData = JSON.parse(resAbsurd.body);
      const moonshotData = JSON.parse(resMoonshot.body);
      assert.notStrictEqual(seriousData.tagline, absurdData.tagline);
      assert.notStrictEqual(absurdData.tagline, moonshotData.tagline);
    });

    it('should return 3 investor quotes', async () => {
      const res = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Fintech', vibe: 'moonshot' })
      });
      const data = JSON.parse(res.body);
      assert.strictEqual(data.investorFeedback.length, 3);
      data.investorFeedback.forEach(function(inv) {
        assert.ok(inv.name);
        assert.ok(inv.quote);
        assert.ok(inv.sentiment);
      });
    });

    it('should return 4 team roles', async () => {
      const res = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'IoT', vibe: 'absurd' })
      });
      const data = JSON.parse(res.body);
      assert.strictEqual(data.teamRoles.length, 4);
      data.teamRoles.forEach(function(member) {
        assert.ok(member.name);
        assert.ok(member.title);
      });
    });

    it('should return valuation in correct format', async () => {
      const res = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Healthtech', vibe: 'serious' })
      });
      const data = JSON.parse(res.body);
      assert.ok(/^\$[\d.]+[MB]$/.test(data.valuation));
    });

    it('should generate unique share IDs', async () => {
      const res1 = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'AI', vibe: 'absurd' })
      });
      const res2 = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'AI', vibe: 'absurd' })
      });
      const data1 = JSON.parse(res1.body);
      const data2 = JSON.parse(res2.body);
      assert.notStrictEqual(data1.shareId, data2.shareId);
    });

    it('should have valid absurdity and viability scores', async () => {
      const res = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Edtech', vibe: 'absurd' })
      });
      const data = JSON.parse(res.body);
      assert.ok(data.absurdityScore >= 1 && data.absurdityScore <= 10);
      assert.ok(data.viabilityScore >= 1 && data.viabilityScore <= 10);
    });
  });

  describe('Share page', () => {
    it('should display a shared idea without authentication', async () => {
      const genRes = await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Spacetech', vibe: 'moonshot' })
      });
      const genData = JSON.parse(genRes.body);

      sessionCookie = null;
      const res = await request('/idea/' + genData.shareId);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Startup Idea Card'));
      assert.ok(res.body.includes(genData.startupName));
    });

    it('should return 404 for non-existent share ID', async () => {
      const res = await request('/idea/nonexistent123');
      assert.strictEqual(res.status, 404);
    });
  });

  describe('Idea history', () => {
    it('should show ideas in dashboard for authenticated user', async () => {
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      await request('/idea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Biotech', vibe: 'absurd' })
      });

      const res = await request('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Biotech'));
    });
  });
});
