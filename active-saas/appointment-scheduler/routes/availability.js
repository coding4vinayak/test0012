const express = require('express');
const db = require('../db/database');

const router = express.Router();

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Show availability settings
router.get('/', (req, res) => {
  const userId = req.session.user.id;
  const availability = db.prepare(
    'SELECT * FROM availability WHERE user_id = ? ORDER BY day_of_week ASC, start_time ASC'
  ).all(userId);

  res.render('availability', { availability, days: DAYS, error: null, success: null });
});

// Save availability
router.post('/', (req, res) => {
  const userId = req.session.user.id;
  const { day_of_week, start_time, end_time } = req.body;

  if (day_of_week === undefined || !start_time || !end_time) {
    const availability = db.prepare(
      'SELECT * FROM availability WHERE user_id = ? ORDER BY day_of_week ASC, start_time ASC'
    ).all(userId);
    return res.render('availability', { availability, days: DAYS, error: 'All fields are required', success: null });
  }

  if (start_time >= end_time) {
    const availability = db.prepare(
      'SELECT * FROM availability WHERE user_id = ? ORDER BY day_of_week ASC, start_time ASC'
    ).all(userId);
    return res.render('availability', { availability, days: DAYS, error: 'Start time must be before end time', success: null });
  }

  db.prepare(
    'INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)'
  ).run(userId, parseInt(day_of_week), start_time, end_time);

  const availability = db.prepare(
    'SELECT * FROM availability WHERE user_id = ? ORDER BY day_of_week ASC, start_time ASC'
  ).all(userId);
  res.render('availability', { availability, days: DAYS, error: null, success: 'Availability added successfully' });
});

// Delete availability slot
router.post('/:id/delete', (req, res) => {
  const userId = req.session.user.id;
  db.prepare('DELETE FROM availability WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.redirect('/availability');
});

module.exports = router;
