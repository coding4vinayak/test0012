const cron = require('node-cron');
const db = require('../db/database');

async function checkMonitor(monitor) {
  try {
    const start = Date.now();
    const response = await fetch(monitor.url, {
      method: 'GET',
      signal: AbortSignal.timeout(30000)
    });
    const responseTime = Date.now() - start;
    const statusCode = response.status;

    db.prepare(
      'INSERT INTO checks (monitor_id, status_code, response_time_ms) VALUES (?, ?, ?)'
    ).run(monitor.id, statusCode, responseTime);

    const newStatus = statusCode >= 200 && statusCode < 400 ? 'up' : 'down';
    const oldStatus = monitor.status;

    db.prepare(
      'UPDATE monitors SET status = ?, last_checked_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(newStatus, monitor.id);

    // Auto-create incident if monitor goes down
    if (oldStatus === 'up' && newStatus === 'down') {
      db.prepare(
        'INSERT INTO incidents (monitor_id, title, description, status) VALUES (?, ?, ?, ?)'
      ).run(
        monitor.id,
        `${monitor.name} is down`,
        `Monitor detected that ${monitor.url} is not responding correctly. Status code: ${statusCode}`,
        'investigating'
      );
    }

    // Auto-resolve incident if monitor comes back up
    if (oldStatus === 'down' && newStatus === 'up') {
      db.prepare(`
        UPDATE incidents SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
        WHERE monitor_id = ? AND status != 'resolved'
      `).run(monitor.id);
    }

    return { status: newStatus, statusCode, responseTime };
  } catch (err) {
    db.prepare(
      'INSERT INTO checks (monitor_id, status_code, response_time_ms) VALUES (?, ?, ?)'
    ).run(monitor.id, 0, 0);

    const oldStatus = monitor.status;
    db.prepare(
      'UPDATE monitors SET status = ?, last_checked_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('down', monitor.id);

    // Auto-create incident on connection failure
    if (oldStatus === 'up') {
      db.prepare(
        'INSERT INTO incidents (monitor_id, title, description, status) VALUES (?, ?, ?, ?)'
      ).run(
        monitor.id,
        `${monitor.name} is down`,
        `Monitor detected that ${monitor.url} is unreachable. Error: ${err.message}`,
        'investigating'
      );
    }

    return { status: 'down', statusCode: 0, responseTime: 0, error: err.message };
  }
}

function runChecks() {
  const monitors = db.prepare(`
    SELECT * FROM monitors
    WHERE last_checked_at IS NULL
      OR (julianday('now') - julianday(last_checked_at)) * 86400 >= check_interval_seconds
  `).all();

  monitors.forEach(monitor => {
    checkMonitor(monitor);
  });
}

function startWorker() {
  // Run checks every minute
  cron.schedule('* * * * *', () => {
    runChecks();
  });

  console.log('Monitor worker started - checking every minute');
}

module.exports = { startWorker, checkMonitor, runChecks };
