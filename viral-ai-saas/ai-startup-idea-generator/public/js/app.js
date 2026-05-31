document.addEventListener('DOMContentLoaded', function() {
  const industryCards = document.querySelectorAll('.industry-card');
  const vibeButtons = document.querySelectorAll('.vibe-btn');
  const ideaForm = document.getElementById('idea-form');
  const industryInput = document.getElementById('industry-input');
  const vibeInput = document.getElementById('vibe-input');
  const generateBtn = document.getElementById('generate-btn');
  const resultSection = document.getElementById('result-section');

  // Industry selection
  industryCards.forEach(function(card) {
    card.addEventListener('click', function() {
      industryCards.forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      if (industryInput) {
        industryInput.value = card.dataset.industry;
      }
    });
  });

  // Vibe selection
  vibeButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      vibeButtons.forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      if (vibeInput) {
        vibeInput.value = btn.dataset.vibe;
      }
    });
  });

  // Form submission
  if (ideaForm) {
    ideaForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const vibe = vibeInput ? vibeInput.value : '';
      const industry = industryInput ? industryInput.value : '';

      if (!vibe) {
        alert('Please select a vibe first!');
        return;
      }

      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';

      try {
        const payload = { vibe };
        if (industry) {
          payload.industry = industry;
        }

        const response = await fetch('/idea/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          displayResult(data);
        } else {
          alert(data.error || 'Failed to generate idea');
        }
      } catch (err) {
        alert('Something went wrong. Please try again.');
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Startup Idea';
      }
    });
  }

  function displayResult(data) {
    if (!resultSection) return;

    const investorHtml = data.investorFeedback.map(function(inv) {
      return '<div class="investor-card investor-' + inv.sentiment + '">' +
        '<p class="investor-quote">"' + inv.quote + '"</p>' +
        '<p class="investor-name">' + inv.name + '</p></div>';
    }).join('');

    const teamHtml = data.teamRoles.map(function(member) {
      return '<div class="team-card">' +
        '<div class="team-avatar">' + member.name.charAt(0) + '</div>' +
        '<p class="team-name">' + member.name + '</p>' +
        '<p class="team-title">' + member.title + '</p></div>';
    }).join('');

    resultSection.innerHTML = '<div class="pitch-deck">' +
      '<div class="pitch-header">' +
        '<div class="logo-placeholder">' + data.startupName.charAt(0) + '</div>' +
        '<h2 class="startup-name">' + data.startupName + '</h2>' +
        '<p class="startup-tagline">' + data.tagline + '</p>' +
        '<span class="vibe-badge vibe-' + data.vibe + '">' + data.vibe + '</span>' +
      '</div>' +
      '<div class="pitch-section">' +
        '<h3>Elevator Pitch</h3>' +
        '<div class="elevator-pitch">' + data.description + '</div>' +
        '<button class="copy-btn" id="copy-pitch-btn">Copy Pitch</button>' +
      '</div>' +
      '<div class="valuation-section">' +
        '<div class="valuation-number">' + data.valuation + '</div>' +
        '<p class="valuation-label">Series A Valuation</p>' +
      '</div>' +
      '<div class="investors-section"><h3>Investor Feedback</h3>' +
        '<div class="investor-cards">' + investorHtml + '</div></div>' +
      '<div class="team-section"><h3>The Dream Team</h3>' +
        '<div class="team-cards">' + teamHtml + '</div></div>' +
      '<div class="market-section">' +
        '<div class="market-size">' + data.marketSize + '</div>' +
        '<p class="market-label">Total Addressable Market</p></div>' +
      '<div class="scores-section">' +
        '<div class="score-item"><span class="score-label">Absurdity</span>' +
          '<span class="score-value">' + data.absurdityScore + '/10</span></div>' +
        '<div class="score-item"><span class="score-label">Viability</span>' +
          '<span class="score-value">' + data.viabilityScore + '/10</span></div>' +
      '</div>' +
      '<div class="share-section">' +
        '<a href="' + data.shareUrl + '" class="share-link">Share This Idea</a>' +
      '</div></div>';

    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });

    // Copy pitch button
    const copyBtn = document.getElementById('copy-pitch-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(data.description).then(function() {
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(function() {
            copyBtn.textContent = 'Copy Pitch';
            copyBtn.classList.remove('copied');
          }, 2000);
        });
      });
    }
  }

  // Share functionality for share pages
  const shareLinks = document.querySelectorAll('.share-link');
  shareLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (navigator.share && link.href) {
        e.preventDefault();
        navigator.share({
          title: 'Check out this startup idea!',
          url: link.href
        });
      }
    });
  });
});
