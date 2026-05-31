# AI Startup Idea Generator

Generate wild but plausible startup ideas complete with fake pitch decks, valuations, investor feedback, and absurd C-suite team suggestions. Perfect for sharing on social media.

## Features

- **Industry Selection**: Choose from 12 tech industries (AI, Blockchain, IoT, AR/VR, Fintech, Healthtech, Edtech, Foodtech, Spacetech, Cleantech, Biotech, Quantum)
- **Vibe Toggle**: Pick your startup energy - Serious, Absurd, or Moonshot
- **Full Pitch Deck**: Each idea includes a creative name, tagline, elevator pitch, fake valuation, investor quotes, team roles, and market size
- **Shareable Cards**: Every generated idea gets a unique link for social sharing
- **User Accounts**: Register to save and track your generated ideas

## Getting Started

```bash
npm install
npm start
```

The app runs on port 3045 by default.

## Testing

```bash
npm test
```

## Tech Stack

- Express.js with EJS templating
- SQLite via better-sqlite3
- bcrypt + express-session for authentication
- Mock AI generation (no external API calls)

## How It Works

The generator combines random industry verticals (e.g., "AI + Pets", "Blockchain + Grandmas") with your selected vibe to create startup concepts that include:

- **Startup Name**: Creative portmanteau from prefix/suffix combinations
- **Tagline**: Vibe-appropriate one-liner
- **Elevator Pitch**: 2-paragraph pitch tailored to the vibe
- **Valuation**: Fake Series A number (higher for moonshot/absurd vibes)
- **Investor Quotes**: 3 mock quotes (2 enthusiastic, 1 skeptical)
- **Team Roles**: 4 C-suite titles matching the vibe
- **Market Size**: TAM estimate scaled by vibe

## Environment Variables

- `PORT` - Server port (default: 3045)
- `DB_PATH` - SQLite database path (default: ./db/app.db)
- `SESSION_SECRET` - Express session secret
- `NODE_ENV` - Set to 'test' for test mode
