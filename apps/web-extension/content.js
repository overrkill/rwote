// content.js — Action Triggers Only
// No business logic - sends messages to background.js

let lastSentText = '';

// Listen for text selection via keyboard shortcut Alt+S
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 's') {
    const selected = window.getSelection().toString().trim();
    if (selected && selected !== lastSentText) {
      lastSentText = selected;
      chrome.runtime.sendMessage({
        type: 'TEXT_SELECTION',
        text: selected
      }).catch(() => {});
    }
  }
});

// Extract visible chat text from Claude's UI
function extractChatText() {
  const selectors = [
    '[data-testid="user-message"]',
    '.font-claude-message',
    '[class*="prose"]',
    '.whitespace-pre-wrap',
    'p'
  ];

  let texts = [];

  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      els.forEach(el => {
        const t = el.innerText?.trim();
        if (t && t.length > 20) texts.push(t);
      });
      if (texts.length > 5) break;
    }
  }

  const combined = [...new Set(texts)].join(' ').slice(0, 8000);
  return combined;
}

// Send chat text periodically so side panel can match entries
function syncChatText() {
  if (!document.location.hostname.includes('claude.ai')) return;
  const text = extractChatText();
  if (text.length > 50) {
    chrome.runtime.sendMessage({
      type: 'CHAT_TEXT',
      text
    }).catch(() => {});
  }
}

// Sync on load and on DOM changes (new messages)
syncChatText();

let syncTimer = null;
const observer = new MutationObserver(() => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncChatText, 1200);
});
observer.observe(document.body, { childList: true, subtree: true });
