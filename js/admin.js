const loginPanel = document.getElementById('login-panel');
const configPanel = document.getElementById('config-panel');
const messagePanel = document.getElementById('message-panel');
const loginForm = document.getElementById('login-form');
const configForm = document.getElementById('config-form');
const messageForm = document.getElementById('message-form');
const logoutBtn = document.getElementById('logout-btn');
const clearMessageBtn = document.getElementById('clear-message-btn');
const statusMessage = document.getElementById('status-message');

const colsInput = document.getElementById('cols');
const rowsInput = document.getElementById('rows');
const durationInput = document.getElementById('api-duration');
const messagesInput = document.getElementById('default-messages');
const passwordInput = document.getElementById('password');
const remoteMessageInput = document.getElementById('remote-message');

loginForm.addEventListener('submit', handleLogin);
configForm.addEventListener('submit', handleSave);
messageForm.addEventListener('submit', handleSendMessage);
logoutBtn.addEventListener('click', handleLogout);
clearMessageBtn.addEventListener('click', handleClearMessage);

void loadAdminConfig();

async function loadAdminConfig() {
  const response = await fetch('/api/admin/config', { credentials: 'same-origin' });

  if (response.status === 401) {
    showLogin();
    return;
  }

  if (!response.ok) {
    const error = await readError(response, 'Unable to load admin configuration.');
    showLogin();
    setStatus(error, 'error');
    return;
  }

  const config = await response.json();
  showConfig(config);
  setStatus('Admin ready.', 'success');
}

async function handleLogin(event) {
  event.preventDefault();
  setStatus('Checking password...');

  const response = await fetch('/api/admin/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ password: passwordInput.value }),
  });

  if (!response.ok) {
    setStatus(await readError(response, 'Login failed.'), 'error');
    return;
  }

  passwordInput.value = '';
  await loadAdminConfig();
}

async function handleSave(event) {
  event.preventDefault();

  let parsedMessages;
  try {
    parsedMessages = JSON.parse(messagesInput.value);
  } catch {
    setStatus('Default messages must be valid JSON.', 'error');
    return;
  }

  const payload = {
    cols: Number(colsInput.value),
    rows: Number(rowsInput.value),
    apiMessageDurationSeconds: Number(durationInput.value),
    defaultMessages: parsedMessages,
  };

  setStatus('Saving configuration...');

  const response = await fetch('/api/admin/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    setStatus(await readError(response, 'Save failed.'), 'error');
    return;
  }

  const config = await response.json();
  showConfig(config);
  setStatus('Configuration saved. Display pages will refresh automatically.', 'success');
}

async function handleLogout() {
  await fetch('/api/admin/session', {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  showLogin();
  remoteMessageInput.value = '';
  setStatus('Logged out.');
}

async function handleSendMessage(event) {
  event.preventDefault();

  const message = remoteMessageInput.value.trim();
  if (!message) {
    setStatus('Enter a message before sending it.', 'error');
    return;
  }

  setStatus('Sending remote message...');

  const response = await fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    setStatus(await readError(response, 'Unable to send the remote message.'), 'error');
    return;
  }

  setStatus('Remote message sent.', 'success');
}

async function handleClearMessage() {
  setStatus('Clearing active override...');

  const response = await fetch('/api/message', {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    setStatus(await readError(response, 'Unable to clear the remote message.'), 'error');
    return;
  }

  setStatus('Remote override cleared.', 'success');
}

function showLogin() {
  loginPanel.classList.remove('hidden');
  configPanel.classList.add('hidden');
  messagePanel.classList.add('hidden');
}

function showConfig(config) {
  loginPanel.classList.add('hidden');
  configPanel.classList.remove('hidden');
  messagePanel.classList.remove('hidden');

  colsInput.value = String(config.cols);
  rowsInput.value = String(config.rows);
  durationInput.value = String(config.apiMessageDurationSeconds);
  messagesInput.value = JSON.stringify(config.defaultMessages, null, 2);
}

function setStatus(message, kind = '') {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message';
  if (kind) {
    statusMessage.classList.add(kind);
  }
}

async function readError(response, fallback) {
  try {
    const payload = await response.json();
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}
