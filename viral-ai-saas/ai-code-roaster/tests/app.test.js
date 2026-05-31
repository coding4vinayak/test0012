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

describe('AI Code Roaster', () => {
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
    it('should render the landing page with code input', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Brutally Roasted'));
    });

    it('should include language selector', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('language-select'));
      assert.ok(res.body.includes('JavaScript'));
      assert.ok(res.body.includes('Python'));
    });

    it('should include code textarea', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('code-input'));
      assert.ok(res.body.includes('roast-form'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('What You Get'));
    });

    it('should include example roasts', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Hall of Shame'));
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
      assert.ok(res.body.includes('Your Roast History'));
    });
  });

  describe('Code roast generation', () => {
    it('should generate a roast for valid code input', async () => {
      sessionCookie = null;
      const code = 'function hello() {\n  var x = 1;\n  var y = 2;\n  return x + y;\n}';
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.readabilityScore >= 1 && data.readabilityScore <= 10);
      assert.ok(data.efficiencyScore >= 1 && data.efficiencyScore <= 10);
      assert.ok(data.styleScore >= 1 && data.styleScore <= 10);
      assert.ok(data.overallScore >= 1 && data.overallScore <= 10);
      assert.ok(data.shareId);
      assert.ok(data.roast.variableNaming);
      assert.ok(data.roast.architecture);
      assert.ok(data.roast.comments);
      assert.ok(data.roast.verdict);
    });

    it('should reject missing code', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'python' })
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('Code snippet is required'));
    });

    it('should reject empty code', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '   ', language: 'python' })
      });
      assert.strictEqual(res.status, 400);
    });

    it('should generate roast for different languages', async () => {
      const code = 'def hello():\n    x = 1\n    return x';
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'python' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.language, 'python');
      assert.ok(data.roast.scores);
      assert.ok(data.roast.grades);
    });

    it('should default language to javascript when not specified', async () => {
      const code = 'let x = 1;';
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.language, 'javascript');
    });

    it('should return scores in 1-10 range', async () => {
      const code = 'for(let i=0;i<100;i++){for(let j=0;j<100;j++){for(let k=0;k<100;k++){console.log(i,j,k)}}}';
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.readabilityScore >= 1 && data.readabilityScore <= 10);
      assert.ok(data.efficiencyScore >= 1 && data.efficiencyScore <= 10);
      assert.ok(data.styleScore >= 1 && data.styleScore <= 10);
      assert.ok(data.overallScore >= 1 && data.overallScore <= 10);
    });

    it('should return letter grades A-F', async () => {
      const code = 'function test() { return 42; }';
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      const validGrades = ['A', 'B', 'C', 'D', 'F'];
      assert.ok(validGrades.includes(data.roast.grades.readability));
      assert.ok(validGrades.includes(data.roast.grades.efficiency));
      assert.ok(validGrades.includes(data.roast.grades.style));
      assert.ok(validGrades.includes(data.roast.grades.overall));
    });

    it('should include categorized roast commentary', async () => {
      const code = 'var a = 1; var b = 2; var c = a + b;';
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.roast.variableNaming.comment.length > 0);
      assert.ok(data.roast.variableNaming.grade);
      assert.ok(data.roast.architecture.comment.length > 0);
      assert.ok(data.roast.architecture.grade);
      assert.ok(data.roast.comments.comment.length > 0);
      assert.ok(data.roast.comments.grade);
      assert.ok(data.roast.verdict.length > 0);
    });

    it('should generate unique share IDs', async () => {
      const res1 = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'let a = 1;', language: 'javascript' })
      });
      const res2 = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'let b = 2;', language: 'javascript' })
      });
      const data1 = JSON.parse(res1.body);
      const data2 = JSON.parse(res2.body);
      assert.notStrictEqual(data1.shareId, data2.shareId);
    });
  });

  describe('Share page', () => {
    it('should display a shared roast without authentication', async () => {
      const code = '// This is shareable test code\nfunction test() { return true; }';
      const genRes = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' })
      });
      const genData = JSON.parse(genRes.body);

      sessionCookie = null;
      const res = await request('/roast/' + genData.shareId);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Report Card'));
      assert.ok(res.body.includes('javascript'));
    });

    it('should return 404 for non-existent share ID', async () => {
      const res = await request('/roast/nonexistent123');
      assert.strictEqual(res.status, 404);
    });
  });

  describe('Roast history', () => {
    it('should show roasts in dashboard for authenticated user', async () => {
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const code = '// history test\nconst historyVar = "test";';
      await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript' })
      });

      const res = await request('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('history test'));
    });
  });
});
