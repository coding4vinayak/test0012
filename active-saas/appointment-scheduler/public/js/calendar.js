document.addEventListener('DOMContentLoaded', function() {
  const script = document.querySelector('script[data-provider-id]');
  if (!script) return;

  const providerId = script.getAttribute('data-provider-id');
  const dateInput = document.getElementById('date');
  const slotsContainer = document.getElementById('slots-container');
  const startTimeInput = document.getElementById('start_time');
  const endTimeInput = document.getElementById('end_time');
  const serviceInputs = document.querySelectorAll('input[name="service_id"]');

  // Set minimum date to today
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  if (dateInput) {
    dateInput.setAttribute('min', todayStr);
  }

  function getSelectedServiceId() {
    const checked = document.querySelector('input[name="service_id"]:checked');
    return checked ? checked.value : null;
  }

  function loadSlots() {
    const serviceId = getSelectedServiceId();
    const date = dateInput ? dateInput.value : null;

    if (!serviceId || !date) {
      if (slotsContainer) {
        slotsContainer.innerHTML = '<p class="slot-hint">Select a service and date to see available times.</p>';
      }
      return;
    }

    fetch(`/book/${providerId}/slots?service_id=${serviceId}&date=${date}`)
      .then(response => response.json())
      .then(data => {
        if (data.slots.length === 0) {
          slotsContainer.innerHTML = '<p class="slot-hint">No available time slots for this date. Try another day.</p>';
          return;
        }

        let html = '<div class="slots-grid">';
        data.slots.forEach(slot => {
          html += `<button type="button" class="slot-btn" data-start="${slot.start_time}" data-end="${slot.end_time}">${slot.start_time}</button>`;
        });
        html += '</div>';
        slotsContainer.innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.slot-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            startTimeInput.value = this.getAttribute('data-start');
            endTimeInput.value = this.getAttribute('data-end');
          });
        });
      })
      .catch(() => {
        slotsContainer.innerHTML = '<p class="slot-hint">Error loading slots. Please try again.</p>';
      });
  }

  // Event listeners
  serviceInputs.forEach(input => {
    input.addEventListener('change', loadSlots);
  });

  if (dateInput) {
    dateInput.addEventListener('change', loadSlots);
  }

  // Form validation
  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      if (!startTimeInput.value || !endTimeInput.value) {
        e.preventDefault();
        alert('Please select a time slot.');
      }
    });
  }
});
