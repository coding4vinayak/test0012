// Flow Builder JS - handles flow CRUD and drag-and-drop positioning

(function() {
  var flowTriggerInput = document.getElementById('flow-trigger');
  var flowResponseInput = document.getElementById('flow-response');
  var flowNextSelect = document.getElementById('flow-next');
  var flowIdInput = document.getElementById('flow-id');
  var formTitle = document.getElementById('form-title');
  var saveBtn = document.getElementById('save-flow-btn');
  var cancelBtn = document.getElementById('cancel-flow-btn');
  var canvasArea = document.getElementById('canvas-area');
  var flowCountSpan = document.querySelector('.flow-count');

  var draggedNode = null;
  var dragOffsetX = 0;
  var dragOffsetY = 0;

  function updateFlowSelect() {
    flowNextSelect.innerHTML = '<option value="">None</option>';
    FLOWS.forEach(function(flow) {
      var opt = document.createElement('option');
      opt.value = flow.id;
      opt.textContent = flow.trigger + ' (#' + flow.id + ')';
      flowNextSelect.appendChild(opt);
    });
  }

  function resetForm() {
    flowIdInput.value = '';
    flowTriggerInput.value = '';
    flowResponseInput.value = '';
    flowNextSelect.value = '';
    formTitle.textContent = 'Add New Flow';
    cancelBtn.style.display = 'none';
    saveBtn.textContent = 'Save Flow';
  }

  function renderFlows() {
    canvasArea.innerHTML = '';
    if (FLOWS.length === 0) {
      canvasArea.innerHTML = '<div class="empty-canvas"><p>No flows yet. Add your first flow using the form on the left.</p></div>';
    }
    FLOWS.forEach(function(flow, index) {
      var node = document.createElement('div');
      node.className = 'flow-node';
      node.id = 'flow-' + flow.id;
      node.setAttribute('data-id', flow.id);
      node.style.left = (flow.position_x || (50 + index * 20)) + 'px';
      node.style.top = (flow.position_y || (50 + index * 100)) + 'px';
      node.draggable = true;

      var responsePreview = flow.response.length > 80 ? flow.response.substring(0, 80) + '...' : flow.response;
      var chainHtml = flow.next_flow_id ? '<div class="flow-node-footer"><span class="flow-chain">Chains to flow #' + flow.next_flow_id + '</span></div>' : '';

      node.innerHTML = '<div class="flow-node-header">' +
        '<span class="flow-trigger-label">' + escapeHtml(flow.trigger) + '</span>' +
        '<div class="flow-node-actions">' +
        '<button class="btn-icon edit-flow" data-id="' + flow.id + '">&#9998;</button>' +
        '<button class="btn-icon delete-flow" data-id="' + flow.id + '">&#10005;</button>' +
        '</div></div>' +
        '<div class="flow-node-body"><p>' + escapeHtml(responsePreview) + '</p></div>' +
        chainHtml;

      canvasArea.appendChild(node);
    });
    flowCountSpan.textContent = FLOWS.length + ' flows';
    updateFlowSelect();
    attachNodeEvents();
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function attachNodeEvents() {
    document.querySelectorAll('.edit-flow').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'));
        editFlow(id);
      });
    });

    document.querySelectorAll('.delete-flow').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'));
        if (confirm('Delete this flow?')) {
          deleteFlow(id);
        }
      });
    });

    // Drag and drop for positioning
    document.querySelectorAll('.flow-node').forEach(function(node) {
      node.addEventListener('mousedown', function(e) {
        if (e.target.closest('.btn-icon')) return;
        draggedNode = node;
        var rect = node.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        node.style.zIndex = '100';
        e.preventDefault();
      });
    });
  }

  document.addEventListener('mousemove', function(e) {
    if (!draggedNode) return;
    var canvasRect = canvasArea.getBoundingClientRect();
    var x = e.clientX - canvasRect.left - dragOffsetX;
    var y = e.clientY - canvasRect.top - dragOffsetY;
    draggedNode.style.left = Math.max(0, x) + 'px';
    draggedNode.style.top = Math.max(0, y) + 'px';
  });

  document.addEventListener('mouseup', function() {
    if (!draggedNode) return;
    draggedNode.style.zIndex = '';
    var id = parseInt(draggedNode.getAttribute('data-id'));
    var x = parseInt(draggedNode.style.left);
    var y = parseInt(draggedNode.style.top);

    // Update position on server
    var flow = FLOWS.find(function(f) { return f.id === id; });
    if (flow) {
      flow.position_x = x;
      flow.position_y = y;
      fetch('/chatbots/' + CHATBOT_ID + '/flows/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: flow.trigger,
          response: flow.response,
          next_flow_id: flow.next_flow_id,
          position_x: x,
          position_y: y
        })
      });
    }
    draggedNode = null;
  });

  function editFlow(id) {
    var flow = FLOWS.find(function(f) { return f.id === id; });
    if (!flow) return;

    flowIdInput.value = flow.id;
    flowTriggerInput.value = flow.trigger;
    flowResponseInput.value = flow.response;
    flowNextSelect.value = flow.next_flow_id || '';
    formTitle.textContent = 'Edit Flow';
    cancelBtn.style.display = 'inline-block';
    saveBtn.textContent = 'Update Flow';
  }

  function deleteFlow(id) {
    fetch('/chatbots/' + CHATBOT_ID + '/flows/' + id, { method: 'DELETE' })
      .then(function(res) { return res.json(); })
      .then(function() {
        FLOWS = FLOWS.filter(function(f) { return f.id !== id; });
        renderFlows();
      });
  }

  saveBtn.addEventListener('click', function() {
    var trigger = flowTriggerInput.value.trim();
    var response = flowResponseInput.value.trim();
    var nextFlowId = flowNextSelect.value || null;
    var editId = flowIdInput.value;

    if (!trigger || !response) {
      alert('Trigger and response are required.');
      return;
    }

    var payload = {
      trigger: trigger,
      response: response,
      next_flow_id: nextFlowId ? parseInt(nextFlowId) : null,
      position_x: 50,
      position_y: 50 + FLOWS.length * 100
    };

    if (editId) {
      // Update existing flow
      var existingFlow = FLOWS.find(function(f) { return f.id === parseInt(editId); });
      if (existingFlow) {
        payload.position_x = existingFlow.position_x;
        payload.position_y = existingFlow.position_y;
      }
      fetch('/chatbots/' + CHATBOT_ID + '/flows/' + editId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res) { return res.json(); })
      .then(function(flow) {
        var idx = FLOWS.findIndex(function(f) { return f.id === flow.id; });
        if (idx >= 0) FLOWS[idx] = flow;
        renderFlows();
        resetForm();
      });
    } else {
      // Create new flow
      fetch('/chatbots/' + CHATBOT_ID + '/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res) { return res.json(); })
      .then(function(flow) {
        FLOWS.push(flow);
        renderFlows();
        resetForm();
      });
    }
  });

  cancelBtn.addEventListener('click', resetForm);

  // Initialize
  updateFlowSelect();
  attachNodeEvents();
})();
