const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const invoiceRoutes = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 3001;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'invoice-billing-secret-key',
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
app.use('/clients', requireAuth, clientRoutes);
app.use('/invoices', requireAuth, invoiceRoutes);

// Landing page
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  const userId = req.session.user.id;

  const totalRevenue = db.prepare(
    "SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE user_id = ? AND status = 'paid'"
  ).get(userId).total;

  const pendingAmount = db.prepare(
    "SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE user_id = ? AND status IN ('sent', 'overdue')"
  ).get(userId).total;

  const invoiceCount = db.prepare(
    'SELECT COUNT(*) as count FROM invoices WHERE user_id = ?'
  ).get(userId).count;

  const clientCount = db.prepare(
    'SELECT COUNT(*) as count FROM clients WHERE user_id = ?'
  ).get(userId).count;

  const recentInvoices = db.prepare(
    `SELECT invoices.*, clients.name as client_name
     FROM invoices
     JOIN clients ON invoices.client_id = clients.id
     WHERE invoices.user_id = ?
     ORDER BY invoices.created_at DESC
     LIMIT 10`
  ).all(userId);

  const overdueInvoices = db.prepare(
    `SELECT invoices.*, clients.name as client_name
     FROM invoices
     JOIN clients ON invoices.client_id = clients.id
     WHERE invoices.user_id = ? AND invoices.status = 'overdue'
     ORDER BY invoices.due_date ASC`
  ).all(userId);

  res.render('dashboard', {
    totalRevenue,
    pendingAmount,
    invoiceCount,
    clientCount,
    recentInvoices,
    overdueInvoices
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Invoice & Billing app running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
