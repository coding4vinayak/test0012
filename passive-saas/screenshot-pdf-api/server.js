const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const keysRoutes = require('./routes/keys');
const screenshotApiRoutes = require('./routes/api/screenshot');
const pdfApiRoutes = require('./routes/api/pdf');

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
  secret: process.env.SESSION_SECRET || 'screenshot-pdf-api-secret-key',
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
app.use('/keys', keysRoutes);
app.use('/api/screenshot', screenshotApiRoutes);
app.use('/api/pdf', pdfApiRoutes);

// Landing page
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  const apiKeys = db.prepare(
    'SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);
  const recentRequests = db.prepare(
    'SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(req.session.user.id);
  const totalRequests = db.prepare(
    'SELECT COUNT(*) as count FROM requests WHERE user_id = ?'
  ).get(req.session.user.id).count;
  res.render('dashboard', { apiKeys, recentRequests, totalRequests });
});

// API Playground
app.get('/playground', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  const apiKeys = db.prepare(
    'SELECT * FROM api_keys WHERE user_id = ? AND active = 1 ORDER BY created_at DESC'
  ).all(req.session.user.id);
  res.render('playground', { apiKeys });
});

// Start server only if not in test mode
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Screenshot/PDF API running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
