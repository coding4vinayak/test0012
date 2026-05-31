# AI Content Generator

A SaaS web application that generates blog posts, social media content, and professional emails using AI-powered templates. Built with Node.js, Express, and SQLite.

## Features

- **Blog Post Generation** - Create well-structured, engaging blog posts on any topic
- **Social Media Content** - Generate scroll-stopping posts with hashtags and CTAs
- **Professional Emails** - Craft emails that get responses
- **User Authentication** - Secure registration and login with bcrypt
- **Content History** - Access all previously generated content
- **Modern UI** - Responsive design with gradient hero and card components

## Tech Stack

- **Backend**: Node.js, Express.js
- **Views**: EJS templates
- **Database**: SQLite (via better-sqlite3)
- **Authentication**: bcrypt + express-session
- **Frontend**: Vanilla CSS/JS

## Getting Started

### Prerequisites

- Node.js v18 or higher

### Installation

```bash
cd active-saas/ai-content-generator
npm install
```

### Running

```bash
npm start
```

The server starts on `http://localhost:3000` by default. Set the `PORT` environment variable to use a different port.

### Testing

```bash
npm test
```

## Project Structure

```
ai-content-generator/
├── server.js           # Express app entry point
├── package.json
├── db/
│   ├── database.js     # Database connection and initialization
│   └── schema.sql      # SQLite schema
├── routes/
│   ├── auth.js         # Authentication routes
│   └── content.js      # Content generation routes
├── views/
│   ├── index.ejs       # Landing page
│   ├── login.ejs       # Login page
│   ├── register.ejs    # Registration page
│   └── dashboard.ejs   # User dashboard
├── public/
│   ├── css/style.css   # Application styles
│   └── js/app.js       # Client-side JavaScript
├── tests/
│   └── app.test.js     # Test suite
└── README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| SESSION_SECRET | (built-in) | Session encryption key |
| DB_PATH | ./db/app.db | SQLite database file path |

## Screenshots

*Landing page with hero section and pricing*

![Landing Page](screenshots/landing.png)

*Dashboard with content generation form*

![Dashboard](screenshots/dashboard.png)

## License

MIT
