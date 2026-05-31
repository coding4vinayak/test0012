# QR Code Generator

A full-featured QR code creation tool with customization options and scan analytics.

## Features

- **Multiple Content Types**: Generate QR codes for URLs, plain text, WiFi credentials, and vCard contacts
- **Full Customization**: Choose foreground/background colors and size for each QR code
- **Download Formats**: Export as high-quality PNG or scalable SVG
- **Scan Tracking**: Every scan is recorded with IP address, user agent, and timestamp
- **Analytics Dashboard**: View scan history, trends, and statistics per QR code
- **Live Preview**: See your QR code update in real-time as you type
- **No-Login Preview**: Landing page lets visitors try QR code generation without signing up

## QR Code Types Supported

| Type | Description | Example Content |
|------|-------------|-----------------|
| URL | Web links | https://example.com |
| Text | Plain text messages | Hello World |
| vCard | Contact information | Name, email, phone, organization |
| WiFi | Network credentials | SSID, password, encryption type |

## Getting Started

### Prerequisites

- Node.js v22+
- npm

### Installation

```bash
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

## Tech Stack

- **Backend**: Express.js with EJS templates
- **Database**: SQLite via better-sqlite3
- **QR Generation**: qrcode npm package
- **Auth**: bcrypt + express-session
- **Frontend**: Vanilla CSS/JS with modern, colorful design

## API Endpoints

- `POST /qrcodes/create` - Create a new QR code (auth required)
- `GET /qrcodes` - List user's QR codes (auth required)
- `GET /qrcodes/:id/download/png` - Download as PNG (auth required)
- `GET /qrcodes/:id/download/svg` - Download as SVG (auth required)
- `POST /qrcodes/preview` - Generate preview data URL (no auth)
- `DELETE /qrcodes/:id` - Delete a QR code (auth required)
- `GET /track/:id` - Scan tracking redirect
- `GET /analytics/:id` - View scan analytics (auth required)
