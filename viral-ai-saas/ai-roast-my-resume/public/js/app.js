// Character count for textarea
const textarea = document.getElementById('resume-input');
const charCount = document.getElementById('char-count');

if (textarea && charCount) {
  textarea.addEventListener('input', function() {
    charCount.textContent = this.value.length;
  });
}

// Form submission
const roastForm = document.getElementById('roast-form');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('result-container');

if (roastForm) {
  roastForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const resumeText = textarea.value.trim();
    if (!resumeText) return;

    roastForm.classList.add('hidden');
    loading.classList.remove('hidden');
    resultContainer.classList.add('hidden');

    try {
      const response = await fetch('/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate roast');
      }

      displayResult(data);
    } catch (err) {
      loading.classList.add('hidden');
      roastForm.classList.remove('hidden');
      alert(err.message);
    }
  });
}

function displayResult(data) {
  loading.classList.add('hidden');
  resultContainer.classList.remove('hidden');

  resultContainer.innerHTML = `
    <div class="overall-grade">
      <div class="grade-badge grade-${data.letterGrade.charAt(0).toLowerCase()}">
        ${data.letterGrade}
      </div>
      <h2>Your Resume Score: ${data.overallScore}/10</h2>
    </div>

    <div class="scores-section">
      <h3>Score Breakdown</h3>
      <div class="score-bars">
        <div class="score-bar-item">
          <label>Impact</label>
          <div class="bar-container"><div class="bar" style="width: ${data.impactScore * 10}%"></div></div>
          <span class="score-value">${data.impactScore}/10</span>
        </div>
        <div class="score-bar-item">
          <label>Clarity</label>
          <div class="bar-container"><div class="bar" style="width: ${data.clarityScore * 10}%"></div></div>
          <span class="score-value">${data.clarityScore}/10</span>
        </div>
        <div class="score-bar-item">
          <label>Buzzword-Free</label>
          <div class="bar-container"><div class="bar" style="width: ${data.buzzwordScore * 10}%"></div></div>
          <span class="score-value">${data.buzzwordScore}/10</span>
        </div>
        <div class="score-bar-item">
          <label>Cringe Factor</label>
          <div class="bar-container"><div class="bar bar-cringe" style="width: ${data.cringeScore * 10}%"></div></div>
          <span class="score-value">${data.cringeScore}/10</span>
        </div>
      </div>
    </div>

    <div class="roast-details">
      <div class="first-impression">
        <h3>First Impression</h3>
        <p class="roast-quote">${data.roast.firstImpression}</p>
      </div>

      <div class="expandable-section">
        <button class="expand-toggle" onclick="toggleSection('exp')">
          <span>Experience Section</span><span class="toggle-icon">+</span>
        </button>
        <div id="exp" class="expandable-content hidden"><p>${data.roast.sections.experience.roast}</p></div>
      </div>

      <div class="expandable-section">
        <button class="expand-toggle" onclick="toggleSection('skills')">
          <span>Skills Section</span><span class="toggle-icon">+</span>
        </button>
        <div id="skills" class="expandable-content hidden"><p>${data.roast.sections.skills.roast}</p></div>
      </div>

      <div class="expandable-section">
        <button class="expand-toggle" onclick="toggleSection('edu')">
          <span>Education Section</span><span class="toggle-icon">+</span>
        </button>
        <div id="edu" class="expandable-content hidden"><p>${data.roast.sections.education.roast}</p></div>
      </div>

      <div class="expandable-section">
        <button class="expand-toggle" onclick="toggleSection('summ')">
          <span>Summary/Objective</span><span class="toggle-icon">+</span>
        </button>
        <div id="summ" class="expandable-content hidden"><p>${data.roast.sections.summary.roast}</p></div>
      </div>

      <div class="buzzword-section">
        <h3>Buzzword Bingo</h3>
        <p>${data.roast.buzzwordBingo}</p>
      </div>

      <div class="impact-section">
        <h3>Impact Check</h3>
        <p>${data.roast.impactCheck}</p>
      </div>

      <div class="cringe-section">
        <h3>Cringe Meter</h3>
        <p>${data.roast.cringeMeter}</p>
      </div>

      <div class="verdict-section">
        <h3>The Verdict</h3>
        <p class="verdict-text">${data.roast.verdict}</p>
      </div>
    </div>

    <div class="recommendations-section">
      <h3>How to Actually Fix This</h3>
      <div class="recommendations-list">
        ${data.recommendations.map((rec, i) => `
          <div class="recommendation-card">
            <span class="rec-number">${i + 1}</span>
            <p>${rec}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="actions-bar">
      <button class="btn btn-share" onclick="shareResult('${data.shareId}')">Share Score Card</button>
      <a href="/" class="btn btn-secondary">Roast Another Resume</a>
    </div>
  `;

  // Animate score bars
  setTimeout(() => {
    document.querySelectorAll('.bar').forEach(bar => {
      bar.style.width = bar.style.width;
    });
  }, 100);
}

function toggleSection(id) {
  const content = document.getElementById(id);
  if (content) {
    content.classList.toggle('hidden');
    const toggle = content.previousElementSibling || content.parentElement.querySelector('.expand-toggle');
    if (toggle) {
      const icon = toggle.querySelector('.toggle-icon');
      if (icon) {
        icon.textContent = content.classList.contains('hidden') ? '+' : '-';
      }
    }
  }
}

function shareResult(shareId) {
  const url = window.location.origin + '/roast/' + shareId;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!');
    });
  } else {
    prompt('Copy this share link:', url);
  }
}

// Expandable sections on result page (server-rendered)
document.querySelectorAll('.expand-toggle[data-target]').forEach(btn => {
  btn.addEventListener('click', function() {
    const target = document.getElementById(this.dataset.target);
    if (target) {
      target.classList.toggle('hidden');
      const icon = this.querySelector('.toggle-icon');
      if (icon) {
        icon.textContent = target.classList.contains('hidden') ? '+' : '-';
      }
    }
  });
});
