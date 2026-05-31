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

const sampleResume = `John Doe
Senior Software Engineer

Summary:
Passionate and results-driven software engineer with 8+ years of experience leveraging cutting-edge technologies to deliver innovative solutions. A dynamic team player and self-starter who thrives in fast-paced environments.

Experience:
Senior Software Engineer at TechCorp (2020-Present)
- Responsible for managing a team of developers
- Worked on synergizing cross-functional stakeholder engagement
- Leveraged innovative paradigms to drive ecosystem growth
- Proactively ideated scalable solutions

Software Engineer at StartupXYZ (2017-2020)
- Built microservices architecture serving 1M+ users
- Reduced deployment time by 60% through CI/CD pipeline improvements
- Increased test coverage from 45% to 92%
- Led migration from monolith to microservices

Skills:
JavaScript, Python, React, Node.js, AWS, Docker, Kubernetes, PostgreSQL, MongoDB, Redis, GraphQL, REST APIs, Agile, Scrum

Education:
BS Computer Science, State University (2016)
Dean's List, GPA 3.8`;

const shortResume = `John Doe - Engineer. I do stuff.`;

describe('AI Roast My Resume', () => {
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
    it('should render the landing page with resume text input', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Brutally Roasted'));
      assert.ok(res.body.includes('resume-input'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('What You Get'));
    });

    it('should have a roast form', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('roast-form'));
      assert.ok(res.body.includes('resumeText'));
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
      assert.ok(res.body.includes('Your Roast History'));
    });
  });

  describe('Resume roast generation', () => {
    it('should generate a roast for valid resume text', async () => {
      sessionCookie = null;
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume })
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.impactScore >= 1 && data.impactScore <= 10);
      assert.ok(data.clarityScore >= 1 && data.clarityScore <= 10);
      assert.ok(data.buzzwordScore >= 1 && data.buzzwordScore <= 10);
      assert.ok(data.cringeScore >= 1 && data.cringeScore <= 10);
      assert.ok(data.overallScore >= 1 && data.overallScore <= 10);
      assert.ok(data.shareId);
      assert.ok(data.letterGrade);
    });

    it('should reject empty resume text', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: '' })
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('required'));
    });

    it('should reject missing resume text', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('required'));
    });

    it('should warn about short resume text', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: shortResume })
      });
      assert.strictEqual(res.status, 400);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes('too short'));
    });

    it('should return scores in range 1-10', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume })
      });
      const data = JSON.parse(res.body);
      assert.ok(data.impactScore >= 1 && data.impactScore <= 10, `Impact score ${data.impactScore} out of range`);
      assert.ok(data.clarityScore >= 1 && data.clarityScore <= 10, `Clarity score ${data.clarityScore} out of range`);
      assert.ok(data.buzzwordScore >= 1 && data.buzzwordScore <= 10, `Buzzword score ${data.buzzwordScore} out of range`);
      assert.ok(data.cringeScore >= 1 && data.cringeScore <= 10, `Cringe score ${data.cringeScore} out of range`);
      assert.ok(data.overallScore >= 1 && data.overallScore <= 10, `Overall score ${data.overallScore} out of range`);
    });

    it('should include section-by-section feedback', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume })
      });
      const data = JSON.parse(res.body);
      assert.ok(data.roast.sections.experience.roast);
      assert.ok(data.roast.sections.skills.roast);
      assert.ok(data.roast.sections.education.roast);
      assert.ok(data.roast.sections.summary.roast);
    });

    it('should include recommendations', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume })
      });
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data.recommendations));
      assert.ok(data.recommendations.length >= 3);
    });

    it('should detect buzzwords', async () => {
      const res = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume })
      });
      const data = JSON.parse(res.body);
      // The sample resume has many buzzwords, so buzzwordScore should be low
      assert.ok(data.buzzwordScore <= 7, `Expected low buzzword score for buzzword-heavy resume, got ${data.buzzwordScore}`);
      assert.ok(data.roast.buzzwordBingo.length > 0);
    });

    it('should generate unique share IDs for each roast', async () => {
      const res1 = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume })
      });
      const res2 = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume + ' extra text' })
      });
      const data1 = JSON.parse(res1.body);
      const data2 = JSON.parse(res2.body);
      assert.notStrictEqual(data1.shareId, data2.shareId);
    });
  });

  describe('Share page', () => {
    it('should display a shared roast without authentication', async () => {
      // Generate a roast first
      const genRes = await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume })
      });
      const genData = JSON.parse(genRes.body);

      // Access share page without session
      sessionCookie = null;
      const res = await request('/roast/' + genData.shareId);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Roast Card'));
      assert.ok(res.body.includes('Impact'));
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

      // Generate a roast while authenticated
      await request('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: sampleResume })
      });

      const res = await request('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('John Doe'));
    });
  });
});
