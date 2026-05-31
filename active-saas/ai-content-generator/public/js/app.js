document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('generate-form');
  const outputSection = document.getElementById('output-section');
  const outputContent = document.getElementById('output-content');
  const copyBtn = document.getElementById('copy-btn');
  const generateBtn = document.getElementById('generate-btn');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const type = document.getElementById('type').value;
      const prompt = document.getElementById('prompt').value;

      if (!prompt.trim()) return;

      generateBtn.textContent = 'Generating...';
      generateBtn.disabled = true;

      try {
        const response = await fetch('/content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, prompt })
        });

        const data = await response.json();

        if (response.ok) {
          outputContent.textContent = data.result;
          outputSection.style.display = 'block';
          outputSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          alert(data.error || 'Failed to generate content');
        }
      } catch (err) {
        alert('An error occurred. Please try again.');
      } finally {
        generateBtn.textContent = 'Generate Content';
        generateBtn.disabled = false;
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const text = outputContent.textContent;
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () {
          copyBtn.textContent = 'Copy to Clipboard';
        }, 2000);
      });
    });
  }

  // View full content buttons
  document.querySelectorAll('.view-content').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const result = decodeURIComponent(this.dataset.result);
      outputContent.textContent = result;
      outputSection.style.display = 'block';
      outputSection.scrollIntoView({ behavior: 'smooth' });
    });
  });
});
