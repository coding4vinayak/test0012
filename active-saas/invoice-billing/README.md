# InvoiceFlow - Invoice & Billing SaaS

A professional invoicing application built for freelancers and small businesses. Create invoices, track payments, manage clients, and generate PDF invoices.

## Features

- **User Authentication** - Secure registration and login with bcrypt password hashing
- **Client Management** - Full CRUD operations for managing client information
- **Invoice Creation** - Create invoices with multiple line items and automatic total calculation
- **Status Tracking** - Track invoices through draft, sent, paid, and overdue statuses
- **PDF Generation** - Generate professional PDF invoices using PDFKit
- **Revenue Dashboard** - Overview of total revenue, pending payments, and overdue alerts
- **Responsive Design** - Clean, professional interface that works on all devices

## Tech Stack

- **Backend:** Node.js, Express.js
- **Templates:** EJS
- **Database:** SQLite (via better-sqlite3)
- **Authentication:** bcrypt + express-session
- **PDF:** PDFKit
- **Frontend:** Vanilla CSS/JS

## Setup

```bash
# Install dependencies
npm install

# Start the server
npm start

# Run tests
npm test
```

The server starts on port 3001 by default. Set the `PORT` environment variable to change it.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| SESSION_SECRET | (built-in) | Session encryption secret |
| DB_PATH | db/app.db | SQLite database file path |

## Project Structure

```
invoice-billing/
  server.js          - Express app setup and main routes
  db/
    database.js      - Database connection and initialization
    schema.sql       - SQLite schema (users, clients, invoices, invoice_items)
  routes/
    auth.js          - Authentication (register/login/logout)
    clients.js       - Client CRUD operations
    invoices.js      - Invoice management and PDF generation
  views/
    index.ejs        - Landing page
    dashboard.ejs    - Revenue dashboard
    login.ejs        - Login form
    register.ejs     - Registration form
    clients/
      index.ejs      - Client list
      form.ejs       - Client create/edit form
    invoices/
      index.ejs      - Invoice list
      create.ejs     - Invoice creation form
      view.ejs       - Invoice detail with printable layout
  public/
    css/style.css    - Application styles
    js/app.js        - Client-side invoice form logic
  tests/
    app.test.js      - Integration tests
```

## Usage

1. Register an account
2. Add clients with their contact information
3. Create invoices with line items (description, quantity, rate)
4. Track invoice status (draft -> sent -> paid)
5. Generate PDF invoices for sending to clients
6. Monitor revenue on the dashboard
