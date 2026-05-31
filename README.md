# SaaS Application Suite

A collection of 8 fully functional SaaS applications built as a monorepo. Each application is a standalone, production-ready web app with user authentication, data persistence, and a polished UI.

## Directory Structure

```
.
├── active-saas/                    # High-engagement SaaS products
│   ├── ai-content-generator/       # AI-powered content creation tool
│   ├── invoice-billing/            # Invoice and billing management
│   ├── chatbot-builder/            # No-code chatbot creation platform
│   └── appointment-scheduler/      # Booking and scheduling system
├── passive-saas/                   # Passive income SaaS products
│   ├── url-shortener/              # Link shortening with analytics
│   ├── screenshot-pdf-api/         # Screenshot and PDF generation API
│   ├── status-page/                # Uptime monitoring and status pages
│   └── qr-code-generator/         # QR code creation with scan tracking
└── README.md
```

## Active SaaS Applications

These are high-demand, high-engagement applications that require active user interaction.

| Application | Description | Default Port |
|-------------|-------------|:------------:|
| [AI Content Generator](./active-saas/ai-content-generator/) | Generate blog posts, social media content, and professional emails using AI-powered templates | 3000 |
| [Invoice & Billing](./active-saas/invoice-billing/) | Professional invoicing for freelancers and small businesses with PDF generation and payment tracking | 3001 |
| [AI Chatbot Builder](./active-saas/chatbot-builder/) | No-code platform for creating website chatbots with customizable flows and embeddable widgets | 3002 |
| [Appointment Scheduler](./active-saas/appointment-scheduler/) | Online booking system for service businesses with calendar management and availability control | 3004 |

## Passive SaaS Applications

These are set-and-forget tools that generate value through APIs, automation, and self-service usage.

| Application | Description | Default Port |
|-------------|-------------|:------------:|
| [URL Shortener](./passive-saas/url-shortener/) | Link shortening service with click tracking, device detection, and referrer analytics | 3000 |
| [Screenshot & PDF API](./passive-saas/screenshot-pdf-api/) | REST API for capturing website screenshots and generating PDFs with API key authentication | 3000 |
| [Status Page Generator](./passive-saas/status-page/) | Uptime monitoring with public status pages, incident management, and 30-day history | 3000 |
| [QR Code Generator](./passive-saas/qr-code-generator/) | Full-featured QR code creation with customization options and scan analytics | 3000 |

## Tech Stack

- **Backend:** Node.js, Express.js
- **Templating:** EJS
- **Database:** SQLite (via better-sqlite3)
- **Frontend:** Vanilla JavaScript, CSS
- **Authentication:** bcrypt password hashing, session-based auth

## Getting Started

Each application is fully self-contained. To run any app:

```bash
# Navigate to the app directory
cd active-saas/ai-content-generator

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:<port>` (see the port table above).

To run tests for any app:

```bash
npm test
```

## License

MIT
