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

describe('Appointment Scheduler App', () => {
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
      assert.ok(res.body.includes('Smart Scheduling for Service Businesses'));
    });

    it('should include features section', async () => {
      const res = await request('/');
      assert.ok(res.body.includes('Everything You Need to Manage Appointments'));
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
      const body = 'email=provider@example.com&password=password123&business_name=Test+Salon';
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
      const body = 'email=provider@example.com&password=password123&business_name=Test+Salon';
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
      const body = 'email=provider@example.com&password=password123';
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
      const body = 'email=provider@example.com&password=wrongpassword';
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
      const loginBody = 'email=provider@example.com&password=password123';
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
      const loginBody = 'email=provider@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });

      const res = await request('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Dashboard'));
      assert.ok(res.body.includes('Total Appointments'));
    });
  });

  describe('Services CRUD', () => {
    before(async () => {
      sessionCookie = null;
      const loginBody = 'email=provider@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });
    });

    it('should show services list', async () => {
      const res = await request('/services');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Services'));
    });

    it('should show new service form', async () => {
      const res = await request('/services/new');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('New Service'));
    });

    it('should create a new service', async () => {
      const body = 'name=Haircut&duration_minutes=30&price=25&description=Basic+haircut';
      const res = await request('/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes('/services'));
    });

    it('should show created service in list', async () => {
      const res = await request('/services');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Haircut'));
      assert.ok(res.body.includes('30 min'));
      assert.ok(res.body.includes('$25.00'));
    });

    it('should reject service without required fields', async () => {
      const body = 'name=&duration_minutes=';
      const res = await request('/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Name and duration are required'));
    });

    it('should show edit form for existing service', async () => {
      const res = await request('/services/1/edit');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Haircut'));
    });

    it('should update a service', async () => {
      const body = 'name=Premium+Haircut&duration_minutes=45&price=35&description=Premium+styling';
      const res = await request('/services/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
    });

    it('should show updated service', async () => {
      const res = await request('/services');
      assert.ok(res.body.includes('Premium Haircut'));
      assert.ok(res.body.includes('45 min'));
    });

    it('should create a second service for booking tests', async () => {
      const body = 'name=Massage&duration_minutes=60&price=80&description=Relaxing+massage';
      const res = await request('/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);
    });

    it('should delete a service', async () => {
      // Create a service to delete
      const body = 'name=ToDelete&duration_minutes=15&price=10&description=Temp';
      await request('/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      const res = await request('/services/3/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      assert.strictEqual(res.status, 302);

      const listRes = await request('/services');
      assert.ok(!listRes.body.includes('ToDelete'));
    });
  });

  describe('Availability', () => {
    before(async () => {
      sessionCookie = null;
      const loginBody = 'email=provider@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });
    });

    it('should show availability page', async () => {
      const res = await request('/availability');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Weekly Availability'));
    });

    it('should add availability for Monday', async () => {
      const body = 'day_of_week=1&start_time=09:00&end_time=17:00';
      const res = await request('/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Availability added successfully'));
      assert.ok(res.body.includes('Monday'));
    });

    it('should add availability for Tuesday', async () => {
      const body = 'day_of_week=2&start_time=10:00&end_time=16:00';
      const res = await request('/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Tuesday'));
    });

    it('should reject availability with invalid times', async () => {
      const body = 'day_of_week=3&start_time=17:00&end_time=09:00';
      const res = await request('/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Start time must be before end time'));
    });

    it('should reject availability with missing fields', async () => {
      const body = 'day_of_week=3&start_time=&end_time=';
      const res = await request('/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('All fields are required'));
    });

    it('should delete an availability slot', async () => {
      // Add a slot to delete
      const addBody = 'day_of_week=5&start_time=08:00&end_time=12:00';
      await request('/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: addBody
      });

      const res = await request('/availability/3/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      assert.strictEqual(res.status, 302);
    });
  });

  describe('Booking flow', () => {
    it('should show public booking page', async () => {
      sessionCookie = null;
      const res = await request('/book/1');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Book an Appointment'));
      assert.ok(res.body.includes('Test Salon'));
      assert.ok(res.body.includes('Premium Haircut'));
    });

    it('should return 404 for non-existent provider', async () => {
      const res = await request('/book/999');
      assert.strictEqual(res.status, 404);
    });

    it('should return available time slots', async () => {
      // Find the next Monday
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const res = await request(`/book/1/slots?service_id=1&date=${dateStr}`);
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.ok(Array.isArray(data.slots));
      assert.ok(data.slots.length > 0);
      // Service is 45 min, availability is 09:00-17:00, so first slot should be 09:00
      assert.strictEqual(data.slots[0].start_time, '09:00');
      assert.strictEqual(data.slots[0].end_time, '09:45');
    });

    it('should return empty slots for unavailable day', async () => {
      // Find the next Sunday (day 0) - no availability set for Sunday
      const today = new Date();
      const daysUntilSunday = (0 - today.getDay() + 7) % 7 || 7;
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + daysUntilSunday);
      const dateStr = nextSunday.toISOString().split('T')[0];

      const res = await request(`/book/1/slots?service_id=1&date=${dateStr}`);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.slots.length, 0);
    });

    it('should create a booking', async () => {
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const body = `service_id=1&date=${dateStr}&start_time=09:00&end_time=09:45&customer_name=Jane+Doe&customer_email=jane@example.com`;
      const res = await request('/book/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Appointment booked successfully'));
    });

    it('should prevent double-booking the same slot', async () => {
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const body = `service_id=1&date=${dateStr}&start_time=09:00&end_time=09:45&customer_name=John+Smith&customer_email=john@example.com`;
      const res = await request('/book/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('no longer available'));
    });

    it('should prevent overlapping bookings', async () => {
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      // Try to book 09:15-10:00 which overlaps with 09:00-09:45
      const body = `service_id=1&date=${dateStr}&start_time=09:15&end_time=10:00&customer_name=Bob&customer_email=bob@example.com`;
      const res = await request('/book/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('no longer available'));
    });

    it('should not show booked slot in available slots', async () => {
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const res = await request(`/book/1/slots?service_id=1&date=${dateStr}`);
      const data = JSON.parse(res.body);
      const bookedSlot = data.slots.find(s => s.start_time === '09:00');
      assert.strictEqual(bookedSlot, undefined);
    });

    it('should allow booking a different time slot', async () => {
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const body = `service_id=1&date=${dateStr}&start_time=10:30&end_time=11:15&customer_name=Alice&customer_email=alice@example.com`;
      const res = await request('/book/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Appointment booked successfully'));
    });

    it('should reject booking with missing fields', async () => {
      const body = 'service_id=1&date=&start_time=&end_time=&customer_name=&customer_email=';
      const res = await request('/book/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('All fields are required'));
    });

    it('should reject booking outside availability hours', async () => {
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const body = `service_id=1&date=${dateStr}&start_time=07:00&end_time=07:45&customer_name=Eve&customer_email=eve@example.com`;
      const res = await request('/book/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('outside of available hours'));
    });
  });

  describe('Appointment status management', () => {
    before(async () => {
      sessionCookie = null;
      const loginBody = 'email=provider@example.com&password=password123';
      await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody
      });
    });

    it('should show appointments list', async () => {
      const res = await request('/appointments');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('All Appointments'));
      assert.ok(res.body.includes('Jane Doe'));
    });

    it('should mark appointment as completed', async () => {
      const body = 'status=completed';
      const res = await request('/appointments/1/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);

      const apt = db.prepare('SELECT * FROM appointments WHERE id = 1').get();
      assert.strictEqual(apt.status, 'completed');
    });

    it('should mark appointment as cancelled', async () => {
      const body = 'status=cancelled';
      const res = await request('/appointments/2/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);

      const apt = db.prepare('SELECT * FROM appointments WHERE id = 2').get();
      assert.strictEqual(apt.status, 'cancelled');
    });

    it('should reject invalid status', async () => {
      const body = 'status=invalid';
      const res = await request('/appointments/1/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 302);

      const apt = db.prepare('SELECT * FROM appointments WHERE id = 1').get();
      assert.strictEqual(apt.status, 'completed'); // unchanged
    });

    it('should allow booking cancelled slot', async () => {
      // The slot for appointment 2 was 10:30-11:15 and is now cancelled
      // This should free up the slot
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      sessionCookie = null; // Public booking
      const body = `service_id=1&date=${dateStr}&start_time=10:30&end_time=11:15&customer_name=Rebooker&customer_email=rebooker@example.com`;
      const res = await request('/book/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('Appointment booked successfully'));
    });
  });
});
