# Status Page Generator

A SaaS application for uptime monitoring with public status pages. Monitor your websites and APIs, track response times, manage incidents, and share beautifully styled public status pages with your users.

## Features

- **Uptime Monitoring**: Automatically check your endpoints at configurable intervals
- **Public Status Pages**: Create branded, publicly accessible status pages with custom slugs
- **Incident Management**: Create, update, and resolve incidents with status tracking
- **30-Day Uptime History**: Visual uptime bars showing daily status for the last 30 days
- **Response Time Tracking**: Monitor and display average response times
- **Auto-Refresh Dashboard**: Real-time updates every 30 seconds on the dashboard
- **Status Indicators**: Clear green/yellow/red visual indicators for service health

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (via better-sqlite3)
- **Templates**: EJS
- **Authentication**: bcrypt + express-session
- **Scheduling**: node-cron
- **Frontend**: Vanilla CSS/JS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open your browser at `http://localhost:3000`

## Usage

1. Register an account
2. Add monitors (name, URL, check interval)
3. Create a status page (title, slug, theme)
4. Share your public status page at `/status/your-slug`
5. Manage incidents when issues arise

## Development

Run tests:

```bash
npm test
```

## Database Schema

- **users**: Account management
- **monitors**: URL endpoints to check (name, url, check_interval_seconds, status)
- **checks**: Individual check results (status_code, response_time_ms)
- **incidents**: Incident records (title, description, status, timestamps)
- **status_pages**: Public page configuration (slug, title, description, theme)

## Environment Variables

- `PORT` - Server port (default: 3000)
- `SESSION_SECRET` - Session encryption key
- `DB_PATH` - SQLite database file path
- `NODE_ENV` - Environment (set to "test" for testing)
