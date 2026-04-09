// sidepanel.js

const STORAGE_KEY = 'dsa_insights_v1';

const TAGS = [
  'all', 'general', 'arrays', 'strings', 'sliding-window',
  'prefix-sum', 'hashing', 'trees', 'graphs', 'dp',
  'sorting', 'backtracking', 'binary-search', 'heaps', 'tries'
];

const TAG_LABELS = {
  'all': 'All', 'general': 'General', 'arrays': 'Arrays',
  'strings': 'Strings', 'sliding-window': 'Sliding window',
  'prefix-sum': 'Prefix sum', 'hashing': 'Hashing', 'trees': 'Trees',
  'graphs': 'Graphs', 'dp': 'DP', 'sorting': 'Sorting',
  'backtracking': 'Backtracking', 'binary-search': 'Binary search',
  'heaps': 'Heaps', 'tries': 'Tries'
};

// ── State ──────────────────────────────────────────
let notes = [];
let activeTag = 'all';
let searchQuery = '';
let chatText = '';
let chatMatchIds = new Set();

// ── DOM refs ───────────────────────────────────────
const notesEl      = document.getElementById('notes');
const filtersEl    = document.getElementById('filters');
const searchEl     = document.getElementById('search');
const clearSearchEl= document.getElementById('clear-search');
const countEl      = document.getElementById('note-count');
const bannerEl     = document.getElementById('chat-banner');
const bannerTextEl = document.getElementById('chat-banner-text');
const inputText    = document.getElementById('input-text');
const inputNote    = document.getElementById('input-note');
const inputTag     = document.getElementById('input-tag');
const saveBtn      = document.getElementById('save-btn');

// ── Storage ────────────────────────────────────────
async function load() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, (res) => {
      notes = res[STORAGE_KEY] || [];
      resolve();
    });
  });
}

function save() {
  chrome.storage.local.set({ [STORAGE_KEY]: notes });
}

// ── Chat match ─────────────────────────────────────
function updateChatMatches() {
  chatMatchIds.clear();
  if (!chatText) return;

  const chatLower = chatText.toLowerCase();
  notes.forEach(n => {
    const words = n.text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matchCount = words.filter(w => chatLower.includes(w)).length;
    if (matchCount >= 2 || (words.length === 1 && matchCount === 1)) {
      chatMatchIds.add(n.id);
    }
  });
}

function updateChatBanner() {
  const count = chatMatchIds.size;
  if (count === 0) {
    bannerEl.style.display = 'none';
  } else {
    bannerEl.style.display = 'flex';
    bannerTextEl.textContent = `${count} note${count !== 1 ? 's' : ''} match this chat`;
  }
}

// ── Render ─────────────────────────────────────────
function highlight(text, query) {
  if (!query) return escHtml(text);
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escHtml(text).replace(
    new RegExp(`(${esc})`, 'gi'),
    '<mark>$1</mark>'
  );
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getFiltered() {
  let result = [...notes];

  if (activeTag !== 'all') {
    result = result.filter(n => n.tag === activeTag);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(n =>
      n.text.toLowerCase().includes(q) ||
      (n.note && n.note.toLowerCase().includes(q)) ||
      n.tag.toLowerCase().includes(q)
    );
  }

  return result;
}

function renderFilters() {
  filtersEl.innerHTML = TAGS.map(t => `
    <button class="chip${activeTag === t ? ' active' : ''}" data-tag="${t}">
      ${TAG_LABELS[t]}
    </button>
  `).join('');

  filtersEl.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag;
      renderAll();
    });
  });
}

function renderNotes() {
  const filtered = getFiltered();
  countEl.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    const msg = searchQuery
      ? `No notes match "<strong>${escHtml(searchQuery)}</strong>"`
      : activeTag !== 'all'
        ? `No notes in <strong>${TAG_LABELS[activeTag]}</strong> yet`
        : `<strong>No notes yet</strong>\nSelect text and right-click → Save to DSA Insights\nor type below and hit Save`;
    notesEl.innerHTML = `<div class="empty">${msg}</div>`;
    return;
  }

  notesEl.innerHTML = filtered.map(n => {
    const isMatch = chatMatchIds.has(n.id);
    return `
    <div class="card${isMatch ? ' chat-match' : ''}" data-id="${n.id}">
      <div class="card-body">
        <span class="card-tag tag-${n.tag}">${TAG_LABELS[n.tag] || n.tag}</span>
        <div class="card-text">${highlight(n.text, searchQuery)}</div>
        ${n.note ? `<div class="card-note">${highlight(n.note, searchQuery)}</div>` : ''}
        <div class="card-meta">
          <span class="card-date">${n.date}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-btn copy" data-id="${n.id}" title="Copy">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/>
            <path d="M3 11H2a1 1 0 01-1-1V2a1 1 0 011-1h8a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="card-btn del" data-id="${n.id}" title="Delete">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    `;
  }).join('');

  // Event delegation
  notesEl.querySelectorAll('.card-btn.del').forEach(btn => {
    btn.addEventListener('click', () => deleteNote(Number(btn.dataset.id)));
  });
  notesEl.querySelectorAll('.card-btn.copy').forEach(btn => {
    btn.addEventListener('click', () => copyNote(Number(btn.dataset.id)));
  });
}

function renderAll() {
  renderFilters();
  renderNotes();
  updateChatBanner();
}

// ── Actions ────────────────────────────────────────
function addNote(text, noteText, tag) {
  const now = new Date();
  const date = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const note = {
    id: Date.now(),
    text: text.trim(),
    note: noteText.trim(),
    tag,
    date
  };
  notes.unshift(note);
  save();
  updateChatMatches();
  renderAll();
  showToast('Saved');
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  chatMatchIds.delete(id);
  save();
  renderAll();
}

function copyNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  const text = note.note ? `${note.text}\n\n${note.note}` : note.text;
  navigator.clipboard.writeText(text).then(() => showToast('Copied'));
}

// ── Toast ──────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ── Event listeners ────────────────────────────────
saveBtn.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) { inputText.focus(); return; }
  addNote(text, inputNote.value, inputTag.value);
  inputText.value = '';
  inputNote.value = '';
});

inputText.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    saveBtn.click();
  }
});

searchEl.addEventListener('input', () => {
  searchQuery = searchEl.value.trim();
  clearSearchEl.classList.toggle('visible', searchQuery.length > 0);
  renderNotes();
});

clearSearchEl.addEventListener('click', () => {
  searchEl.value = '';
  searchQuery = '';
  clearSearchEl.classList.remove('visible');
  renderNotes();
  searchEl.focus();
});

// ── Message listener (from background/content) ─────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CHAT_TEXT') {
    chatText = message.text || '';
    updateChatMatches();
    updateChatBanner();
    // Re-render notes to update chat-match highlights
    renderNotes();
  }

  if (message.type === 'SAVE_SELECTION') {
    const text = message.text?.trim();
    if (text) {
      inputText.value = text;
      inputText.focus();
      showToast('Text ready — add context and save');
      // Scroll to bottom to show input
      inputText.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

// Check for pending selection (set when panel wasn't open yet)
chrome.storage.session.get('pendingSelection', (res) => {
  if (res.pendingSelection) {
    inputText.value = res.pendingSelection;
    chrome.storage.session.remove('pendingSelection');
    showToast('Text ready — add context and save');
  }
});

// ── Init ───────────────────────────────────────────
load().then(() => {
  updateChatMatches();
  renderAll();
});
