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

describe('Chatbot Builder App', () => {
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
      assert.ok(res.body.includes('Build Smart Chatbots'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Everything You Need to Build Chatbots'));
    });

    it('should include pricing section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Simple Pricing'));
    });

    it('should include demo section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('See It In Action'));
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
      const body = 'email=test@example.com&password=password123&name=Test+User';
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
      const body = 'email=test@example.com&password=password123&name=Test';
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
    });
  });

  describe('Chatbot CRUD', () => {
    it('should show chatbot list page', async () => {
      const res = await request('/chatbots');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('My Chatbots'));
    });

    it('should show new chatbot form', async () => {
      const res = await request('/chatbots/new');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Create'));
    });

    it('should create a chatbot', async () => {
      const body = 'name=Support+Bot&welcome_message=Hello!+How+can+I+help?&theme_color=%236366f1';
      const res = await request('/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/builder'));
    });

    it('should reject chatbot without name', async () => {
      const body = 'name=&welcome_message=Hi';
      const res = await request('/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Name is required'));
    });

    it('should show chatbot in list', async () => {
      const res = await request('/chatbots');
      assert.ok(res.body.includes('Support Bot'));
    });

    it('should show edit form', async () => {
      const res = await request('/chatbots/1/edit');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Support Bot'));
    });

    it('should update a chatbot', async () => {
      const body = 'name=Updated+Bot&welcome_message=Hey+there!&theme_color=%23ff0000';
      const res = await request('/chatbots/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
    });

    it('should show updated chatbot', async () => {
      const res = await request('/chatbots');
      assert.ok(res.body.includes('Updated Bot'));
    });

    it('should show builder page', async () => {
      const res = await request('/chatbots/1/builder');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Flow Builder'));
    });

    it('should show embed page', async () => {
      const res = await request('/chatbots/1/embed');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Embed Code'));
      assert.ok(res.body.includes('/widget/embed/1'));
    });

    it('should delete a chatbot', async () => {
      // Create another chatbot to delete
      const createBody = 'name=Delete+Me&welcome_message=Hi&theme_color=%23000000';
      await request('/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: createBody
      });

      const res = await request('/chatbots/2/delete', { method: 'POST' });
      assert.strictEqual(res.status, 302);

      const listRes = await request('/chatbots');
      assert.ok(!listRes.body.includes('Delete Me'));
    });
  });

  describe('Flow Builder API', () => {
    it('should create a flow', async () => {
      const body = JSON.stringify({
        trigger: 'hello, hi, hey',
        response: 'Hello! Welcome to our support.',
        position_x: 100,
        position_y: 50
      });
      const res = await request('/chatbots/1/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.trigger, 'hello, hi, hey');
      assert.strictEqual(data.response, 'Hello! Welcome to our support.');
    });

    it('should create another flow for chaining', async () => {
      const body = JSON.stringify({
        trigger: 'pricing, cost, price',
        response: 'Our plans start at $29/month.',
        next_flow_id: null,
        position_x: 100,
        position_y: 200
      });
      const res = await request('/chatbots/1/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 201);
    });

    it('should reject flow without trigger', async () => {
      const body = JSON.stringify({ trigger: '', response: 'test' });
      const res = await request('/chatbots/1/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 400);
    });

    it('should list flows', async () => {
      const res = await request('/chatbots/1/flows');
      assert.strictEqual(res.status, 200);
      const flows = JSON.parse(res.body);
      assert.ok(flows.length >= 2);
    });

    it('should update a flow', async () => {
      const body = JSON.stringify({
        trigger: 'hello, hi, hey, greetings',
        response: 'Updated: Hello there!',
        next_flow_id: 2,
        position_x: 150,
        position_y: 75
      });
      const res = await request('/chatbots/1/flows/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.response, 'Updated: Hello there!');
      assert.strictEqual(data.next_flow_id, 2);
    });

    it('should delete a flow', async () => {
      // Create a flow to delete
      const createBody = JSON.stringify({ trigger: 'delete me', response: 'temp', position_x: 0, position_y: 0 });
      const createRes = await request('/chatbots/1/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: createBody
      });
      const created = JSON.parse(createRes.body);

      const res = await request(`/chatbots/1/flows/${created.id}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);
    });
  });

  describe('Widget API', () => {
    it('should serve widget JS for valid chatbot', async () => {
      const res = await request('/widget/embed/1');
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('javascript'));
      assert.ok(res.body.includes('CHATBOT_CONFIG'));
      assert.ok(res.body.includes('cb-widget-container'));
    });

    it('should return 404 for invalid chatbot widget', async () => {
      const res = await request('/widget/embed/999');
      assert.strictEqual(res.status, 404);
    });

    it('should return chatbot info via API', async () => {
      const res = await request('/widget/api/1/info');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.id, 1);
      assert.ok(data.name);
      assert.ok(data.welcome_message);
      assert.ok(data.theme_color);
    });

    it('should return 404 for invalid chatbot info', async () => {
      const res = await request('/widget/api/999/info');
      assert.strictEqual(res.status, 404);
    });

    it('should handle message and return bot response', async () => {
      const body = JSON.stringify({ message: 'hello there', visitor_id: 'test_visitor_1' });
      const res = await request('/widget/api/1/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.response.includes('Hello'));
      assert.ok(data.conversation_id);
    });

    it('should match flow triggers correctly', async () => {
      const body = JSON.stringify({ message: 'what is your pricing?', visitor_id: 'test_visitor_2' });
      const res = await request('/widget/api/1/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.response.includes('$29'));
    });

    it('should chain flows when next_flow_id is set', async () => {
      const body = JSON.stringify({ message: 'hi', visitor_id: 'test_visitor_3' });
      const res = await request('/widget/api/1/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      // Flow 1 chains to flow 2, so response should include both
      assert.ok(data.response.includes('Hello'));
      assert.ok(data.response.includes('$29'));
    });

    it('should return welcome message for unknown triggers', async () => {
      const body = JSON.stringify({ message: 'xyzabc123', visitor_id: 'test_visitor_4' });
      const res = await request('/widget/api/1/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      // Should get the chatbot's welcome message as fallback
      assert.ok(data.response);
    });

    it('should require message and visitor_id', async () => {
      const body = JSON.stringify({ message: '', visitor_id: '' });
      const res = await request('/widget/api/1/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res.status, 400);
    });

    it('should store messages in database', async () => {
      const messages = db.prepare(
        `SELECT * FROM messages WHERE conversation_id IN
         (SELECT id FROM conversations WHERE chatbot_id = 1)`
      ).all();
      assert.ok(messages.length > 0);

      const visitorMsgs = messages.filter(m => m.role === 'visitor');
      const botMsgs = messages.filter(m => m.role === 'bot');
      assert.ok(visitorMsgs.length > 0);
      assert.ok(botMsgs.length > 0);
    });

    it('should retrieve conversation history', async () => {
      const res = await request('/widget/api/1/conversations/test_visitor_1');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.messages.length > 0);
      assert.strictEqual(data.messages[0].role, 'visitor');
    });

    it('should return empty history for unknown visitor', async () => {
      const res = await request('/widget/api/1/conversations/unknown_visitor');
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.messages.length, 0);
    });
  });

  describe('Dashboard stats', () => {
    it('should show chatbot stats on dashboard', async () => {
      const res = await request('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Total Chatbots'));
      assert.ok(res.body.includes('Total Flows'));
      assert.ok(res.body.includes('Conversations'));
      assert.ok(res.body.includes('Messages'));
    });
  });
});
