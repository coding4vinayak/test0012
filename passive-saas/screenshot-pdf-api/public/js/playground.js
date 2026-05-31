document.addEventListener('DOMContentLoaded', () => {
  const endpointSelect = document.getElementById('endpoint-select');
  const screenshotFields = document.getElementById('screenshot-fields');
  const pdfFields = document.getElementById('pdf-fields');
  const pdfSource = document.getElementById('pdf-source');
  const pdfHtmlGroup = document.getElementById('pdf-html-group');
  const pdfUrlGroup = document.getElementById('pdf-url-group');
  const sendBtn = document.getElementById('send-request');
  const responseStatus = document.getElementById('response-status');
  const responseTime = document.getElementById('response-time');
  const responseSize = document.getElementById('response-size');
  const responseOutput = document.getElementById('response-output');

  endpointSelect.addEventListener('change', () => {
    if (endpointSelect.value === 'screenshot') {
      screenshotFields.style.display = 'block';
      pdfFields.style.display = 'none';
    } else {
      screenshotFields.style.display = 'none';
      pdfFields.style.display = 'block';
    }
  });

  pdfSource.addEventListener('change', () => {
    if (pdfSource.value === 'html') {
      pdfHtmlGroup.style.display = 'block';
      pdfUrlGroup.style.display = 'none';
    } else {
      pdfHtmlGroup.style.display = 'none';
      pdfUrlGroup.style.display = 'block';
    }
  });

  sendBtn.addEventListener('click', async () => {
    const apiKey = document.getElementById('api-key-select').value;
    const endpoint = endpointSelect.value;

    if (!apiKey) {
      alert('Please select an API key');
      return;
    }

    let url, body;

    if (endpoint === 'screenshot') {
      url = '/api/screenshot';
      body = {
        url: document.getElementById('screenshot-url').value,
        width: parseInt(document.getElementById('viewport-width').value),
        height: parseInt(document.getElementById('viewport-height').value),
        format: document.getElementById('format-select').value
      };
    } else {
      url = '/api/pdf';
      body = {
        title: document.getElementById('pdf-title').value,
        pageSize: document.getElementById('page-size').value,
        orientation: document.getElementById('orientation').value
      };

      if (pdfSource.value === 'html') {
        body.html = document.getElementById('pdf-html').value;
      } else {
        body.url = document.getElementById('pdf-url').value;
      }
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    responseOutput.innerHTML = '<p class="placeholder-text">Loading...</p>';

    const startTime = Date.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(body)
      });

      const elapsed = Date.now() - startTime;
      responseTime.textContent = `${elapsed}ms`;

      if (res.ok) {
        responseStatus.textContent = `${res.status} OK`;
        responseStatus.className = 'badge badge-success';

        const contentType = res.headers.get('Content-Type');

        if (contentType && contentType.includes('image')) {
          const blob = await res.blob();
          responseSize.textContent = `${(blob.size / 1024).toFixed(1)} KB`;
          const imgUrl = URL.createObjectURL(blob);
          responseOutput.innerHTML = `<img src="${imgUrl}" alt="Screenshot" style="max-width:100%">`;
        } else if (contentType && contentType.includes('pdf')) {
          const blob = await res.blob();
          responseSize.textContent = `${(blob.size / 1024).toFixed(1)} KB`;
          const pdfUrl = URL.createObjectURL(blob);
          responseOutput.innerHTML = `<p>PDF generated successfully</p><a href="${pdfUrl}" download="document.pdf" class="btn btn-primary">Download PDF</a>`;
        } else {
          const data = await res.text();
          responseSize.textContent = `${data.length} bytes`;
          responseOutput.innerHTML = `<pre><code>${data}</code></pre>`;
        }
      } else {
        const data = await res.json();
        responseStatus.textContent = `${res.status} Error`;
        responseStatus.className = 'badge badge-danger';
        responseOutput.innerHTML = `<pre><code>${JSON.stringify(data, null, 2)}</code></pre>`;
      }
    } catch (err) {
      responseStatus.textContent = 'Error';
      responseStatus.className = 'badge badge-danger';
      responseOutput.innerHTML = `<pre><code>${err.message}</code></pre>`;
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Request';
    }
  });
});
