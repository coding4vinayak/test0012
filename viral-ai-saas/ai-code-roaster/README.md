# AI Code Roaster

Paste your code and get a brutally honest, humorous roast of your code quality. Receive scores for readability, efficiency, and style with letter grades (A-F) and a shareable "code quality report card" to share with your team.

## Features

- **Code Quality Scoring**: Readability, Efficiency, and Style scores (1-10) with letter grades
- **Categorized Roasts**: Variable Naming Crimes, Architecture Atrocities, Comment Catastrophes
- **Smart Analysis**: Analyzes nesting depth, variable naming patterns, comment ratio, and code length
- **Shareable Report Cards**: Each roast gets a unique shareable link
- **Language Support**: JavaScript, Python, Java, TypeScript, C++, C#, Ruby, Go, Rust, PHP
- **User Accounts**: Save roast history and track your progress (or lack thereof)

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Views**: EJS templating
- **Auth**: bcrypt + express-session
- **AI**: Mock code analysis (no external API required)

## Setup

```bash
npm install
npm start
```

The app runs on `http://localhost:3042` by default.

## Testing

```bash
npm test
```

## Environment Variables

- `PORT` - Server port (default: 3042)
- `DB_PATH` - Database file path (default: ./db/app.db)
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Set to 'test' for test mode
