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

describe('AI Personality from Tweets', () => {
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
    it('should render the landing page with handle input', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('handle-input'));
      assert.ok(res.body.includes('TweetPersonality'));
    });

    it('should include example personality cards', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Example Personality Cards'));
      assert.ok(res.body.includes('Hot Take Artist'));
    });

    it('should include testimonials section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('What People Are Saying'));
    });

    it('should include analyze form', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('analyze-form'));
      assert.ok(res.body.includes('Analyze Me'));
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
      assert.ok(res.body.includes('Your Analysis History'));
    });
  });

  describe('Personality generation', () => {
    it('should generate a personality for a valid handle', async () => {
      sessionCookie = null;
      const res = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'elonmusk' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.archetype);
      assert.ok(data.archetype.name);
      assert.ok(data.archetype.emoji);
      assert.ok(data.traits);
      assert.strictEqual(data.traits.length, 5);
      assert.ok(data.writingStyle);
      assert.ok(data.vibeSummary);
      assert.ok(data.interests);
      assert.ok(data.scores);
      assert.ok(data.shareId);
    });

    it('should handle @ prefix in handle', async () => {
      const res = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: '@testuser' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.handle, 'testuser');
    });

    it('should reject missing handle', async () => {
      const res = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('Twitter handle is required'));
    });

    it('should reject empty handle', async () => {
      const res = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: '   ' })
      });
      assert.strictEqual(res.status, 400);
    });

    it('should produce consistent results for the same handle (deterministic)', async () => {
      const res1 = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'consistency_test' })
      });
      const res2 = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'consistency_test' })
      });
      const data1 = JSON.parse(res1.body);
      const data2 = JSON.parse(res2.body);
      assert.strictEqual(data1.archetype.name, data2.archetype.name);
      assert.strictEqual(data1.traits[0].name, data2.traits[0].name);
      assert.strictEqual(data1.traits[0].percentage, data2.traits[0].percentage);
      assert.strictEqual(data1.writingStyle, data2.writingStyle);
      assert.strictEqual(data1.vibeSummary, data2.vibeSummary);
      assert.strictEqual(data1.scores.humor, data2.scores.humor);
      assert.strictEqual(data1.scores.intelligence, data2.scores.intelligence);
      assert.strictEqual(data1.scores.toxicity, data2.scores.toxicity);
    });

    it('should return scores in valid ranges', async () => {
      const res = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'score_test_user' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.scores.humor >= 1 && data.scores.humor <= 100);
      assert.ok(data.scores.intelligence >= 1 && data.scores.intelligence <= 100);
      assert.ok(data.scores.toxicity >= 1 && data.scores.toxicity <= 100);
    });

    it('should return trait percentages in valid ranges', async () => {
      const res = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'trait_test' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      data.traits.forEach(trait => {
        assert.ok(trait.percentage >= 50 && trait.percentage <= 99,
          `Trait ${trait.name} has percentage ${trait.percentage} outside 50-99 range`);
      });
    });

    it('should generate unique share IDs', async () => {
      const res1 = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'user_one' })
      });
      const res2 = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'user_two' })
      });
      const data1 = JSON.parse(res1.body);
      const data2 = JSON.parse(res2.body);
      assert.notStrictEqual(data1.shareId, data2.shareId);
    });
  });

  describe('Share page', () => {
    it('should display a shared personality card without authentication', async () => {
      const genRes = await request('/analyze/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'share_test_user' })
      });
      const genData = JSON.parse(genRes.body);

      sessionCookie = null;
      const res = await request('/analyze/' + genData.shareId);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('share_test_user'));
      assert.ok(res.body.includes('Personality Traits'));
      assert.ok(res.body.includes('Vibe Check'));
    });

    it('should return 404 for non-existent share ID', async () => {
      const res = await request('/analyze/nonexistent123abc');
      assert.strictEqual(res.status, 404);
    });
  });
});
