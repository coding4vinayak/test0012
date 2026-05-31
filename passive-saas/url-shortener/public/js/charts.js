/**
 * Simple chart rendering using Canvas API
 */

function drawTimeseriesChart(canvas, data) {
  if (!canvas || !data || data.length === 0) {
    drawEmptyState(canvas, 'No click data yet');
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  ctx.clearRect(0, 0, width, height);

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => d.count);
  const maxVal = Math.max(...values, 1);

  // Draw grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const label = Math.round(maxVal - (maxVal / 4) * i);
    ctx.fillText(label.toString(), padding.left - 8, y + 4);
  }

  // Draw line
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  const points = [];
  data.forEach((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.count / maxVal) * chartHeight;
    points.push({ x, y });
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw area fill
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartHeight);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw points
  points.forEach(p => {
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // X-axis labels
  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(data.length / 6));
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
      const label = d.date.substring(5); // MM-DD
      ctx.fillText(label, x, height - 10);
    }
  });
}

function drawBarChart(canvas, data) {
  if (!canvas || !data || data.length === 0) {
    drawEmptyState(canvas, 'No data available');
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 20, right: 20, bottom: 60, left: 50 };

  ctx.clearRect(0, 0, width, height);

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);

  const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const barWidth = Math.min(50, chartWidth / data.length - 10);
  const totalBarsWidth = data.length * (barWidth + 10);
  const startX = padding.left + (chartWidth - totalBarsWidth) / 2;

  // Draw grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const label = Math.round(maxVal - (maxVal / 4) * i);
    ctx.fillText(label.toString(), padding.left - 8, y + 4);
  }

  // Draw bars
  data.forEach((d, i) => {
    const barHeight = (d.value / maxVal) * chartHeight;
    const x = startX + i * (barWidth + 10);
    const y = padding.top + chartHeight - barHeight;

    // Bar with rounded top
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    const radius = 4;
    ctx.moveTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, padding.top + chartHeight);
    ctx.lineTo(x, padding.top + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Value on top
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.value.toString(), x + barWidth / 2, y - 6);

    // Label below
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const label = d.label.length > 12 ? d.label.substring(0, 12) + '...' : d.label;
    ctx.save();
    ctx.translate(x + barWidth / 2, padding.top + chartHeight + 12);
    ctx.rotate(-0.4);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}

function drawEmptyState(canvas, message) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#64748b';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(message, width / 2, height / 2);
}
