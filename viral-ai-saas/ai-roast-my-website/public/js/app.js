document.addEventListener('DOMContentLoaded', function() {
  // Score meter animations
  const scoreMeters = document.querySelectorAll('.score-meter');
  scoreMeters.forEach(function(meter) {
    const score = meter.getAttribute('data-score');
    meter.style.setProperty('--score', score);
  });

  // Roast form submission
  const roastForm = document.getElementById('roast-form');
  if (roastForm) {
    roastForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const urlInput = document.getElementById('url-input');
      const url = urlInput.value.trim();
      const loading = document.getElementById('loading');
      const resultContainer = document.getElementById('result-container');

      if (!url) return;

      loading.classList.remove('hidden');
      resultContainer.classList.add('hidden');
      resultContainer.innerHTML = '';

      try {
        const response = await fetch('/roast/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Something went wrong');
        }

        loading.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        resultContainer.innerHTML = renderRoastResult(data);

        // Animate scores after render
        setTimeout(function() {
          const newMeters = resultContainer.querySelectorAll('.score-meter');
          newMeters.forEach(function(meter) {
            const score = meter.getAttribute('data-score');
            meter.style.setProperty('--score', score);
          });
        }, 100);

      } catch (err) {
        loading.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        resultContainer.innerHTML = '<div class="error-message">' + err.message + '</div>';
      }
    });
  }

  // Copy link buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn')) {
      const url = window.location.origin + e.target.getAttribute('data-url');
      navigator.clipboard.writeText(url).then(function() {
        e.target.textContent = 'Copied!';
        setTimeout(function() {
          e.target.textContent = 'Copy Link';
        }, 2000);
      });
    }
  });
});

function renderRoastResult(data) {
  var html = '<div class="result-page">';
  html += '<h1>The Verdict Is In</h1>';
  html += '<p class="roasted-url">Roasting: <strong>' + escapeHtml(data.url) + '</strong></p>';

  html += '<div class="scores-grid">';

  // Design
  html += '<div class="score-card">';
  html += '<h3>Design Disaster</h3>';
  html += '<span class="score-value">' + data.roast.design.score + '/10</span>';
  html += '<div class="score-meter" data-score="' + data.roast.design.score + '"></div>';
  html += '<p class="score-liner">' + escapeHtml(data.roast.design.oneLiner) + '</p>';
  html += '<p class="score-detail">' + escapeHtml(data.roast.design.detail) + '</p>';
  html += '</div>';

  // Copy
  html += '<div class="score-card">';
  html += '<h3>Copy Catastrophe</h3>';
  html += '<span class="score-value">' + data.roast.copy.score + '/10</span>';
  html += '<div class="score-meter" data-score="' + data.roast.copy.score + '"></div>';
  html += '<p class="score-liner">' + escapeHtml(data.roast.copy.oneLiner) + '</p>';
  html += '<p class="score-detail">' + escapeHtml(data.roast.copy.detail) + '</p>';
  html += '</div>';

  // UX
  html += '<div class="score-card">';
  html += '<h3>UX Nightmare</h3>';
  html += '<span class="score-value">' + data.roast.ux.score + '/10</span>';
  html += '<div class="score-meter" data-score="' + data.roast.ux.score + '"></div>';
  html += '<p class="score-liner">' + escapeHtml(data.roast.ux.oneLiner) + '</p>';
  html += '<p class="score-detail">' + escapeHtml(data.roast.ux.detail) + '</p>';
  html += '</div>';

  html += '</div>';

  // Overall
  html += '<div class="overall-verdict">';
  html += '<h2>Overall: ' + data.roast.overall.score + '/10</h2>';
  html += '<p>' + escapeHtml(data.roast.overall.verdict) + '</p>';
  html += '</div>';

  // Share
  html += '<div class="share-section">';
  html += '<h3>Share Your Shame</h3>';
  html += '<div class="share-buttons">';
  html += '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent('My website just got roasted and scored ' + data.roast.overall.score + '/10 \uD83D\uDD25') + '&url=' + encodeURIComponent(window.location.origin + data.shareUrl) + '" target="_blank" class="share-btn twitter-btn">Share on Twitter</a>';
  html += '<button class="share-btn copy-btn" data-url="' + data.shareUrl + '">Copy Link</button>';
  html += '</div>';
  html += '</div>';

  html += '<a href="/" class="roast-another-btn">Roast Another Website</a>';
  html += '</div>';

  return html;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
