# LinkSnap - URL Shortener with Analytics

A link shortening service with click tracking, device detection, referrer analysis, and an analytics dashboard.

## Features

- **URL Shortening**: Create short links with random codes or custom aliases
- **Click Tracking**: Every click is logged with IP address, user agent, referrer, and timestamp
- **Analytics Dashboard**: View click counts, time series charts, top referrers, and device breakdown
- **User Accounts**: Register and login to manage your links
- **Fast Redirects**: 301 redirects with minimal latency

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (via better-sqlite3)
- **Templates**: EJS
- **Frontend**: Vanilla HTML/CSS/JS with Canvas API charts
- **Auth**: bcrypt + express-session

## Getting Started

```bash
# Install dependencies
npm install

# Start the server
npm start

# Run tests
npm test
```

The server runs on `http://localhost:3000` by default. Set the `PORT` environment variable to change it.

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/register` | Registration page |
| POST | `/auth/register` | Register a new user (email, password) |
| GET | `/auth/login` | Login page |
| POST | `/auth/login` | Login (email, password) |
| GET | `/auth/logout` | Logout |

### Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/links` | List all user links (JSON) |
| POST | `/links/create` | Create a short link |
| DELETE | `/links/:id` | Delete a link |

#### Create Link Request Body

```json
{
  "url": "https://example.com/long-url",
  "title": "My Link (optional)",
  "custom_code": "my-alias (optional)"
}
```

#### Create Link Response

```json
{
  "success": true,
  "link": {
    "id": 1,
    "user_id": 1,
    "short_code": "abc123",
    "original_url": "https://example.com/long-url",
    "title": "My Link",
    "click_count": 0,
    "created_at": "2024-01-01 00:00:00"
  }
}
```

### Redirect

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:code` | Redirect to original URL (tracks click) |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/:id` | Analytics detail page |
| GET | `/analytics/:id/clicks` | Recent clicks (JSON) |
| GET | `/analytics/:id/timeseries` | Clicks per day (JSON) |
| GET | `/analytics/:id/referrers` | Top referrers (JSON) |
| GET | `/analytics/:id/devices` | Device breakdown (JSON) |

#### Time Series Response

```json
[
  { "date": "2024-01-01", "count": 15 },
  { "date": "2024-01-02", "count": 23 }
]
```

#### Referrers Response

```json
[
  { "referrer": "https://twitter.com", "count": 42 },
  { "referrer": "https://google.com", "count": 28 }
]
```

#### Devices Response

```json
{
  "desktop": 120,
  "mobile": 85,
  "tablet": 12,
  "other": 3
}
```

## Database Schema

- **users**: id, email, password_hash, created_at
- **links**: id, user_id, short_code, original_url, title, click_count, created_at
- **clicks**: id, link_id, ip_address, user_agent, referrer, country, created_at

## License

MIT
