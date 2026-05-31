const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const monitorRoutes = require('./routes/monitors');
const incidentRoutes = require('./routes/incidents');
const statusRoutes = require('./routes/status');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'status-page-generator-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/monitors', monitorRoutes);
app.use('/incidents', incidentRoutes);
app.use('/status', statusRoutes);

// Landing page
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  const monitors = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM checks WHERE monitor_id = m.id AND status_code >= 200 AND status_code < 400) as successful_checks,
      (SELECT COUNT(*) FROM checks WHERE monitor_id = m.id) as total_checks,
      (SELECT AVG(response_time_ms) FROM checks WHERE monitor_id = m.id AND checked_at >= datetime('now', '-24 hours')) as avg_response_time
    FROM monitors m
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `).all(req.session.user.id);

  const statusPages = db.prepare(
    'SELECT * FROM status_pages WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);

  // Calculate uptime percentage for each monitor
  monitors.forEach(m => {
    m.uptime_percent = m.total_checks > 0
      ? ((m.successful_checks / m.total_checks) * 100).toFixed(2)
      : 'N/A';
    m.avg_response_time = m.avg_response_time
      ? Math.round(m.avg_response_time)
      : 'N/A';
  });

  res.render('dashboard', { monitors, statusPages });
});

// Start server only if not in test mode
let server;
if (process.env.NODE_ENV !== 'test') {
  const { startWorker } = require('./lib/monitor-worker');
  server = app.listen(PORT, () => {
    console.log(`Status Page Generator running on http://localhost:${PORT}`);
    startWorker();
  });
}

module.exports = { app, db };
