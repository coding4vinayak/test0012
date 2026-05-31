# AI Roast My Resume

Get a brutally honest but constructive roast of your resume with AI-powered analysis. Paste your resume text and receive scores for impact, clarity, buzzword density, and cringe factor, along with section-by-section feedback and actionable recommendations.

## Features

- **Resume Score Card**: Get rated on Impact, Clarity, Buzzword-Free, and Cringe Factor (1-10 scale)
- **Section-by-Section Roasts**: Individual feedback for Experience, Skills, Education, and Summary
- **Buzzword Detection**: Identifies and calls out overused corporate buzzwords
- **Cringe Meter**: Rates the pretentiousness level of your resume
- **Actionable Recommendations**: 3-5 specific tips to improve your resume
- **Shareable Score Cards**: Share your results with friends (or enemies)
- **User Accounts**: Track your resume improvements over time

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (via better-sqlite3)
- **Templating**: EJS
- **Auth**: bcrypt + express-session
- **AI**: Mock analysis (no external API required)

## Getting Started

```bash
npm install
npm start
```

The app will run on `http://localhost:3045`.

## Testing

```bash
npm test
```

## Environment Variables

- `PORT` - Server port (default: 3045)
- `DB_PATH` - Database file path (default: ./db/app.db)
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Set to 'test' for testing mode

## How It Works

The resume analyzer examines your text for:
- Word count and overall length
- Buzzword density (synergy, leverage, passionate, etc.)
- Action verb usage (built, launched, grew, etc.)
- Quantification (numbers, percentages, dollar amounts)
- Section completeness (Summary, Experience, Skills, Education)

Based on this analysis, it generates scores, section-specific roasts, and tailored recommendations to help you actually improve your resume.
