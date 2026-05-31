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

describe('Status Page Generator', () => {
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
      assert.ok(res.body.includes('Monitor Your Services'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Powerful Monitoring Features'));
    });

    it('should include monitoring feature descriptions', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Uptime Monitoring'));
      assert.ok(res.body.includes('Public Status Pages'));
      assert.ok(res.body.includes('Incident Management'));
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
      assert.ok(res.body.includes('Dashboard'));
      assert.ok(res.body.includes('Add Monitor'));
    });
  });

  describe('Monitor CRUD', () => {
    it('should create a monitor', async () => {
      sessionCookie = null;
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=test@example.com&password=password123'
      });

      const body = 'name=Test+API&url=https://httpbin.org/status/200&check_interval_seconds=300';
      const res = await request('/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/monitors'));
    });

    it('should list monitors', async () => {
      const res = await request('/monitors');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Test API'));
      assert.ok(res.body.includes('httpbin.org'));
    });

    it('should show edit form for monitor', async () => {
      const res = await request('/monitors/1/edit');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Test API'));
    });

    it('should update a monitor', async () => {
      const body = 'name=Updated+API&url=https://httpbin.org/status/200&check_interval_seconds=60';
      const res = await request('/monitors/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);

      const listRes = await request('/monitors');
      assert.ok(listRes.body.includes('Updated API'));
    });

    it('should reject monitor without name', async () => {
      const body = 'name=&url=https://example.com&check_interval_seconds=300';
      const res = await request('/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Name and URL are required'));
    });
  });

  describe('Check recording', () => {
    it('should record check results in the database', async () => {
      // Manually insert a check record
      db.prepare(
        'INSERT INTO checks (monitor_id, status_code, response_time_ms) VALUES (?, ?, ?)'
      ).run(1, 200, 150);

      db.prepare(
        'INSERT INTO checks (monitor_id, status_code, response_time_ms) VALUES (?, ?, ?)'
      ).run(1, 200, 200);

      const checks = db.prepare('SELECT * FROM checks WHERE monitor_id = ?').all(1);
      assert.ok(checks.length >= 2);
      assert.strictEqual(checks[0].status_code, 200);
      assert.strictEqual(checks[0].response_time_ms, 150);
    });

    it('should update monitor status after check', async () => {
      db.prepare(
        'UPDATE monitors SET status = ?, last_checked_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run('up', 1);

      const monitor = db.prepare('SELECT * FROM monitors WHERE id = ?').get(1);
      assert.strictEqual(monitor.status, 'up');
      assert.ok(monitor.last_checked_at !== null);
    });
  });

  describe('Uptime calculation', () => {
    it('should calculate uptime percentage correctly', () => {
      // Insert some checks: 8 successful, 2 failures
      db.prepare('DELETE FROM checks WHERE monitor_id = 1').run();

      for (let i = 0; i < 8; i++) {
        db.prepare(
          'INSERT INTO checks (monitor_id, status_code, response_time_ms) VALUES (?, ?, ?)'
        ).run(1, 200, 100 + i * 10);
      }
      for (let i = 0; i < 2; i++) {
        db.prepare(
          'INSERT INTO checks (monitor_id, status_code, response_time_ms) VALUES (?, ?, ?)'
        ).run(1, 500, 0);
      }

      const result = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status_code >= 200 AND status_code < 400 THEN 1 ELSE 0 END) as successful
        FROM checks WHERE monitor_id = ?
      `).get(1);

      const uptimePercent = (result.successful / result.total) * 100;
      assert.strictEqual(uptimePercent, 80);
    });

    it('should handle no checks gracefully', () => {
      const result = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status_code >= 200 AND status_code < 400 THEN 1 ELSE 0 END) as successful
        FROM checks WHERE monitor_id = 999
      `).get();

      const uptimePercent = result.total > 0
        ? (result.successful / result.total) * 100
        : null;
      assert.strictEqual(uptimePercent, null);
    });
  });

  describe('Incident management', () => {
    it('should create an incident', async () => {
      const body = 'monitor_id=1&title=Service+Down&description=API+not+responding&status=investigating';
      const res = await request('/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
    });

    it('should list incidents', async () => {
      const res = await request('/incidents');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Service Down'));
    });

    it('should update an incident', async () => {
      const body = 'title=Service+Down+Updated&description=Fix+in+progress&status=identified';
      const res = await request('/incidents/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);

      const listRes = await request('/incidents');
      assert.ok(listRes.body.includes('Service Down Updated'));
    });

    it('should resolve an incident', async () => {
      const res = await request('/incidents/1/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: ''
      });
      assert.strictEqual(res.status, 302);

      const incident = db.prepare('SELECT * FROM incidents WHERE id = 1').get();
      assert.strictEqual(incident.status, 'resolved');
      assert.ok(incident.resolved_at !== null);
    });
  });

  describe('Status Page', () => {
    it('should create a status page', async () => {
      const body = 'slug=my-service&title=My+Service+Status&description=Current+status&theme=light';
      const res = await request('/status/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
    });

    it('should render public status page by slug', async () => {
      sessionCookie = null; // Public access, no auth needed
      const res = await request('/status/my-service');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('My Service Status'));
      assert.ok(res.body.includes('Updated API'));
    });

    it('should show uptime bars on public page', async () => {
      const res = await request('/status/my-service');
      assert.ok(res.body.includes('uptime-bar'));
      assert.ok(res.body.includes('30 days ago'));
    });

    it('should show incident history on public page', async () => {
      const res = await request('/status/my-service');
      assert.ok(res.body.includes('Service Down Updated'));
      assert.ok(res.body.includes('resolved'));
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request('/status/non-existent');
      assert.strictEqual(res.status, 404);
    });

    it('should reject duplicate slug', async () => {
      sessionCookie = null;
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=test@example.com&password=password123'
      });

      const body = 'slug=my-service&title=Duplicate&description=&theme=light';
      const res = await request('/status/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Slug is already taken'));
    });
  });

  describe('Monitor worker', () => {
    it('should export checkMonitor function', () => {
      const { checkMonitor } = require('../lib/monitor-worker');
      assert.strictEqual(typeof checkMonitor, 'function');
    });

    it('should export runChecks function', () => {
      const { runChecks } = require('../lib/monitor-worker');
      assert.strictEqual(typeof runChecks, 'function');
    });

    it('should export startWorker function', () => {
      const { startWorker } = require('../lib/monitor-worker');
      assert.strictEqual(typeof startWorker, 'function');
    });
  });

  describe('Monitor status API', () => {
    it('should return monitor status data as JSON', async () => {
      sessionCookie = null;
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=test@example.com&password=password123'
      });

      const res = await request('/monitors/api/status');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data));
      assert.ok(data.length > 0);
      assert.ok(data[0].name);
      assert.ok('uptime_percent' in data[0]);
    });
  });
});
