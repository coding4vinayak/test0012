const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const qrcodesRoutes = require('./routes/qrcodes');
const trackRoutes = require('./routes/track');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

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
  secret: process.env.SESSION_SECRET || 'qr-code-generator-secret-key',
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
app.use('/qrcodes', qrcodesRoutes);
app.use('/track', trackRoutes);
app.use('/analytics', analyticsRoutes);

// Landing page
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  const qrcodes = db.prepare(
    'SELECT * FROM qr_codes WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);
  res.render('dashboard', { qrcodes });
});

// Generator page
app.get('/generate', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('generate');
});

// Start server only if not in test mode
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`QR Code Generator running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
