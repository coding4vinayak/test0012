const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const roastRoutes = require('./routes/roast');

const app = express();
const PORT = process.env.PORT || 3040;

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
  secret: process.env.SESSION_SECRET || 'ai-roast-my-website-secret-key',
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
app.use('/roast', roastRoutes);

// Landing page
app.get('/', (req, res) => {
  res.render('index', { error: null });
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  const roasts = db.prepare(
    'SELECT * FROM roasts WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);
  res.render('dashboard', { roasts });
});

// Start server only if not in test mode
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`AI Roast My Website running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
