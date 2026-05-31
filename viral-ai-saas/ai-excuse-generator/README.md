# AI Excuse Generator

Generate creative, believable excuses for any situation. Perfect for when you need a quick, convincing excuse for work, social events, family gatherings, school, or skipping the gym.

## Features

- **Category-specific excuses**: Work, Social, Family, School, Fitness
- **Quality ratings**: Each excuse rated for believability and creativity (1-10)
- **Risk level indicator**: Know how risky your excuse is (low/medium/high)
- **Delivery tips**: Get coaching on how to sell your excuse
- **Shareable excuse cards**: Share your best excuses via unique links
- **User accounts**: Save your excuse history

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Views**: EJS templates
- **Auth**: bcrypt + express-session
- **AI**: Mock AI generation (no external API required)

## Setup

```bash
npm install
npm start
```

The app runs on `http://localhost:3041` by default.

## Environment Variables

- `PORT` - Server port (default: 3041)
- `DB_PATH` - Database file path (default: ./db/app.db)
- `SESSION_SECRET` - Session secret key
- `NODE_ENV` - Set to 'test' for testing

## Testing

```bash
npm test
```

## API

### POST /excuse/generate

Generate a new excuse.

**Body:**
```json
{
  "situation": "I need to skip my friend's party",
  "category": "social"
}
```

**Response:**
```json
{
  "id": 1,
  "situation": "I need to skip my friend's party",
  "category": "social",
  "excuse": "My dog ate something weird at the park...",
  "deliveryTips": "Send a sad photo of your pet...",
  "riskLevel": "low",
  "believabilityScore": 8,
  "creativityScore": 7,
  "shareId": "abc123def456",
  "shareUrl": "/excuse/abc123def456"
}
```

### GET /excuse/:shareId

View a shared excuse card (no authentication required).
