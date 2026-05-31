// Category selection
document.addEventListener('DOMContentLoaded', function() {
  const categoryCards = document.querySelectorAll('.category-card');
  const categoryInput = document.getElementById('category-input');
  const excuseForm = document.getElementById('excuse-form');
  const generateBtn = document.getElementById('generate-btn');
  const resultSection = document.getElementById('result-section');

  // Category card selection
  categoryCards.forEach(function(card) {
    card.addEventListener('click', function() {
      categoryCards.forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      if (categoryInput) {
        categoryInput.value = card.dataset.category;
      }
    });
  });

  // Form submission
  if (excuseForm) {
    excuseForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const situation = document.getElementById('situation-input').value.trim();
      const category = categoryInput ? categoryInput.value : '';

      if (!situation) {
        alert('Please describe your situation.');
        return;
      }

      if (!category) {
        alert('Please select a category.');
        return;
      }

      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
      }

      try {
        const response = await fetch('/excuse/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ situation, category })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Generation failed');
        }

        displayResult(data);
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        if (generateBtn) {
          generateBtn.disabled = false;
          generateBtn.textContent = 'Generate Excuse';
        }
      }
    });
  }

  function displayResult(data) {
    if (!resultSection) return;

    resultSection.style.display = 'block';
    resultSection.innerHTML = `
      <div class="excuse-card">
        <div class="excuse-category-badge">${data.category}</div>
        <div class="excuse-text">${data.excuse}</div>
        <div class="scores-row">
          <div class="score-item">
            <span class="score-label">Believability</span>
            <span class="score-value">${data.believabilityScore}/10</span>
          </div>
          <div class="score-item">
            <span class="score-label">Creativity</span>
            <span class="score-value">${data.creativityScore}/10</span>
          </div>
          <div class="score-item">
            <span class="score-label">Risk Level</span>
            <span class="risk-badge risk-${data.riskLevel}">${data.riskLevel}</span>
          </div>
        </div>
        <div class="delivery-tips">
          <h3>Delivery Tips</h3>
          <p>${data.deliveryTips}</p>
        </div>
      </div>
      <div class="share-buttons">
        <button class="btn-share btn-twitter" onclick="shareTwitter('${data.shareUrl}')">Share on Twitter</button>
        <button class="btn-share btn-whatsapp" onclick="shareWhatsApp('${data.shareUrl}')">Share on WhatsApp</button>
        <button class="btn-share btn-copy" onclick="copyLink('${data.shareUrl}')">Copy Link</button>
      </div>
    `;

    resultSection.scrollIntoView({ behavior: 'smooth' });
  }
});

// Share functions
function shareTwitter(shareUrl) {
  const url = shareUrl || window.location.pathname;
  const text = encodeURIComponent('Check out this AI-generated excuse! 😂');
  const fullUrl = encodeURIComponent(window.location.origin + url);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${fullUrl}`, '_blank');
}

function shareWhatsApp(shareUrl) {
  const url = shareUrl || window.location.pathname;
  const text = encodeURIComponent('Check out this AI-generated excuse: ' + window.location.origin + url);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyLink(shareUrl) {
  const url = shareUrl || window.location.pathname;
  const fullUrl = window.location.origin + url;
  navigator.clipboard.writeText(fullUrl).then(function() {
    alert('Link copied to clipboard!');
  }).catch(function() {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = fullUrl;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Link copied to clipboard!');
  });
}
