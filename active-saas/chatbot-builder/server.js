const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbots');
const widgetRoutes = require('./routes/widget');

const app = express();
const PORT = process.env.PORT || 3002;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'chatbot-builder-secret-key',
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
app.use('/chatbots', requireAuth, chatbotRoutes);
app.use('/widget', widgetRoutes);

// Landing page
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  const userId = req.session.user.id;

  const chatbots = db.prepare(
    'SELECT * FROM chatbots WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);

  const stats = chatbots.map(bot => {
    const flowCount = db.prepare(
      'SELECT COUNT(*) as count FROM flows WHERE chatbot_id = ?'
    ).get(bot.id).count;

    const conversationCount = db.prepare(
      'SELECT COUNT(*) as count FROM conversations WHERE chatbot_id = ?'
    ).get(bot.id).count;

    const messageCount = db.prepare(
      `SELECT COUNT(*) as count FROM messages
       WHERE conversation_id IN (SELECT id FROM conversations WHERE chatbot_id = ?)`
    ).get(bot.id).count;

    return { ...bot, flowCount, conversationCount, messageCount };
  });

  res.render('dashboard', { chatbots: stats });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Chatbot Builder running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
