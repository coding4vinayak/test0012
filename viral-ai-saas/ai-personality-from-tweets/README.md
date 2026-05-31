# AI Personality from Tweets

A viral micro-SaaS that generates AI personality analyses from Twitter/X handles. Enter any handle and get a shareable personality card with archetype, traits, writing style, vibe check, predicted interests, and scores.

## Features

- **Personality Archetype**: Get assigned a fun archetype like "The Hot Take Artist" or "The Thread Lord"
- **Top 5 Traits**: Personality traits with percentage breakdowns
- **Writing Style Analysis**: How you communicate online
- **Vibe Check**: A one-liner that sums up your energy
- **Predicted Interests**: What the AI thinks you are into
- **Scores**: Humor, Intelligence, and Toxicity ratings
- **Shareable Cards**: Beautiful personality cards you can share on social media
- **Deterministic**: Same handle always produces the same results

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Templates**: EJS
- **Auth**: bcrypt + express-session

## Getting Started

```bash
npm install
npm start
```

The app will run on http://localhost:3044

## Testing

```bash
npm test
```

## How It Works

The personality analysis uses a deterministic algorithm based on the Twitter handle string. Character codes, handle length, and special characters are used as seeds to consistently generate the same personality profile for the same handle. No actual Twitter API calls are made.

## Environment Variables

- `PORT` - Server port (default: 3044)
- `DB_PATH` - SQLite database path (default: ./db/app.db)
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Set to 'test' for testing mode
