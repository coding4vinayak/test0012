const express = require('express');
const db = require('../db/database');

const router = express.Router();

// List all chatbots for user
router.get('/', (req, res) => {
  const chatbots = db.prepare(
    'SELECT * FROM chatbots WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);
  res.render('chatbots/index', { chatbots });
});

// New chatbot form
router.get('/new', (req, res) => {
  res.render('chatbots/form', { chatbot: null, error: null });
});

// Create chatbot
router.post('/', (req, res) => {
  const { name, welcome_message, theme_color } = req.body;

  if (!name) {
    return res.render('chatbots/form', { chatbot: null, error: 'Name is required' });
  }

  const result = db.prepare(
    'INSERT INTO chatbots (user_id, name, welcome_message, theme_color) VALUES (?, ?, ?, ?)'
  ).run(
    req.session.user.id,
    name,
    welcome_message || 'Hello! How can I help you today?',
    theme_color || '#6366f1'
  );

  res.redirect(`/chatbots/${result.lastInsertRowid}/builder`);
});

// Edit chatbot form
router.get('/:id/edit', (req, res) => {
  const chatbot = db.prepare(
    'SELECT * FROM chatbots WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!chatbot) {
    return res.redirect('/chatbots');
  }

  res.render('chatbots/form', { chatbot, error: null });
});

// Update chatbot
router.post('/:id', (req, res) => {
  const { name, welcome_message, theme_color } = req.body;

  if (!name) {
    const chatbot = db.prepare('SELECT * FROM chatbots WHERE id = ?').get(req.params.id);
    return res.render('chatbots/form', { chatbot, error: 'Name is required' });
  }

  db.prepare(
    'UPDATE chatbots SET name = ?, welcome_message = ?, theme_color = ? WHERE id = ? AND user_id = ?'
  ).run(name, welcome_message || '', theme_color || '#6366f1', req.params.id, req.session.user.id);

  res.redirect('/chatbots');
});

// Delete chatbot
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM chatbots WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.user.id);
  res.redirect('/chatbots');
});

// Builder page
router.get('/:id/builder', (req, res) => {
  const chatbot = db.prepare(
    'SELECT * FROM chatbots WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!chatbot) {
    return res.redirect('/chatbots');
  }

  const flows = db.prepare(
    'SELECT * FROM flows WHERE chatbot_id = ? ORDER BY created_at ASC'
  ).all(chatbot.id);

  res.render('builder', { chatbot, flows });
});

// Embed code page
router.get('/:id/embed', (req, res) => {
  const chatbot = db.prepare(
    'SELECT * FROM chatbots WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!chatbot) {
    return res.redirect('/chatbots');
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const embedUrl = `${protocol}://${host}/widget/embed/${chatbot.id}`;

  res.render('chatbots/embed', { chatbot, embedUrl });
});

// Flow API - Get all flows
router.get('/:id/flows', (req, res) => {
  const chatbot = db.prepare(
    'SELECT * FROM chatbots WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!chatbot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  const flows = db.prepare(
    'SELECT * FROM flows WHERE chatbot_id = ? ORDER BY created_at ASC'
  ).all(chatbot.id);

  res.json(flows);
});

// Flow API - Create flow
router.post('/:id/flows', (req, res) => {
  const { trigger, response, next_flow_id, position_x, position_y } = req.body;

  const chatbot = db.prepare(
    'SELECT * FROM chatbots WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!chatbot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  if (!trigger || !response) {
    return res.status(400).json({ error: 'Trigger and response are required' });
  }

  const result = db.prepare(
    'INSERT INTO flows (chatbot_id, trigger, response, next_flow_id, position_x, position_y) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(chatbot.id, trigger, response, next_flow_id || null, position_x || 0, position_y || 0);

  const flow = db.prepare('SELECT * FROM flows WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(flow);
});

// Flow API - Update flow
router.put('/:id/flows/:flowId', (req, res) => {
  const { trigger, response, next_flow_id, position_x, position_y } = req.body;

  const chatbot = db.prepare(
    'SELECT * FROM chatbots WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!chatbot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  db.prepare(
    'UPDATE flows SET trigger = ?, response = ?, next_flow_id = ?, position_x = ?, position_y = ? WHERE id = ? AND chatbot_id = ?'
  ).run(
    trigger, response, next_flow_id || null,
    position_x || 0, position_y || 0,
    req.params.flowId, chatbot.id
  );

  const flow = db.prepare('SELECT * FROM flows WHERE id = ?').get(req.params.flowId);
  res.json(flow);
});

// Flow API - Delete flow
router.delete('/:id/flows/:flowId', (req, res) => {
  const chatbot = db.prepare(
    'SELECT * FROM chatbots WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.user.id);

  if (!chatbot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  db.prepare('DELETE FROM flows WHERE id = ? AND chatbot_id = ?')
    .run(req.params.flowId, chatbot.id);

  res.json({ success: true });
});

module.exports = router;
