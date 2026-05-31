// Chatbot Widget - Embeddable chat bubble
// CHATBOT_CONFIG is injected by the embed script

var widgetContainer = document.createElement('div');
widgetContainer.id = 'cb-widget-container';

var visitorId = localStorage.getItem('cb_visitor_' + CHATBOT_CONFIG.chatbotId) ||
  'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
localStorage.setItem('cb_visitor_' + CHATBOT_CONFIG.chatbotId, visitorId);

var isOpen = false;

var styles = document.createElement('style');
styles.textContent = '#cb-widget-container{position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
  '#cb-bubble{width:60px;height:60px;border-radius:50%;background:' + CHATBOT_CONFIG.themeColor + ';cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.2s}' +
  '#cb-bubble:hover{transform:scale(1.1)}' +
  '#cb-bubble svg{width:28px;height:28px;fill:#fff}' +
  '#cb-chat{display:none;position:absolute;bottom:70px;right:0;width:360px;height:500px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);overflow:hidden;flex-direction:column}' +
  '#cb-chat.open{display:flex}' +
  '#cb-chat-header{background:' + CHATBOT_CONFIG.themeColor + ';color:#fff;padding:16px;display:flex;align-items:center;justify-content:space-between}' +
  '#cb-chat-header h4{margin:0;font-size:16px}' +
  '#cb-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer}' +
  '#cb-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}' +
  '.cb-msg{max-width:80%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.4;word-wrap:break-word}' +
  '.cb-msg.bot{background:#f1f3f5;color:#333;align-self:flex-start;border-bottom-left-radius:4px}' +
  '.cb-msg.visitor{background:' + CHATBOT_CONFIG.themeColor + ';color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
  '#cb-input-area{display:flex;padding:12px;border-top:1px solid #e9ecef;gap:8px}' +
  '#cb-input{flex:1;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:14px;outline:none}' +
  '#cb-input:focus{border-color:' + CHATBOT_CONFIG.themeColor + '}' +
  '#cb-send{background:' + CHATBOT_CONFIG.themeColor + ';color:#fff;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;font-size:14px}' +
  '#cb-send:hover{opacity:0.9}';
document.head.appendChild(styles);

widgetContainer.innerHTML = '<div id="cb-chat">' +
  '<div id="cb-chat-header"><h4>' + CHATBOT_CONFIG.name + '</h4><button id="cb-close">&times;</button></div>' +
  '<div id="cb-messages"></div>' +
  '<div id="cb-input-area"><input id="cb-input" type="text" placeholder="Type a message..." autocomplete="off"><button id="cb-send">Send</button></div>' +
  '</div>' +
  '<div id="cb-bubble"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></div>';

document.body.appendChild(widgetContainer);

var bubble = document.getElementById('cb-bubble');
var chatPanel = document.getElementById('cb-chat');
var closeBtn = document.getElementById('cb-close');
var messagesDiv = document.getElementById('cb-messages');
var inputField = document.getElementById('cb-input');
var sendBtn = document.getElementById('cb-send');

function addMessage(content, role) {
  var msg = document.createElement('div');
  msg.className = 'cb-msg ' + role;
  msg.textContent = content;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function toggleChat() {
  isOpen = !isOpen;
  if (isOpen) {
    chatPanel.classList.add('open');
    if (messagesDiv.children.length === 0) {
      addMessage(CHATBOT_CONFIG.welcomeMessage, 'bot');
    }
    inputField.focus();
  } else {
    chatPanel.classList.remove('open');
  }
}

function sendMessage() {
  var text = inputField.value.trim();
  if (!text) return;

  addMessage(text, 'visitor');
  inputField.value = '';

  var xhr = new XMLHttpRequest();
  xhr.open('POST', CHATBOT_CONFIG.apiUrl + '/widget/api/' + CHATBOT_CONFIG.chatbotId + '/message');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    if (xhr.status === 200) {
      var data = JSON.parse(xhr.responseText);
      addMessage(data.response, 'bot');
    } else {
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
    }
  };
  xhr.onerror = function() {
    addMessage('Sorry, I could not connect. Please try again.', 'bot');
  };
  xhr.send(JSON.stringify({ message: text, visitor_id: visitorId }));
}

bubble.addEventListener('click', toggleChat);
closeBtn.addEventListener('click', toggleChat);
sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage();
});
