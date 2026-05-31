# Appointment Scheduler

A booking and scheduling SaaS tool for service businesses. Let your customers book appointments online while you manage your calendar, services, and availability.

## Features

- **Online Booking Page** - Share your booking link and let customers schedule appointments 24/7
- **Service Management** - Define services with custom names, durations, and pricing
- **Weekly Availability** - Set your working hours for each day of the week
- **Double-Booking Prevention** - Automatic conflict detection ensures no overlapping appointments
- **Appointment Status** - Manage appointments through confirmed, completed, and cancelled states
- **Dashboard** - View upcoming appointments, today's schedule, and key statistics
- **Interactive Calendar** - Customers see available time slots based on your availability

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (via better-sqlite3)
- **Templates**: EJS
- **Auth**: bcrypt + express-session
- **Frontend**: Vanilla JS + CSS

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open http://localhost:3004 in your browser

## Usage

1. Register an account with your business name
2. Add your services (e.g., "Haircut - 30 min - $25")
3. Set your weekly availability hours
4. Share your booking link (`/book/YOUR_ID`) with customers
5. Customers select a service, date, and available time slot
6. Manage appointments from your dashboard

## Running Tests

```bash
npm test
```

## Project Structure

```
appointment-scheduler/
  server.js          - Express app setup and main routes
  db/
    database.js      - Database connection
    schema.sql       - SQLite schema
  routes/
    auth.js          - Registration, login, logout
    services.js      - Service CRUD
    availability.js  - Weekly schedule management
    bookings.js      - Public booking and slot availability
  views/
    index.ejs        - Landing page
    dashboard.ejs    - Business owner dashboard
    book.ejs         - Public booking page
    appointments.ejs - Appointment management
    availability.ejs - Availability settings
    services/        - Service forms and list
    login.ejs        - Login form
    register.ejs     - Registration form
  public/
    css/style.css    - Application styles
    js/calendar.js   - Interactive booking UI
  tests/
    app.test.js      - Integration tests
```
