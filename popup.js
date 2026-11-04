const statusEl = document.getElementById('status');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab || !tab.url) {
    setInactive('No active tab found.');
    return;
  }

  const url = tab.url || '';
  if (url.includes('chess.com/play/online')) {
    setActive('No Blitz is active on this tab');
  } else {
    setInactive('Not on chess.com/play/online');
  }
});

function setActive(msg) {
  statusEl.className = 'active';
  statusIcon.textContent = '🟢';
  statusText.textContent = msg;
}

function setInactive(msg) {
  statusEl.className = 'inactive';
  statusIcon.textContent = '⚪';
  statusText.textContent = msg;
}
