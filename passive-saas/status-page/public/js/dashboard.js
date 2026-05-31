// Auto-refresh dashboard every 30 seconds
(function() {
  const REFRESH_INTERVAL = 30000;

  function updateStatusIndicators() {
    fetch('/monitors/api/status', {
      credentials: 'same-origin'
    })
      .then(response => {
        if (!response.ok) return;
        return response.json();
      })
      .then(monitors => {
        if (!monitors) return;
        updateMonitorCards(monitors);
      })
      .catch(() => {
        // Silently fail on network errors
      });
  }

  function updateMonitorCards(monitors) {
    const container = document.getElementById('monitors-list');
    if (!container || monitors.length === 0) return;

    let html = '';
    monitors.forEach(m => {
      const uptimeDisplay = m.uptime_percent !== null ? m.uptime_percent + '%' : 'N/A';
      const responseDisplay = m.avg_response_time !== null ? m.avg_response_time + 'ms' : 'N/A';

      html += `
        <div class="monitor-card status-${m.status}">
          <div class="monitor-header">
            <span class="status-indicator status-${m.status}"></span>
            <h3>${escapeHtml(m.name)}</h3>
          </div>
          <p class="monitor-url">${escapeHtml(m.url)}</p>
          <div class="monitor-stats">
            <div class="stat">
              <span class="stat-label">Uptime</span>
              <span class="stat-value">${uptimeDisplay}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Avg Response</span>
              <span class="stat-value">${responseDisplay}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Status</span>
              <span class="stat-value status-text-${m.status}">${m.status}</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Only run on dashboard page
  if (document.getElementById('monitors-list')) {
    setInterval(updateStatusIndicators, REFRESH_INTERVAL);
  }
})();
