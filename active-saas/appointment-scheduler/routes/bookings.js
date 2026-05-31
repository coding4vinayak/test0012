const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Public booking page - select a provider
router.get('/:userId', (req, res) => {
  const { userId } = req.params;

  const provider = db.prepare('SELECT id, email, business_name FROM users WHERE id = ?').get(userId);
  if (!provider) {
    return res.status(404).send('Provider not found');
  }

  const services = db.prepare('SELECT * FROM services WHERE user_id = ? ORDER BY name ASC').all(userId);

  res.render('book', { provider, services, error: null, success: null });
});

// Get available slots for a date (API endpoint)
router.get('/:userId/slots', (req, res) => {
  const { userId } = req.params;
  const { date, service_id } = req.query;

  if (!date || !service_id) {
    return res.json({ slots: [] });
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND user_id = ?').get(service_id, userId);
  if (!service) {
    return res.json({ slots: [] });
  }

  // Get day of week for the selected date
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  // Get availability for that day
  const availabilitySlots = db.prepare(
    'SELECT * FROM availability WHERE user_id = ? AND day_of_week = ? ORDER BY start_time ASC'
  ).all(userId, dayOfWeek);

  if (availabilitySlots.length === 0) {
    return res.json({ slots: [] });
  }

  // Get existing appointments for that date
  const existingAppointments = db.prepare(
    "SELECT start_time, end_time FROM appointments WHERE user_id = ? AND date = ? AND status != 'cancelled'"
  ).all(userId, date);

  // Generate available time slots
  const slots = [];
  const duration = service.duration_minutes;

  for (const avail of availabilitySlots) {
    let currentTime = timeToMinutes(avail.start_time);
    const endTime = timeToMinutes(avail.end_time);

    while (currentTime + duration <= endTime) {
      const slotStart = minutesToTime(currentTime);
      const slotEnd = minutesToTime(currentTime + duration);

      // Check for conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = timeToMinutes(apt.start_time);
        const aptEnd = timeToMinutes(apt.end_time);
        return currentTime < aptEnd && (currentTime + duration) > aptStart;
      });

      if (!hasConflict) {
        slots.push({ start_time: slotStart, end_time: slotEnd });
      }

      currentTime += duration;
    }
  }

  res.json({ slots });
});

// Create booking
router.post('/:userId', (req, res) => {
  const { userId } = req.params;
  const { service_id, date, start_time, end_time, customer_name, customer_email } = req.body;

  const provider = db.prepare('SELECT id, email, business_name FROM users WHERE id = ?').get(userId);
  if (!provider) {
    return res.status(404).send('Provider not found');
  }

  const services = db.prepare('SELECT * FROM services WHERE user_id = ? ORDER BY name ASC').all(userId);

  if (!service_id || !date || !start_time || !end_time || !customer_name || !customer_email) {
    return res.render('book', { provider, services, error: 'All fields are required', success: null });
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND user_id = ?').get(service_id, userId);
  if (!service) {
    return res.render('book', { provider, services, error: 'Invalid service selected', success: null });
  }

  // Check for double-booking
  const conflict = db.prepare(
    `SELECT id FROM appointments
     WHERE user_id = ? AND date = ? AND status != 'cancelled'
     AND start_time < ? AND end_time > ?`
  ).get(userId, date, end_time, start_time);

  if (conflict) {
    return res.render('book', { provider, services, error: 'This time slot is no longer available. Please choose another time.', success: null });
  }

  // Verify the slot is within availability
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();
  const availabilitySlot = db.prepare(
    'SELECT id FROM availability WHERE user_id = ? AND day_of_week = ? AND start_time <= ? AND end_time >= ?'
  ).get(userId, dayOfWeek, start_time, end_time);

  if (!availabilitySlot) {
    return res.render('book', { provider, services, error: 'This time slot is outside of available hours', success: null });
  }

  db.prepare(
    'INSERT INTO appointments (service_id, user_id, customer_name, customer_email, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(service_id, userId, customer_name, customer_email, date, start_time, end_time, 'confirmed');

  res.render('book', { provider, services, error: null, success: 'Appointment booked successfully! You will receive a confirmation.' });
});

// Helper functions
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

module.exports = router;
