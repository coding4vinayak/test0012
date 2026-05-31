// Code input handling
document.addEventListener('DOMContentLoaded', () => {
  const codeInput = document.getElementById('code-input');
  const lineNumbers = document.getElementById('line-numbers');
  const roastForm = document.getElementById('roast-form');
  const resultContainer = document.getElementById('result-container');

  // Tab support in textarea
  if (codeInput) {
    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;
        codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
        codeInput.selectionStart = codeInput.selectionEnd = start + 2;
      }
    });

    // Update line numbers
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', () => {
      if (lineNumbers) {
        lineNumbers.scrollTop = codeInput.scrollTop;
      }
    });
  }

  function updateLineNumbers() {
    if (!lineNumbers || !codeInput) return;
    const lines = codeInput.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  }

  // Form submission
  if (roastForm) {
    roastForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('code-input').value;
      const language = document.getElementById('language-select').value;

      if (!code.trim()) {
        alert('Please paste some code to roast!');
        return;
      }

      const submitBtn = roastForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Roasting...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('/roast/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language })
        });

        const data = await response.json();

        if (response.ok) {
          displayResults(data);
        } else {
          alert(data.error || 'Something went wrong');
        }
      } catch (err) {
        alert('Failed to roast your code. Try again.');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  function displayResults(data) {
    if (!resultContainer) return;
    resultContainer.classList.remove('hidden');

    const gradeClass = (grade) => `grade-${grade.toLowerCase()}`;

    resultContainer.innerHTML = `
      <div class="scores-grid">
        <div class="score-card">
          <div class="score-grade ${gradeClass(data.roast.grades.readability)}">${data.roast.grades.readability}</div>
          <div class="score-label">Readability</div>
          <div class="score-value">${data.roast.scores.readability}/10</div>
        </div>
        <div class="score-card">
          <div class="score-grade ${gradeClass(data.roast.grades.efficiency)}">${data.roast.grades.efficiency}</div>
          <div class="score-label">Efficiency</div>
          <div class="score-value">${data.roast.scores.efficiency}/10</div>
        </div>
        <div class="score-card">
          <div class="score-grade ${gradeClass(data.roast.grades.style)}">${data.roast.grades.style}</div>
          <div class="score-label">Style</div>
          <div class="score-value">${data.roast.scores.style}/10</div>
        </div>
        <div class="score-card overall">
          <div class="score-grade ${gradeClass(data.roast.grades.overall)}">${data.roast.grades.overall}</div>
          <div class="score-label">Overall</div>
          <div class="score-value">${data.roast.scores.overall}/10</div>
        </div>
      </div>
      <div class="roast-sections">
        <div class="roast-section">
          <h3>Variable Naming Crimes <span class="section-grade ${gradeClass(data.roast.variableNaming.grade)}">${data.roast.variableNaming.grade}</span></h3>
          <p>${data.roast.variableNaming.comment}</p>
        </div>
        <div class="roast-section">
          <h3>Architecture Atrocities <span class="section-grade ${gradeClass(data.roast.architecture.grade)}">${data.roast.architecture.grade}</span></h3>
          <p>${data.roast.architecture.comment}</p>
        </div>
        <div class="roast-section">
          <h3>Comment Catastrophes <span class="section-grade ${gradeClass(data.roast.comments.grade)}">${data.roast.comments.grade}</span></h3>
          <p>${data.roast.comments.comment}</p>
        </div>
        <div class="roast-section verdict">
          <h3>Overall Verdict</h3>
          <p>${data.roast.verdict}</p>
        </div>
      </div>
      <div class="share-actions">
        <button class="btn btn-share" onclick="copyShareLink('${data.shareId}')">Copy Share Link</button>
        <a href="https://twitter.com/intent/tweet?text=My%20code%20got%20a%20${data.roast.grades.overall}%20grade!%20%F0%9F%94%A5&url=${encodeURIComponent(window.location.origin + data.shareUrl)}" target="_blank" class="btn btn-twitter">Share on Twitter</a>
        <a href="/" class="btn btn-roast">Roast More Code</a>
      </div>
    `;

    resultContainer.scrollIntoView({ behavior: 'smooth' });
  }
});

// Copy share link
function copyShareLink(shareId) {
  const url = window.location.origin + '/roast/' + shareId;
  navigator.clipboard.writeText(url).then(() => {
    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 2000);
  }).catch(() => {
    // Fallback
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  });
}
