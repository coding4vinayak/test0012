# Screenshot & PDF API

A REST API service for capturing website screenshots and generating PDFs from URLs or HTML content.

## Features

- Screenshot capture from any URL with configurable viewport
- PDF generation from HTML content or URLs
- API key authentication and management
- Per-key usage tracking and rate limiting
- Interactive API playground
- Developer dashboard with usage stats

## Quick Start

```bash
npm install
npm start
```

The server starts on `http://localhost:3000`.

## API Endpoints

### Authentication

All API endpoints require an API key passed via the `X-API-Key` header or `api_key` query parameter.

### POST /api/screenshot

Capture a screenshot of a URL.

**Request:**
```json
{
  "url": "https://example.com",
  "width": 1280,
  "height": 720,
  "format": "png"
}
```

**Parameters:**
- `url` (required) - The URL to capture
- `width` (optional) - Viewport width, default 1280
- `height` (optional) - Viewport height, default 720
- `format` (optional) - Output format: png, jpeg, webp. Default: png

**Response:** Image binary (Content-Type: image/png)

### POST /api/pdf

Generate a PDF from HTML or a URL.

**Request (HTML):**
```json
{
  "html": "<h1>Hello World</h1><p>Content here</p>",
  "title": "My Document",
  "pageSize": "A4",
  "orientation": "portrait"
}
```

**Request (URL):**
```json
{
  "url": "https://example.com",
  "title": "Page Export",
  "pageSize": "Letter"
}
```

**Parameters:**
- `html` or `url` (one required) - Content source
- `title` (optional) - Document title
- `pageSize` (optional) - A4, A3, Letter, Legal. Default: A4
- `orientation` (optional) - portrait or landscape. Default: portrait

**Response:** PDF binary (Content-Type: application/pdf)

## Code Examples

### cURL

```bash
# Screenshot
curl -X POST http://localhost:3000/api/screenshot \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output screenshot.png

# PDF from HTML
curl -X POST http://localhost:3000/api/pdf \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Hello</h1>", "title": "Test"}' \
  --output doc.pdf
```

### Node.js

```javascript
const response = await fetch('http://localhost:3000/api/screenshot', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    width: 1920,
    height: 1080
  })
});
const buffer = await response.arrayBuffer();
fs.writeFileSync('screenshot.png', Buffer.from(buffer));
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3000/api/pdf',
    headers={'X-API-Key': 'your_key'},
    json={'html': '<h1>Hello World</h1>', 'title': 'My Doc'}
)
with open('document.pdf', 'wb') as f:
    f.write(response.content)
```

## Rate Limiting

- Free tier: 100 requests per hour per API key
- Rate limit info returned in 429 responses

## Running Tests

```bash
npm test
```

## Tech Stack

- Node.js + Express.js
- SQLite (better-sqlite3)
- PDFKit for PDF generation
- EJS templates
- Vanilla CSS (dark theme)
