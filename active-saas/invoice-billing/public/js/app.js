// Dynamic line items for invoice creation
document.addEventListener('DOMContentLoaded', function() {
  const lineItemsContainer = document.getElementById('line-items');
  const addItemBtn = document.getElementById('add-item');
  const invoiceTotal = document.getElementById('invoice-total');

  if (!lineItemsContainer) return;

  // Add new line item
  addItemBtn.addEventListener('click', function() {
    const lineItem = document.createElement('div');
    lineItem.className = 'line-item';
    lineItem.innerHTML = `
      <div class="line-item-fields">
        <input type="text" name="items[description][]" placeholder="Description" required>
        <input type="number" name="items[quantity][]" placeholder="Qty" min="0" step="any" value="1" required>
        <input type="number" name="items[rate][]" placeholder="Rate" min="0" step="0.01" required>
        <span class="line-amount">$0.00</span>
        <button type="button" class="btn btn-small btn-danger remove-item">X</button>
      </div>
    `;
    lineItemsContainer.appendChild(lineItem);
    attachListeners(lineItem);
  });

  // Remove line item
  lineItemsContainer.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-item')) {
      const items = lineItemsContainer.querySelectorAll('.line-item');
      if (items.length > 1) {
        e.target.closest('.line-item').remove();
        calculateTotal();
      }
    }
  });

  // Calculate line amount and total
  function attachListeners(item) {
    const qtyInput = item.querySelector('input[name="items[quantity][]"]');
    const rateInput = item.querySelector('input[name="items[rate][]"]');

    [qtyInput, rateInput].forEach(input => {
      input.addEventListener('input', function() {
        calculateLineAmount(item);
        calculateTotal();
      });
    });
  }

  function calculateLineAmount(item) {
    const qty = parseFloat(item.querySelector('input[name="items[quantity][]"]').value) || 0;
    const rate = parseFloat(item.querySelector('input[name="items[rate][]"]').value) || 0;
    const amount = qty * rate;
    item.querySelector('.line-amount').textContent = '$' + amount.toFixed(2);
  }

  function calculateTotal() {
    const items = lineItemsContainer.querySelectorAll('.line-item');
    let total = 0;
    items.forEach(item => {
      const qty = parseFloat(item.querySelector('input[name="items[quantity][]"]').value) || 0;
      const rate = parseFloat(item.querySelector('input[name="items[rate][]"]').value) || 0;
      total += qty * rate;
    });
    invoiceTotal.textContent = '$' + total.toFixed(2);
  }

  // Attach listeners to existing items
  lineItemsContainer.querySelectorAll('.line-item').forEach(attachListeners);

  // Set default due date to 30 days from now
  const dueDateInput = document.getElementById('due_date');
  if (dueDateInput && !dueDateInput.value) {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    dueDateInput.value = date.toISOString().split('T')[0];
  }
});
