# AI Roast My Website

A viral micro-SaaS that lets users paste a URL and get a brutally honest, humorous roast of their website's design, copy, and UX. Generates shareable roast cards with scores.

## Features

- Paste any URL and get an instant AI-generated roast
- Scores for Design, Copy, and UX (1-10 scale)
- Shareable roast cards with unique links
- Dark theme with neon accents for a viral, edgy feel
- User accounts to save roast history
- Share to Twitter or copy link functionality

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Templating**: EJS
- **Auth**: express-session + bcrypt
- **Styling**: Custom CSS with dark theme and gradients

## Setup

```bash
npm install
npm start
```

The app will run on `http://localhost:3040`.

## Testing

```bash
npm test
```

## Environment Variables

- `PORT` - Server port (default: 3040)
- `DB_PATH` - Database file path (default: ./db/app.db)
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Set to 'test' for test mode
