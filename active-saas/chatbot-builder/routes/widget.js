const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const router = express.Router();

// Serve widget JS for a specific chatbot
router.get('/embed/:chatbotId', (req, res) => {
  const chatbot = db.prepare('SELECT * FROM chatbots WHERE id = ?').get(req.params.chatbotId);

  if (!chatbot) {
    return res.status(404).send('// Chatbot not found');
  }

  const widgetJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'widget.js'), 'utf-8');

  // Inject chatbot config into the widget
  const config = JSON.stringify({
    chatbotId: chatbot.id,
    name: chatbot.name,
    welcomeMessage: chatbot.welcome_message,
    themeColor: chatbot.theme_color,
    apiUrl: ''
  });

  const script = `(function() {
  var CHATBOT_CONFIG = ${config};
  CHATBOT_CONFIG.apiUrl = new URL(document.currentScript.src).origin;
  ${widgetJs}
})();`;

  res.set('Content-Type', 'application/javascript');
  res.send(script);
});

// Get chatbot info (public API)
router.get('/api/:chatbotId/info', (req, res) => {
  const chatbot = db.prepare(
    'SELECT id, name, welcome_message, theme_color FROM chatbots WHERE id = ?'
  ).get(req.params.chatbotId);

  if (!chatbot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  res.json(chatbot);
});

// Send message to chatbot (public API)
router.post('/api/:chatbotId/message', (req, res) => {
  const { message, visitor_id } = req.body;
  const chatbotId = req.params.chatbotId;

  const chatbot = db.prepare('SELECT * FROM chatbots WHERE id = ?').get(chatbotId);
  if (!chatbot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  if (!message || !visitor_id) {
    return res.status(400).json({ error: 'Message and visitor_id are required' });
  }

  // Get or create conversation
  let conversation = db.prepare(
    'SELECT * FROM conversations WHERE chatbot_id = ? AND visitor_id = ?'
  ).get(chatbotId, visitor_id);

  if (!conversation) {
    const result = db.prepare(
      'INSERT INTO conversations (chatbot_id, visitor_id) VALUES (?, ?)'
    ).run(chatbotId, visitor_id);
    conversation = { id: result.lastInsertRowid };
  }

  // Store visitor message
  db.prepare(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
  ).run(conversation.id, 'visitor', message);

  // Find matching flow
  const flows = db.prepare(
    'SELECT * FROM flows WHERE chatbot_id = ?'
  ).all(chatbotId);

  let botResponse = chatbot.welcome_message;
  const lowerMessage = message.toLowerCase();

  for (const flow of flows) {
    const triggers = flow.trigger.toLowerCase().split(',').map(t => t.trim());
    if (triggers.some(t => lowerMessage.includes(t))) {
      botResponse = flow.response;

      // If there is a next flow, chain it
      if (flow.next_flow_id) {
        const nextFlow = db.prepare('SELECT * FROM flows WHERE id = ?').get(flow.next_flow_id);
        if (nextFlow) {
          botResponse += '\n\n' + nextFlow.response;
        }
      }
      break;
    }
  }

  // Store bot response
  db.prepare(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
  ).run(conversation.id, 'bot', botResponse);

  res.json({ response: botResponse, conversation_id: conversation.id });
});

// Get conversation history (public API)
router.get('/api/:chatbotId/conversations/:visitorId', (req, res) => {
  const { chatbotId, visitorId } = req.params;

  const conversation = db.prepare(
    'SELECT * FROM conversations WHERE chatbot_id = ? AND visitor_id = ?'
  ).get(chatbotId, visitorId);

  if (!conversation) {
    return res.json({ messages: [] });
  }

  const messages = db.prepare(
    'SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conversation.id);

  res.json({ messages });
});

module.exports = router;
