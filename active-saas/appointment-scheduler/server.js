const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const availabilityRoutes = require('./routes/availability');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3004;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET not set. Using default secret. Set SESSION_SECRET environment variable in production.');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'appointment-scheduler-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
}

// Routes
app.use('/auth', authRoutes);
app.use('/services', requireAuth, serviceRoutes);
app.use('/availability', requireAuth, availabilityRoutes);
app.use('/book', bookingRoutes);

// Landing page
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  const userId = req.session.user.id;

  const totalAppointments = db.prepare(
    'SELECT COUNT(*) as count FROM appointments WHERE user_id = ?'
  ).get(userId).count;

  const upcomingAppointments = db.prepare(
    `SELECT appointments.*, services.name as service_name, services.duration_minutes
     FROM appointments
     JOIN services ON appointments.service_id = services.id
     WHERE appointments.user_id = ? AND appointments.date >= date('now') AND appointments.status = 'confirmed'
     ORDER BY appointments.date ASC, appointments.start_time ASC
     LIMIT 10`
  ).all(userId);

  const todayAppointments = db.prepare(
    `SELECT appointments.*, services.name as service_name, services.duration_minutes
     FROM appointments
     JOIN services ON appointments.service_id = services.id
     WHERE appointments.user_id = ? AND appointments.date = date('now') AND appointments.status = 'confirmed'
     ORDER BY appointments.start_time ASC`
  ).all(userId);

  const serviceCount = db.prepare(
    'SELECT COUNT(*) as count FROM services WHERE user_id = ?'
  ).get(userId).count;

  const completedCount = db.prepare(
    "SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND status = 'completed'"
  ).get(userId).count;

  const cancelledCount = db.prepare(
    "SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND status = 'cancelled'"
  ).get(userId).count;

  res.render('dashboard', {
    totalAppointments,
    upcomingAppointments,
    todayAppointments,
    serviceCount,
    completedCount,
    cancelledCount
  });
});

// Appointments management
app.get('/appointments', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const appointments = db.prepare(
    `SELECT appointments.*, services.name as service_name, services.duration_minutes
     FROM appointments
     JOIN services ON appointments.service_id = services.id
     WHERE appointments.user_id = ?
     ORDER BY appointments.date DESC, appointments.start_time DESC`
  ).all(userId);

  res.render('appointments', { appointments });
});

app.post('/appointments/:id/status', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.redirect('/appointments');
  }

  db.prepare(
    'UPDATE appointments SET status = ? WHERE id = ? AND user_id = ?'
  ).run(status, id, userId);

  res.redirect('/appointments');
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Appointment Scheduler running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
