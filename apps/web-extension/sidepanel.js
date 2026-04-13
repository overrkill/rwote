// sidepanel.js — UI Layer
// No business logic - all operations go through background.js

// ── Constants ────────────────────────────────────────
const COLOR_POOL = [
  { bg: '#deeef7', text: '#3a6f8f' },
  { bg: '#e2f0e2', text: '#3a7040' },
  { bg: '#fce8f3', text: '#8f3a72' },
  { bg: '#fdeee2', text: '#8f5a2a' },
  { bg: '#ede8fb', text: '#5c3a8f' },
  { bg: '#faf0d7', text: '#8a6520' },
  { bg: '#e8f3ee', text: '#2a6e52' },
  { bg: '#fde8e8', text: '#8f3a3a' },
  { bg: '#e8eef8', text: '#3a4e8f' },
  { bg: '#f3f0e8', text: '#7a6840' },
  { bg: '#e8f0f8', text: '#3a608f' },
  { bg: '#f8e8f0', text: '#8f3a60' },
  { bg: '#e8f8f5', text: '#2a7a6a' },
  { bg: '#f0ede8', text: '#6b6158' },
];

const DEFAULT_TAGS = ['note', 'general', 'research', 'uncategorized'];

const ROLE_TAGS = {
  'software-engineer': { name: 'Software Engineer', tags: ['arrays', 'strings', 'trees', 'graphs', 'dp'] },
  'data-scientist': { name: 'Data Scientist', tags: ['statistics', 'visualization', 'pandas', 'ml', 'cleaning'] },
  'frontend-dev': { name: 'Frontend Developer', tags: ['css', 'react', 'performance', 'accessibility', 'responsive'] },
  'backend-dev': { name: 'Backend Developer', tags: ['apis', 'databases', 'auth', 'caching', 'testing'] },
  'devops': { name: 'DevOps Engineer', tags: ['docker', 'ci-cd', 'linux', 'monitoring', 'shell'] },
  'mobile-dev': { name: 'Mobile Developer', tags: ['react-native', 'navigation', 'state', 'performance', 'gestures'] },
  'ml-engineer': { name: 'ML Engineer', tags: ['neural-networks', 'training', 'datasets', 'optimization', 'evaluation'] },
  'security': { name: 'Security Engineer', tags: ['encryption', 'authentication', 'vulnerabilities', 'compliance', 'forensics'] },
  'technical-writer': { name: 'Technical Writer', tags: ['documentation', 'formatting', 'examples', 'readability', 'structure'] },
  'system-designer': { name: 'System Designer', tags: ['scalability', 'load-balancing', 'databases', 'caching', 'microservices'] },
};

// ── UI State ────────────────────────────────────────
let notes = [];
let allTags = [...DEFAULT_TAGS];
let tagColors = {};
let activeTags = new Set();
let searchQuery = '';
let chatText = '';
let chatMatchIds = new Set();
let selectedNoteIndex = -1;
let selectedAutocompleteIndex = -1;
let autocompleteOpen = false;
let autocompleteTags = [];
let user = null;
let subscription = null;
let settings = {};
let mode = 'local';
let onboarded = false;
let aiModeActive = false;

// ── DOM References ───────────────────────────────────
const appEl = document.getElementById('app');
const loaderEl = document.getElementById('loader');
const notesEl = document.getElementById('notes');
const searchEl = document.getElementById('search');
const clearSearchEl = document.getElementById('clear-search');
const countEl = document.getElementById('note-count');
const bannerEl = document.getElementById('chat-banner');
const bannerTextEl = document.getElementById('chat-banner-text');
const inputText = document.getElementById('input-text');
const inputNote = document.getElementById('input-note');
const saveBtn = document.getElementById('save-btn');
const themeToggleEl = document.getElementById('theme-toggle');
const onboardingEl = document.getElementById('onboarding');
const modeGridEl = document.getElementById('mode-grid');
const authSectionEl = document.getElementById('auth-section');
const roleSectionEl = document.getElementById('role-section');
const roleGridEl = document.getElementById('role-grid');
const onboardSkipEl = document.getElementById('onboard-skip');
const onboardConfirmEl = document.getElementById('onboard-confirm');
const authErrorEl = document.getElementById('auth-error');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const hamburgerBtnEl = document.getElementById('hamburger-btn');
const hamburgerMenuEl = document.getElementById('hamburger-menu');
const menuStatsEl = document.getElementById('menu-stats');
const menuExportEl = document.getElementById('menu-export');
const menuImportEl = document.getElementById('menu-import');
const menuLogoutEl = document.getElementById('menu-logout');
const menuLoginEl = document.getElementById('menu-login');
const importFileEl = document.getElementById('import-file');
const menuThemeEl = document.getElementById('menu-theme');
const userProfileEl = document.getElementById('user-profile');
const userAvatarEl = document.getElementById('user-avatar');
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const userDividerEl = document.getElementById('user-divider');
const userStatusEl = document.getElementById('user-status');
const menuSubscriptionEl = document.getElementById('menu-subscription');
const subscriptionModalEl = document.getElementById('subscription-modal');
const subscriptionBackEl = document.getElementById('subscription-back');
const subscriptionCloseEl = document.getElementById('subscription-close');
const statusIconEl = document.getElementById('status-icon');
const statusTextEl = document.getElementById('status-text');
const subscriptionPlansEl = document.getElementById('subscription-plans');
const subscriptionSuccessEl = document.getElementById('subscription-success');
const planMonthlyEl = document.getElementById('plan-monthly');
const planLifetimeEl = document.getElementById('plan-lifetime');
const filterIconBtn = document.getElementById('filter-icon-btn');
const filterInputWrap = document.getElementById('filter-input-wrap');
const filterInputEl = document.getElementById('filter-input');
const filterClearEl = document.getElementById('filter-clear');
const filterBarEl = document.getElementById('filter-bar');
const filterDropdownEl = document.getElementById('filter-dropdown');
const filterChipsEl = document.getElementById('filter-chips');
const tagAutocompleteEl = document.getElementById('tag-autocomplete');
const aiToggleEl = document.getElementById('ai-toggle');
const settingsModalEl = document.getElementById('settings-modal');
const settingsCloseEl = document.getElementById('settings-close');
const menuSettingsEl = document.getElementById('menu-settings');
const aiProviderEl = document.getElementById('ai-provider');
const ollamaSettingsEl = document.getElementById('ollama-settings');
const groqSettingsEl = document.getElementById('groq-settings');
const ollamaUrlEl = document.getElementById('ollama-url');
const ollamaModelEl = document.getElementById('ollama-model');
const testOllamaBtnEl = document.getElementById('test-ollama-btn');
const testResultEl = document.getElementById('test-result');

// ── Helpers ─────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function labelOf(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function colorOf(slug) {
  if (tagColors[slug]) return tagColors[slug];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) & 0xffff;
  const color = COLOR_POOL[hash % COLOR_POOL.length];
  tagColors[slug] = color;
  return color;
}

function stripTags(text) {
  return text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
}

// ── Message API ─────────────────────────────────────
function sendMessage(message) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, resolve);
  });
}

async function refreshState() {
  const state = await sendMessage({ type: 'GET_STATE' });
  notes = state.notes || [];
  allTags = state.tags || [...DEFAULT_TAGS];
  tagColors = state.tagColors || {};
  user = state.user;
  subscription = state.subscription;
  settings = state.settings || {};
  mode = state.mode || 'local';
  onboarded = state.onboarded || false;
  
  // Apply theme
  if (settings.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  
  return state;
}

// ── Toast ───────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
}

// ── Tag Filter ──────────────────────────────────────
function showFilterInput() {
  filterInputWrap.style.display = 'flex';
  filterIconBtn.classList.add('active');
  filterInputEl.focus();
}

function hideFilterInput() {
  filterInputWrap.style.display = 'none';
  filterIconBtn.classList.remove('active');
  filterDropdownEl.classList.remove('open');
  filterInputEl.value = '';
}

function renderFilterChips() {
  if (activeTags.size === 0) {
    filterClearEl.classList.remove('visible');
    filterChipsEl.innerHTML = '';
    filterInputEl.placeholder = 'Filter by tag…';
    return;
  }

  filterClearEl.classList.add('visible');
  filterInputEl.placeholder = '…';

  filterChipsEl.innerHTML = [...activeTags].map(tag => {
    const c = colorOf(tag);
    return `<span class="filter-chip" style="background:${c.bg};color:${c.text}">
      ${escHtml(labelOf(tag))}
      <span class="chip-remove" data-tag="${tag}">×</span>
    </span>`;
  }).join('');

  filterChipsEl.querySelectorAll('.chip-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeTags.delete(btn.dataset.tag);
      renderFilterChips();
      renderNotes();
    });
  });
}

function clearFilter() {
  activeTags.clear();
  filterInputEl.value = '';
  filterClearEl.classList.remove('visible');
  filterChipsEl.innerHTML = '';
  filterInputEl.placeholder = 'Filter by tag…';
  filterIconBtn.classList.remove('active');
  filterDropdownEl.classList.remove('open');
  hideFilterInput();
  renderNotes();
}

function toggleTagFilter(tag) {
  if (activeTags.has(tag)) {
    activeTags.delete(tag);
  } else {
    activeTags.add(tag);
  }
  renderFilterChips();
  renderNotes();
}

function renderTagDropdown(query) {
  let matches;
  if (!query) {
    matches = allTags;
  } else {
    const q = query.toLowerCase();
    matches = allTags.filter(tag => labelOf(tag).toLowerCase().includes(q));
  }

  if (matches.length === 0) {
    filterDropdownEl.innerHTML = '<div class="filter-dropdown-empty">No tags found</div>';
    filterDropdownEl.classList.add('open');
  } else {
    filterDropdownEl.innerHTML = matches.map(tag => {
      const count = notes.filter(n => n.tag === tag).length;
      const isActive = activeTags.has(tag);
      return `<div class="filter-dropdown-item${isActive ? ' active' : ''}" data-tag="${tag}">
        <span>${escHtml(labelOf(tag))}</span>
        <span class="filter-dropdown-count">${count}</span>
      </div>`;
    }).join('');

    filterDropdownEl.classList.add('open');
  }

  filterDropdownEl.querySelectorAll('.filter-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      toggleTagFilter(item.dataset.tag);
      renderTagDropdown(filterInputEl.value.trim());
    });
  });
}

// ── Markdown Rendering ────────────────────────────────
function highlight(text, query) {
  if (!query) return text;
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
}

function renderMarkdown(text) {
  let html = escHtml(text);
  
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
  html = html.replace(/(<blockquote>.*<\/blockquote>)+/g, '<blockquote>$&</blockquote>');
  
  html = html.replace(/\n\n/g, '<p></p>');
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

function processNoteText(text, query = '') {
  const stripped = stripTags(text);
  let rendered = renderMarkdown(stripped);
  if (query) {
    rendered = highlight(rendered, query);
  }
  return rendered;
}

// ── Chat Match ───────────────────────────────────────
function updateChatMatches() {
  chatMatchIds.clear();
  if (!chatText) return;
  const chatLower = chatText.toLowerCase();
  notes.forEach(n => {
    const words = n.text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matchCount = words.filter(w => chatLower.includes(w)).length;
    if (matchCount >= 2 || (words.length === 1 && matchCount === 1)) chatMatchIds.add(n.id);
  });
}

function updateChatBanner() {
  const count = chatMatchIds.size;
  if (count === 0) { bannerEl.style.display = 'none'; return; }
  bannerEl.style.display = 'flex';
  bannerTextEl.textContent = `${count} note${count !== 1 ? 's' : ''} match this chat`;
}

// ── Filter Logic ────────────────────────────────────
function getFiltered() {
  let result = [...notes];
  if (activeTags.size > 0) {
    result = result.filter(n => activeTags.has(n.tag));
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

// ── Render Notes ─────────────────────────────────────
function tagBadgeStyle(slug) {
  const c = colorOf(slug);
  return `style="background:${c.bg};color:${c.text}"`;
}

function renderNotes() {
  const filtered = getFiltered();
  countEl.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
  
  if (selectedNoteIndex >= filtered.length) {
    selectedNoteIndex = filtered.length - 1;
  }

  if (filtered.length === 0) {
    const msg = searchQuery
      ? `No notes match "<strong>${escHtml(searchQuery)}</strong>"`
      : activeTags.size > 0
        ? `No notes match selected tags`
        : `<strong>No notes yet</strong>\nSelect text → right-click → Save to Rwote`;
    notesEl.innerHTML = `<div class="empty">${msg}</div>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return Number(b.id) - Number(a.id);
  });

  notesEl.innerHTML = sorted.map((n, idx) => {
    const isMatch = chatMatchIds.has(n.id);
    const realIndex = filtered.indexOf(n);
    return `
    <div class="card${isMatch ? ' chat-match' : ''}${n.pinned ? ' pinned' : ''}" data-id="${n.id}" data-index="${realIndex}">
      <div class="card-body">
        <span class="card-tag" ${tagBadgeStyle(n.tag)}>${escHtml(labelOf(n.tag))}</span>
        <div class="card-text">${processNoteText(n.text, searchQuery)}</div>
        ${n.note ? `<div class="card-note">${processNoteText(n.note, searchQuery)}</div>` : ''}
        <div class="card-meta"><span class="card-date">${n.date}</span></div>
      </div>
      <div class="card-actions">
        <button class="card-btn pin${n.pinned ? ' active' : ''}" data-id="${n.id}" title="${n.pinned ? 'Unpin' : 'Pin'}">
          ${n.pinned ? '📌' : '📍'}
        </button>
        <button class="card-btn edit" data-id="${n.id}" title="Edit">
          ✏️
        </button>
        <button class="card-btn copy" data-id="${n.id}" title="Copy">
          📋
        </button>
        <button class="card-btn del" data-id="${n.id}" title="Delete">
          ✕
        </button>
      </div>
    </div>`;
  }).join('');

  notesEl.querySelectorAll('.card-btn.del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await sendMessage({ type: 'DELETE_NOTE', id: String(btn.dataset.id) });
      if (res.ok) await refreshState();
      renderAll();
    });
  });
  
  notesEl.querySelectorAll('.card-btn.copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = notes.find(x => x.id === btn.dataset.id);
      if (!n) return;
      const cleanText = stripTags(n.text);
      navigator.clipboard.writeText(n.note ? `${cleanText}\n\n${n.note}` : cleanText)
        .then(() => showToast('Copied'));
    });
  });
  
  notesEl.querySelectorAll('.card-btn.pin').forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await sendMessage({ type: 'TOGGLE_PIN', id: String(btn.dataset.id) });
      if (res.ok) await refreshState();
      renderAll();
    });
  });
  
  notesEl.querySelectorAll('.card-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => showEditModal(String(btn.dataset.id)));
  });
}

function renderAll() {
  updateChatMatches();
  updateChatBanner();
  renderNotes();
  updateUserProfileUI();
}

// ── Edit Modal ───────────────────────────────────────
function showEditModal(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  const html = `<div class="modal-overlay edit-modal-overlay" id="edit-modal-overlay">
    <div class="modal-content edit-modal">
      <div class="modal-header">
        <h3>Edit Note</h3>
        <button class="modal-close" id="edit-modal-close">×</button>
      </div>
      <div class="edit-modal-body">
        <textarea id="edit-text" placeholder="Your note…" rows="4">${escHtml(note.text)}</textarea>
        <textarea id="edit-note" placeholder="Extra context (optional)…" rows="2">${escHtml(note.note || '')}</textarea>
        <div class="edit-modal-actions">
          <button class="edit-cancel" id="edit-cancel">Cancel</button>
          <button class="edit-save" id="edit-save">Save</button>
        </div>
      </div>
    </div>
  </div>`;
  
  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  
  const editTextEl = document.getElementById('edit-text');
  const editNoteEl = document.getElementById('edit-note');
  const editSaveEl = document.getElementById('edit-save');
  
  const closeEditModal = () => overlay.remove();
  
  editSaveEl.addEventListener('click', async () => {
    const res = await sendMessage({
      type: 'UPDATE_NOTE',
      id,
      text: editTextEl.value,
      noteText: editNoteEl.value
    });
    if (res.ok) {
      await refreshState();
      renderAll();
    }
    closeEditModal();
  });
  
  document.getElementById('edit-cancel')?.addEventListener('click', closeEditModal);
  document.getElementById('edit-modal-close')?.addEventListener('click', closeEditModal);
  document.getElementById('edit-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal-overlay') closeEditModal();
  });
  
  editTextEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEditModal();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      editSaveEl.click();
    }
  });
  
  editTextEl.focus();
}

// ── Tag Autocomplete ─────────────────────────────────
function showAutocomplete(query) {
  const q = query.toLowerCase();
  autocompleteTags = allTags.filter(tag => labelOf(tag).toLowerCase().includes(q));
  
  if (autocompleteTags.length === 0) {
    hideAutocomplete();
    return;
  }
  
  selectedAutocompleteIndex = 0;
  autocompleteOpen = true;
  
  tagAutocompleteEl.innerHTML = autocompleteTags.map((tag, idx) => {
    const c = colorOf(tag);
    return `<div class="tag-autocomplete-item${idx === 0 ? ' selected' : ''}" data-tag="${tag}">
      <span style="background:${c.bg};color:${c.text}">${escHtml(labelOf(tag))}</span>
    </div>`;
  }).join('') + `<div class="tag-autocomplete-hint">Press Enter to insert</div>`;
  
  tagAutocompleteEl.classList.add('open');
  
  tagAutocompleteEl.querySelectorAll('.tag-autocomplete-item').forEach(item => {
    item.addEventListener('click', () => insertTag(item.dataset.tag));
  });
}

function updateAutocompleteSelection() {
  tagAutocompleteEl.querySelectorAll('.tag-autocomplete-item').forEach((item, idx) => {
    item.classList.toggle('selected', idx === selectedAutocompleteIndex);
  });
}

function insertTag(tag) {
  const cursorPos = inputText.selectionStart;
  const textBeforeCursor = inputText.value.substring(0, cursorPos);
  const textAfterCursor = inputText.value.substring(cursorPos);
  const hashStart = textBeforeCursor.lastIndexOf('#');
  
  const newTextBefore = textBeforeCursor.substring(0, hashStart) + '#' + tag + ' ';
  inputText.value = newTextBefore + textAfterCursor;
  
  const newCursorPos = newTextBefore.length;
  inputText.setSelectionRange(newCursorPos, newCursorPos);
  hideAutocomplete();
}

function hideAutocomplete() {
  autocompleteOpen = false;
  autocompleteTags = [];
  selectedAutocompleteIndex = -1;
  tagAutocompleteEl.classList.remove('open');
}

// ── Save Button Handler ────────────────────────────────
saveBtn.addEventListener('click', async () => {
  const text = inputText.value.trim();
  if (!text) { inputText.focus(); return; }
  
  hideAutocomplete();
  let finalText = text;
  
  if (aiModeActive && settings.aiProvider !== 'disabled' && text.length > 10) {
    inputText.disabled = true;
    const overlay = document.createElement('div');
    overlay.className = 'ai-overlay';
    overlay.innerHTML = '<div class="spinner-large"></div>';
    inputText.parentElement.style.position = 'relative';
    inputText.parentElement.appendChild(overlay);
    
    try {
      const res = await sendMessage({ type: 'SUMMARIZE', text });
      if (res.summary) {
        finalText = res.summary;
        if (res.tags && res.tags.length > 0) {
          finalText = `#${res.tags[0]} ${finalText}`;
        }
      }
    } catch (e) {
      showToast('Summarize failed: ' + e.message);
    } finally {
      overlay.remove();
      inputText.disabled = false;
      inputText.focus();
    }
  }
  
  const res = await sendMessage({ type: 'ADD_NOTE', text: finalText, noteText: '' });
  if (res.ok) {
    await refreshState();
    renderAll();
    showToast('Saved');
  }
  
  inputText.value = '';
  inputText.focus();
});

inputText.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    saveBtn.click();
  }
  
  if (autocompleteOpen) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, autocompleteTags.length - 1);
      updateAutocompleteSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, 0);
      updateAutocompleteSelection();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (autocompleteTags.length > 0) {
        e.preventDefault();
        const tag = autocompleteTags[selectedAutocompleteIndex >= 0 ? selectedAutocompleteIndex : 0];
        insertTag(tag);
      }
    } else if (e.key === 'Escape') {
      hideAutocomplete();
    }
  }
});

inputText.addEventListener('input', () => {
  const cursorPos = inputText.selectionStart;
  const textBeforeCursor = inputText.value.substring(0, cursorPos);
  const hashMatch = textBeforeCursor.match(/#(\w*)$/);
  
  if (hashMatch) {
    showAutocomplete(hashMatch[1]);
  } else {
    hideAutocomplete();
  }
});

inputText.addEventListener('blur', () => {
  setTimeout(() => hideAutocomplete(), 150);
});

// ── Search ───────────────────────────────────────────
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

// ── Filter Bar Events ────────────────────────────────
filterBarEl.addEventListener('click', () => {
  if (filterInputWrap.style.display === 'none') {
    showFilterInput();
    renderTagDropdown('');
  }
});

filterIconBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showFilterInput();
  renderTagDropdown('');
});

filterInputEl.addEventListener('click', (e) => {
  e.stopPropagation();
  renderTagDropdown(filterInputEl.value.trim());
});

filterInputEl.addEventListener('input', () => {
  renderTagDropdown(filterInputEl.value.trim());
});

filterInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideFilterInput();
});

filterClearEl.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFilter();
});

document.addEventListener('click', (e) => {
  if (!filterBarEl.contains(e.target) && filterDropdownEl.classList.contains('open')) {
    filterDropdownEl.classList.remove('open');
  }
});

// ── Theme ────────────────────────────────────────────
function updateThemeLabel() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const icon = menuThemeEl.querySelector('.theme-icon');
  const text = menuThemeEl.querySelector('.theme-text');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  if (text) text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    settings.theme = 'light';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    settings.theme = 'dark';
  }
  sendMessage({ type: 'UPDATE_SETTINGS', settings });
  updateThemeLabel();
}

// ── User Profile ─────────────────────────────────────
function updateUserProfileUI() {
  if (user) {
    userProfileEl.style.display = 'flex';
    userDividerEl.style.display = 'block';
    menuLogoutEl.style.display = 'flex';
    menuLoginEl.style.display = 'none';
    
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    const initial = name.charAt(0).toUpperCase();
    userAvatarEl.textContent = initial;
    userNameEl.textContent = name;
    userEmailEl.textContent = user.email || '';
    
    updateUserStatus();
  } else {
    userProfileEl.style.display = 'none';
    userDividerEl.style.display = 'none';
    menuLogoutEl.style.display = 'none';
    menuLoginEl.style.display = 'flex';
    userStatusEl.textContent = '';
  }
}

function updateUserStatus() {
  if (!user) {
    userStatusEl.textContent = '';
    userStatusEl.className = 'user-status';
    menuSubscriptionEl.style.display = 'none';
    return;
  }
  
  if (!subscription) {
    userStatusEl.textContent = '';
    menuSubscriptionEl.style.display = 'none';
    return;
  }
  
  const status = subscription.subscription_status;
  const daysLeft = subscription.days_left;
  
  if (status === 'paid') {
    userStatusEl.textContent = '☁️ Pro';
    userStatusEl.className = 'user-status paid';
    menuSubscriptionEl.style.display = 'flex';
  } else if (status === 'trial') {
    userStatusEl.textContent = `Trial · ${daysLeft} days left`;
    userStatusEl.className = 'user-status trial';
    menuSubscriptionEl.style.display = 'flex';
  } else if (status === 'expired') {
    userStatusEl.textContent = '⚠️ Trial expired';
    userStatusEl.className = 'user-status expired';
    menuSubscriptionEl.style.display = 'flex';
  } else {
    userStatusEl.textContent = '';
    menuSubscriptionEl.style.display = 'none';
  }
}

// ── Hamburger Menu ────────────────────────────────────
let menuOpen = false;

function toggleMenu() {
  menuOpen = !menuOpen;
  hamburgerMenuEl.classList.toggle('open', menuOpen);
}

function closeMenu() {
  menuOpen = false;
  hamburgerMenuEl.classList.remove('open');
}

hamburgerBtnEl.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMenu();
});

document.addEventListener('click', (e) => {
  if (menuOpen && !hamburgerMenuEl.contains(e.target)) {
    closeMenu();
  }
});

menuStatsEl.addEventListener('click', () => { closeMenu(); showStatsModal(); });
menuThemeEl.addEventListener('click', () => { closeMenu(); toggleTheme(); });

// ── Export/Import ────────────────────────────────────
function exportNotes() {
  closeMenu();
  const data = {
    version: 1,
    exported: new Date().toISOString().split('T')[0],
    notes,
    tags: allTags,
    colors: tagColors
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rwote-backup-${data.exported}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported');
}

menuExportEl.addEventListener('click', exportNotes);

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.notes && Array.isArray(data.notes)) {
        // Replace notes with imported data
        notes = data.notes;
        if (data.tags) allTags = data.tags;
        if (data.colors) tagColors = data.colors;
        sendMessage({ type: 'UPDATE_NOTE', id: 'import', notes: data.notes }).then(() => {
          refreshState().then(renderAll);
        });
        showToast('Imported');
      } else {
        showToast('Invalid file');
      }
    } catch {
      showToast('Failed to parse');
    }
  };
  reader.readAsText(file);
  importFileEl.value = '';
}

menuImportEl.addEventListener('click', () => { closeMenu(); importFileEl.click(); });
importFileEl.addEventListener('change', handleFileSelect);

// ── Stats Modal ───────────────────────────────────────
function showStatsModal() {
  const byTag = {};
  notes.forEach(n => {
    byTag[n.tag] = (byTag[n.tag] || 0) + 1;
  });
  const sorted = Object.entries(byTag).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(byTag), 1);
  
  const statsHtml = sorted.map(([tag, count]) => {
    const pct = (count / maxCount) * 100;
    return `<div class="stat-row">
      <span class="stat-tag">${escHtml(labelOf(tag))}</span>
      <div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%"></div></div>
      <span class="stat-count">${count}</span>
    </div>`;
  }).join('');

  const html = `<div class="modal-overlay" id="stats-modal">
    <div class="modal-content stats-modal">
      <div class="modal-header">
        <h3>Tag Statistics</h3>
        <button class="modal-close" id="stats-close">×</button>
      </div>
      <div class="stats-body">
        <div class="stats-total">${notes.length} total notes</div>
        ${statsHtml || '<div class="stats-empty">No notes yet</div>'}
      </div>
    </div>
  </div>`;

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('stats-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ── Auth UI ──────────────────────────────────────────
let selectedMode = 'local';
let selectedRole = null;

function renderModeGrid() {
  modeGridEl.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.mode === selectedMode);
  });
  
  if (selectedMode === 'local') {
    authSectionEl.style.display = 'none';
    roleSectionEl.style.display = 'block';
    onboardConfirmEl.textContent = 'Get Started';
    onboardConfirmEl.style.display = 'block';
  } else if (selectedMode === 'cloud') {
    roleSectionEl.style.display = 'none';
    authSectionEl.style.display = 'block';
    onboardConfirmEl.style.display = 'none';
  }
}

function renderRoleGrid() {
  roleGridEl.innerHTML = Object.entries(ROLE_TAGS).map(([slug, data]) => `
    <div class="role-card${selectedRole === slug ? ' selected' : ''}" data-role="${slug}">
      <div class="role-card-name">${data.name}</div>
      <div class="role-card-tags">${data.tags.join(', ')}</div>
    </div>
  `).join('');

  roleGridEl.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedRole = card.dataset.role;
      renderRoleGrid();
    });
  });
}

async function finishOnboarding() {
  if (selectedMode === 'local') {
    await sendMessage({ type: 'SET_MODE', mode: 'local' });
    if (selectedRole && ROLE_TAGS[selectedRole]) {
      // Apply role tags - would need a new message type
    }
  } else {
    await sendMessage({ type: 'SET_MODE', mode: 'cloud' });
  }
  
  await sendMessage({ type: 'SET_ONBOARDED' });
  onboardingEl.style.display = 'none';
  await refreshState();
  renderAll();
}

modeGridEl.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    selectedMode = card.dataset.mode;
    renderModeGrid();
  });
});

onboardSkipEl.addEventListener('click', () => {
  selectedMode = 'local';
  finishOnboarding();
});

onboardConfirmEl.addEventListener('click', () => {
  if (selectedMode === 'cloud') return;
  finishOnboarding();
});

// Auth tab switching
tabLogin?.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  loginForm.style.display = 'flex';
  registerForm.style.display = 'none';
  authErrorEl.textContent = '';
});

tabRegister?.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  registerForm.style.display = 'flex';
  loginForm.style.display = 'none';
  authErrorEl.textContent = '';
});

// Auth form submissions
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErrorEl.textContent = '';
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  const submitBtn = loginForm.querySelector('.auth-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  
  const res = await sendMessage({ type: 'SIGN_IN', email, password });
  
  submitBtn.disabled = false;
  submitBtn.textContent = 'Sign In';
  
  if (res.error) {
    authErrorEl.textContent = res.error;
    return;
  }
  
  if (res.ok) {
    await refreshState();
    finishOnboarding();
    showToast('Welcome back!');
  }
});

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErrorEl.textContent = '';
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const name = document.getElementById('register-name').value;
  
  const submitBtn = registerForm.querySelector('.auth-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';
  
  const res = await sendMessage({ type: 'SIGN_UP', email, password, name });
  
  submitBtn.disabled = false;
  submitBtn.textContent = 'Create Account';
  
  if (res.error) {
    authErrorEl.textContent = res.error;
    return;
  }
  
  if (res.ok) {
    await refreshState();
    finishOnboarding();
    showToast('Account created!');
  }
});

// ── Subscription Modal ──────────────────────────────
function showSubscriptionModal() {
  closeMenu();
  subscriptionModalEl.style.display = 'flex';
  updateSubscriptionModal();
}

function updateSubscriptionModal() {
  if (!subscription) {
    statusIconEl.textContent = '☁️';
    statusTextEl.textContent = 'Loading...';
    subscriptionPlansEl.classList.remove('visible');
    subscriptionSuccessEl.style.display = 'none';
    return;
  }
  
  const status = subscription.subscription_status;
  const daysLeft = subscription.days_left;
  
  if (status === 'paid') {
    statusIconEl.textContent = '✓';
    statusTextEl.textContent = "You're subscribed to Pro!";
    statusTextEl.className = 'status-text paid';
    subscriptionPlansEl.classList.remove('visible');
    subscriptionSuccessEl.style.display = 'block';
  } else if (status === 'trial') {
    statusIconEl.textContent = '☁️';
    statusTextEl.innerHTML = `Trial Period<br><span style="font-size:0.85em">${daysLeft} days remaining</span>`;
    statusTextEl.className = 'status-text trial';
    subscriptionPlansEl.classList.add('visible');
    subscriptionSuccessEl.style.display = 'none';
    planMonthlyEl.style.display = 'block';
    planLifetimeEl.style.display = 'block';
  } else if (status === 'expired') {
    statusIconEl.textContent = '⚠️';
    statusTextEl.textContent = 'Trial expired';
    statusTextEl.className = 'status-text expired';
    subscriptionPlansEl.classList.add('visible');
    subscriptionSuccessEl.style.display = 'none';
    planMonthlyEl.style.display = 'block';
    planLifetimeEl.style.display = 'block';
  }
}

async function handleUpgrade(plan) {
  planMonthlyEl.disabled = true;
  planLifetimeEl.disabled = true;
  planMonthlyEl.textContent = 'Processing...';
  planLifetimeEl.textContent = 'Processing...';
  
  const res = await sendMessage({ type: 'SUBSCRIBE', plan });
  
  if (res.error) {
    showToast('Failed: ' + res.error);
  } else {
    subscription.subscription_status = 'paid';
    updateUserStatus();
    updateSubscriptionModal();
    showToast('Upgraded to Pro!');
  }
  
  planMonthlyEl.disabled = false;
  planLifetimeEl.disabled = false;
  planMonthlyEl.innerHTML = 'Monthly — <span class="plan-price">$5/mo</span>';
  planLifetimeEl.innerHTML = 'Lifetime — <span class="plan-price">$30</span>';
}

subscriptionBackEl.addEventListener('click', () => subscriptionModalEl.style.display = 'none');
subscriptionCloseEl.addEventListener('click', () => subscriptionModalEl.style.display = 'none');
subscriptionModalEl.addEventListener('click', (e) => {
  if (e.target === subscriptionModalEl) subscriptionModalEl.style.display = 'none';
});
planMonthlyEl.addEventListener('click', () => handleUpgrade('monthly'));
planLifetimeEl.addEventListener('click', () => handleUpgrade('lifetime'));

menuSubscriptionEl.addEventListener('click', showSubscriptionModal);

// ── Logout/Login ─────────────────────────────────────
async function handleLogout() {
  closeMenu();
  await sendMessage({ type: 'SIGN_OUT' });
  user = null;
  subscription = null;
  updateUserProfileUI();
  showToast('Signed out');
}

menuLogoutEl.addEventListener('click', handleLogout);
menuLoginEl.addEventListener('click', () => {
  closeMenu();
  selectedMode = 'cloud';
  renderModeGrid();
  onboardingEl.style.display = 'flex';
});

// ── Settings Modal ───────────────────────────────────
function showSettingsModal() {
  closeMenu();
  loadSettings();
  settingsModalEl.style.display = 'flex';
}

function closeSettingsModal() {
  settingsModalEl.style.display = 'none';
}

function loadSettings() {
  if (aiProviderEl) aiProviderEl.value = settings.aiProvider || 'disabled';
  if (ollamaUrlEl) ollamaUrlEl.value = settings.ollamaUrl || 'http://localhost:11434';
  if (ollamaModelEl) ollamaModelEl.value = settings.ollamaModel || 'llama3.2';
  updateProviderSettings();
}

function updateProviderSettings() {
  const provider = aiProviderEl?.value || 'disabled';
  
  if (provider === 'ollama') {
    ollamaSettingsEl.style.display = 'block';
    groqSettingsEl.style.display = 'none';
  } else if (provider === 'groq') {
    ollamaSettingsEl.style.display = 'none';
    groqSettingsEl.style.display = 'block';
  } else {
    ollamaSettingsEl.style.display = 'none';
    groqSettingsEl.style.display = 'none';
  }
}

async function saveSettings() {
  const provider = aiProviderEl?.value || 'disabled';
  const url = ollamaUrlEl?.value.trim() || 'http://localhost:11434';
  const model = ollamaModelEl?.value.trim() || 'llama3.2';
  
  await sendMessage({ type: 'UPDATE_AI_SETTINGS', provider, ollamaUrl: url, ollamaModel: model });
  settings.aiProvider = provider;
  settings.ollamaUrl = url;
  settings.ollamaModel = model;
  showToast('Settings saved');
}

async function testOllamaConnection() {
  testResultEl.textContent = 'Testing...';
  testResultEl.className = 'test-result';
  
  const res = await sendMessage({ type: 'TEST_OLLAMA' });
  
  if (res.ok) {
    testResultEl.textContent = '✓ Connected successfully!';
    testResultEl.className = 'test-result success';
  } else {
    testResultEl.textContent = res.error?.includes('Failed to fetch') || res.error?.includes('NetworkError')
      ? '✗ Cannot connect. Is Ollama running?'
      : `✗ Error: ${res.error || 'Unknown'}`;
    testResultEl.className = 'test-result error';
  }
}

menuSettingsEl?.addEventListener('click', showSettingsModal);
settingsCloseEl?.addEventListener('click', closeSettingsModal);
settingsModalEl?.addEventListener('click', (e) => {
  if (e.target === settingsModalEl) closeSettingsModal();
});
aiProviderEl?.addEventListener('change', () => {
  updateProviderSettings();
  saveSettings();
});
ollamaUrlEl?.addEventListener('blur', saveSettings);
ollamaModelEl?.addEventListener('blur', saveSettings);
testOllamaBtnEl?.addEventListener('click', testOllamaConnection);

// ── AI Toggle ────────────────────────────────────────
aiToggleEl?.addEventListener('change', async (e) => {
  aiModeActive = e.target.checked;
  
  if (aiModeActive && settings.aiProvider === 'disabled') {
    showToast('Enable AI in Settings first');
    aiToggleEl.checked = false;
    aiModeActive = false;
  }
});

// ── Font Size ────────────────────────────────────────
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const size = btn.dataset.size;
    document.documentElement.setAttribute('data-size', size);
    settings.fontSize = size;
    sendMessage({ type: 'UPDATE_SETTINGS', settings });
    document.querySelectorAll('.size-btn').forEach(b => b.classList.toggle('active', b === btn));
  });
});

// ── Keyboard Navigation ───────────────────────────────
function updateSelectedCard() {
  const cards = notesEl.querySelectorAll('.card');
  cards.forEach((card, idx) => {
    const realIndex = parseInt(card.dataset.index);
    card.classList.toggle('selected', realIndex === selectedNoteIndex);
  });

  if (selectedNoteIndex >= 0) {
    const selectedCard = notesEl.querySelector(`.card[data-index="${selectedNoteIndex}"]`);
    if (selectedCard) {
      selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function handleKeyboard(e) {
  const activeEl = document.activeElement;
  const isInputFocused = activeEl === inputText || activeEl === inputNote || 
                         activeEl === searchEl || activeEl === filterInputEl ||
                         activeEl.tagName === 'INPUT' ||
                         activeEl.tagName === 'TEXTAREA';
  
  if (e.key === 'Escape') {
    if (autocompleteOpen) {
      hideAutocomplete();
      return;
    }
    selectedNoteIndex = -1;
    updateSelectedCard();
    return;
  }
  
  if (isInputFocused) return;
  
  const filtered = getFiltered();
  if (filtered.length === 0) return;
  
  if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
    e.preventDefault();
    searchEl.focus();
    searchEl.select();
    return;
  }
  
  if (e.key === 'j' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (selectedNoteIndex === -1) {
      selectedNoteIndex = 0;
    } else {
      selectedNoteIndex = Math.min(selectedNoteIndex + 1, filtered.length - 1);
    }
    updateSelectedCard();
    return;
  }
  
  if (e.key === 'k' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (selectedNoteIndex === -1) {
      selectedNoteIndex = filtered.length - 1;
    } else {
      selectedNoteIndex = Math.max(selectedNoteIndex - 1, 0);
    }
    updateSelectedCard();
    return;
  }
  
  if (e.key === 'Enter' && selectedNoteIndex >= 0) {
    e.preventDefault();
    const note = filtered[selectedNoteIndex];
    if (note) {
      const cleanText = stripTags(note.text);
      navigator.clipboard.writeText(note.note ? `${cleanText}\n\n${note.note}` : cleanText)
        .then(() => showToast('Copied'));
    }
    return;
  }
  
  if (e.key === 'd' && selectedNoteIndex >= 0) {
    e.preventDefault();
    const note = filtered[selectedNoteIndex];
    if (note) {
      sendMessage({ type: 'DELETE_NOTE', id: note.id }).then(async (res) => {
        if (res.ok) {
          await refreshState();
          renderAll();
        }
      });
    }
    return;
  }
  
  if (e.key === 'p' && selectedNoteIndex >= 0) {
    e.preventDefault();
    const note = filtered[selectedNoteIndex];
    if (note) {
      sendMessage({ type: 'TOGGLE_PIN', id: note.id }).then(async (res) => {
        if (res.ok) {
          await refreshState();
          renderAll();
        }
      });
    }
    return;
  }
}

document.addEventListener('keydown', handleKeyboard);

// ── Message Listener (from background) ─────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'STATE_UPDATED') {
    notes = message.notes || notes;
    allTags = message.tags || allTags;
    tagColors = message.tagColors || tagColors;
    renderAll();
  }
  if (message.type === 'AUTH_UPDATED') {
    user = message.user;
    subscription = message.subscription;
    updateUserProfileUI();
  }
  if (message.type === 'CHAT_TEXT') {
    chatText = message.text || '';
    updateChatMatches();
    updateChatBanner();
    renderNotes();
  }
});

// ── Init ─────────────────────────────────────────────
async function init() {
  await refreshState();
  updateThemeLabel();
  renderAll();
  
  // Check for pending selection from context menu
  const pending = await sendMessage({ type: 'GET_PENDING_SELECTION' });
  if (pending.text) {
    inputText.value = pending.text;
    showToast('Text ready — pick a tag and save');
  }
  
  // Show onboarding if needed
  if (!onboarded) {
    renderModeGrid();
    onboardingEl.style.display = 'flex';
  } else {
    onboardingEl.style.display = 'none';
  }
  
  loaderEl.classList.add('hidden');
}

// Start
init();
