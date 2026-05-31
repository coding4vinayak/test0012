// Real-time QR code preview generator
(function() {
  const form = document.getElementById('qr-form');
  if (!form) return;

  const typeSelect = document.getElementById('type');
  const contentInput = document.getElementById('content');
  const fgColor = document.getElementById('foreground_color');
  const bgColor = document.getElementById('background_color');
  const sizeRange = document.getElementById('size');
  const sizeDisplay = document.getElementById('size-display');
  const previewBox = document.getElementById('qr-live-preview');

  let debounceTimer;

  // Update size display
  if (sizeRange && sizeDisplay) {
    sizeRange.addEventListener('input', () => {
      sizeDisplay.textContent = sizeRange.value + 'px';
      updatePreview();
    });
  }

  // Update placeholder based on type
  if (typeSelect && contentInput) {
    typeSelect.addEventListener('change', () => {
      const type = typeSelect.value;
      switch (type) {
        case 'url':
          contentInput.placeholder = 'https://example.com';
          break;
        case 'text':
          contentInput.placeholder = 'Enter your text here';
          break;
        case 'vcard':
          contentInput.placeholder = 'John Doe, john@example.com';
          break;
        case 'wifi':
          contentInput.placeholder = 'NetworkName:Password';
          break;
      }
      updatePreview();
    });
  }

  // Listen to changes for live preview
  [contentInput, fgColor, bgColor].forEach(el => {
    if (el) el.addEventListener('input', updatePreview);
  });

  function updatePreview() {
    const content = contentInput ? contentInput.value.trim() : '';
    if (!content) {
      if (previewBox) {
        previewBox.innerHTML = '<p class="placeholder-text">Start typing to see preview</p>';
      }
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const body = {
          type: typeSelect ? typeSelect.value : 'text',
          content: content,
          foreground_color: fgColor ? fgColor.value : '#000000',
          background_color: bgColor ? bgColor.value : '#ffffff',
          size: sizeRange ? parseInt(sizeRange.value) : 200
        };

        const res = await fetch('/qrcodes/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.success && previewBox) {
          previewBox.innerHTML = '<img src="' + data.dataUrl + '" alt="QR Code Preview">';
        }
      } catch (e) {
        // Silently fail on preview errors
      }
    }, 300);
  }

  // Handle form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = contentInput.value.trim();
      if (!content) return;

      try {
        const body = {
          type: typeSelect.value,
          content: content,
          foreground_color: fgColor.value,
          background_color: bgColor.value,
          size: sizeRange.value
        };

        const res = await fetch('/qrcodes/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.success) {
          window.location.href = '/dashboard';
        } else {
          alert(data.error || 'Failed to create QR code');
        }
      } catch (e) {
        alert('Failed to create QR code');
      }
    });
  }
})();
