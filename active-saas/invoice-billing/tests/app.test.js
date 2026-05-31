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

describe('Invoice & Billing App', () => {
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
      assert.ok(res.body.includes('Professional Invoicing Made Simple'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Everything You Need to Get Paid'));
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
      const body = 'email=test@example.com&password=password123&business_name=Test+Biz';
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

    it('should logout successfully', async () => {
      // Login first
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const res = await request('/auth/logout');
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/'));
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
      assert.ok(res.body.includes('Total Revenue'));
    });
  });

  describe('Client management', () => {
    it('should redirect unauthenticated users', async () => {
      sessionCookie = null;
      const res = await request('/clients');
      assert.strictEqual(res.status, 302);
    });

    it('should show clients list for authenticated user', async () => {
      sessionCookie = null;
      const loginBody = 'email=test@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const res = await request('/clients');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Clients'));
    });

    it('should create a new client', async () => {
      const body = 'name=John+Doe&email=john@example.com&address=123+Main+St&phone=555-0100';
      const res = await request('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/clients'));
    });

    it('should show created client in list', async () => {
      const res = await request('/clients');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('John Doe'));
      assert.ok(res.body.includes('john@example.com'));
    });

    it('should reject client without required fields', async () => {
      const body = 'name=&email=';
      const res = await request('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Name and email are required'));
    });

    it('should show edit form', async () => {
      const res = await request('/clients/1/edit');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('John Doe'));
    });

    it('should update a client', async () => {
      const body = 'name=John+Updated&email=john.updated@example.com&address=456+Oak+Ave&phone=555-0200';
      const res = await request('/clients/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
    });

    it('should show updated client', async () => {
      const res = await request('/clients');
      assert.ok(res.body.includes('John Updated'));
    });
  });

  describe('Invoice creation', () => {
    it('should show invoice form', async () => {
      const res = await request('/invoices/new');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Create Invoice'));
    });

    it('should create an invoice with line items', async () => {
      const body = 'client_id=1&due_date=2025-12-31&notes=Thank+you&items%5Bdescription%5D%5B%5D=Web+Design&items%5Bquantity%5D%5B%5D=10&items%5Brate%5D%5B%5D=100&items%5Bdescription%5D%5B%5D=Hosting&items%5Bquantity%5D%5B%5D=1&items%5Brate%5D%5B%5D=50';
      const res = await request('/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/invoices/'));
    });

    it('should view invoice detail', async () => {
      const res = await request('/invoices/1');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('INV-0001'));
      assert.ok(res.body.includes('Web Design'));
      assert.ok(res.body.includes('1050.00'));
    });

    it('should calculate total correctly', async () => {
      const invoice = db.prepare('SELECT * FROM invoices WHERE id = 1').get();
      // 10 * 100 + 1 * 50 = 1050
      assert.strictEqual(invoice.total, 1050);
    });

    it('should list invoices', async () => {
      const res = await request('/invoices');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('INV-0001'));
    });

    it('should update invoice status', async () => {
      const body = 'status=sent';
      const res = await request('/invoices/1/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);

      const invoice = db.prepare('SELECT * FROM invoices WHERE id = 1').get();
      assert.strictEqual(invoice.status, 'sent');
    });

    it('should mark invoice as paid', async () => {
      const body = 'status=paid';
      const res = await request('/invoices/1/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);

      const invoice = db.prepare('SELECT * FROM invoices WHERE id = 1').get();
      assert.strictEqual(invoice.status, 'paid');
    });

    it('should reject invalid status', async () => {
      const body = 'status=invalid';
      const res = await request('/invoices/1/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);

      const invoice = db.prepare('SELECT * FROM invoices WHERE id = 1').get();
      assert.strictEqual(invoice.status, 'paid'); // unchanged
    });

    it('should generate PDF', async () => {
      const res = await request('/invoices/1/pdf');
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('application/pdf'));
    });
  });

  describe('Invoice with missing data', () => {
    it('should reject invoice without client', async () => {
      const body = 'client_id=&due_date=2025-12-31';
      const res = await request('/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Client and due date are required'));
    });
  });
});
