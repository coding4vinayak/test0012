// Handle input validation and form submission
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('analyze-form');
  const handleInput = document.getElementById('handle-input');

  if (form && handleInput) {
    // Auto-strip @ from input
    handleInput.addEventListener('input', function() {
      if (this.value.startsWith('@')) {
        this.value = this.value.substring(1);
      }
      // Only allow valid Twitter handle characters
      this.value = this.value.replace(/[^a-zA-Z0-9_]/g, '');
    });

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const handle = handleInput.value.trim();

      if (!handle) {
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Analyzing...';
      btn.disabled = true;

      try {
        const response = await fetch('/analyze/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle: handle })
        });

        const data = await response.json();

        if (response.ok) {
          window.location.href = '/analyze/' + data.shareId;
        } else {
          alert(data.error || 'Something went wrong. Please try again.');
          btn.textContent = originalText;
          btn.disabled = false;
        }
      } catch (err) {
        alert('Something went wrong. Please try again.');
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // Animate progress bars on result/share pages
  const progressBars = document.querySelectorAll('.progress-fill');
  if (progressBars.length > 0) {
    setTimeout(function() {
      progressBars.forEach(function(bar) {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(function() {
          bar.style.width = width;
        }, 100);
      });
    }, 200);
  }
});

// Copy share link
function copyShareLink() {
  const shareUrl = document.getElementById('share-url');
  if (shareUrl) {
    const url = window.location.origin + shareUrl.value;
    navigator.clipboard.writeText(url).then(function() {
      const btn = document.querySelector('.btn-copy');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function() {
          btn.textContent = original;
        }, 2000);
      }
    }).catch(function() {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = window.location.origin + shareUrl.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  }
}
