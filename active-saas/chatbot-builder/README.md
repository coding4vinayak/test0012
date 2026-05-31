# AI Chatbot Builder

A no-code platform for creating website chatbots with customizable conversation flows and embeddable widgets.

## Features

- **Visual Flow Builder** - Design conversation flows with drag-and-drop interface
- **Customizable Themes** - Match your brand with colors, welcome messages, and styles
- **Embeddable Widget** - Add chatbots to any website with a single script tag
- **Conversation Analytics** - Track conversations and message volumes
- **Trigger-Based Responses** - Configure keyword triggers with flow chaining
- **Multi-Bot Support** - Create and manage multiple chatbots

## Tech Stack

- Node.js + Express.js
- EJS templates
- SQLite (better-sqlite3)
- Vanilla CSS/JS frontend

## Getting Started

```bash
npm install
npm start
```

The server runs on `http://localhost:3002` by default.

## Embedding Your Chatbot

After creating a chatbot and configuring flows, get the embed code from the chatbot's "Embed" page. Add the script tag to your website:

```html
<script src="http://your-domain.com/widget/embed/YOUR_CHATBOT_ID"></script>
```

Place it just before the closing `</body>` tag. The widget appears as a floating chat bubble in the bottom-right corner of the page.

### How It Works

1. The script tag loads the widget JS with your chatbot's configuration
2. A chat bubble appears on the page
3. When visitors click it, a chat panel opens with your welcome message
4. Visitor messages are matched against your configured flow triggers
5. The bot responds with the matching flow's response

## API Endpoints

### Widget API (Public)

- `GET /widget/embed/:chatbotId` - Serves the embeddable widget JavaScript
- `GET /widget/api/:chatbotId/info` - Get chatbot configuration
- `POST /widget/api/:chatbotId/message` - Send a message and get a response
- `GET /widget/api/:chatbotId/conversations/:visitorId` - Get conversation history

### Chatbot Management (Authenticated)

- `GET /chatbots` - List all chatbots
- `POST /chatbots` - Create a new chatbot
- `GET /chatbots/:id/edit` - Edit chatbot settings
- `POST /chatbots/:id` - Update chatbot
- `POST /chatbots/:id/delete` - Delete chatbot
- `GET /chatbots/:id/builder` - Visual flow builder
- `GET /chatbots/:id/embed` - Get embed code

### Flow API (Authenticated, JSON)

- `GET /chatbots/:id/flows` - List flows for a chatbot
- `POST /chatbots/:id/flows` - Create a flow
- `PUT /chatbots/:id/flows/:flowId` - Update a flow
- `DELETE /chatbots/:id/flows/:flowId` - Delete a flow

## Testing

```bash
npm test
```

## Database Schema

- **users** - Registered users (email, password_hash, name)
- **chatbots** - User chatbots (name, welcome_message, theme_color)
- **flows** - Conversation flows (trigger keywords, response, chaining)
- **conversations** - Visitor conversations linked to chatbots
- **messages** - Individual messages (role: visitor/bot, content)
