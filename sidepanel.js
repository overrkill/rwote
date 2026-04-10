// sidepanel.js

const STORAGE_KEY  = 'rwote_v1';
const TAGS_KEY     = 'rwote_tags_v1';
const THEME_KEY    = 'rwote_theme_v1';
const ONBOARD_KEY  = 'rwote_onboarded_v1';
const SIZE_KEY     = 'rwote_size_v1';

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

const DEFAULT_TAGS = [
  'uncategorized', 'general', 'arrays', 'strings', 'sliding-window', 'prefix-sum',
  'hashing', 'trees', 'graphs', 'dp', 'sorting',
  'backtracking', 'binary-search', 'heaps', 'tries'
];

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

// ── State ──────────────────────────────────────────
let notes        = [];
let allTags      = [...DEFAULT_TAGS];
let tagColors    = {};
let activeTags   = new Set();
let searchQuery  = '';
let chatText     = '';
let chatMatchIds = new Set();
let menuOpen     = false;
let pendingImport = null;
let selectedNoteIndex = -1;
let deletedNote = null;
let deleteTimer = null;
let autocompleteOpen = false;
let autocompleteTags = [];
let selectedAutocompleteIndex = -1;

// ── DOM refs ───────────────────────────────────────
const notesEl       = document.getElementById('notes');
const searchEl      = document.getElementById('search');
const clearSearchEl = document.getElementById('clear-search');
const countEl       = document.getElementById('note-count');
const bannerEl      = document.getElementById('chat-banner');
const bannerTextEl  = document.getElementById('chat-banner-text');
const inputText     = document.getElementById('input-text');
const inputNote     = document.getElementById('input-note');
const saveBtn       = document.getElementById('save-btn');
const themeToggleEl = document.getElementById('theme-toggle');
const onboardingEl  = document.getElementById('onboarding');
const roleGridEl    = document.getElementById('role-grid');
const onboardSkipEl = document.getElementById('onboard-skip');
const onboardConfirmEl = document.getElementById('onboard-confirm');
const hamburgerBtnEl = document.getElementById('hamburger-btn');
const hamburgerMenuEl = document.getElementById('hamburger-menu');
const menuStatsEl = document.getElementById('menu-stats');
const menuExportEl = document.getElementById('menu-export');
const menuImportEl = document.getElementById('menu-import');
const importFileEl = document.getElementById('import-file');
const menuThemeEl = document.getElementById('menu-theme');
const filterIconBtn = document.getElementById('filter-icon-btn');
const filterInputWrap = document.getElementById('filter-input-wrap');
const filterInputEl = document.getElementById('filter-input');
const filterClearEl = document.getElementById('filter-clear');
const filterBarEl = document.getElementById('filter-bar');
const filterDropdownEl = document.getElementById('filter-dropdown');
const filterChipsEl = document.getElementById('filter-chips');
const tagAutocompleteEl = document.getElementById('tag-autocomplete');

// ── Tag helpers ────────────────────────────────────
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

function isDefaultTag(slug) { return DEFAULT_TAGS.includes(slug); }

function extractTags(text) {
  const matches = text.match(/#(\w+)/g) || [];
  return [...new Set(matches.map(m => slugify(m.slice(1))))];
}

function stripTags(text) {
  return text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
}

function ensureTagsExist(tags) {
  let changed = false;
  tags.forEach(tag => {
    if (!allTags.includes(tag)) {
      colorOf(tag);
      allTags.push(tag);
      changed = true;
    }
  });
  if (changed) {
    saveTags();
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Storage ────────────────────────────────────────
async function load() {
  return new Promise(resolve => {
    chrome.storage.local.get([STORAGE_KEY, TAGS_KEY], (res) => {
      notes = res[STORAGE_KEY] || [];
      const saved = res[TAGS_KEY] || {};
      if (saved.tags && saved.tags.length > 0) {
        allTags = saved.tags;
      }
      if (saved.colors) tagColors = { ...saved.colors };
      resolve();
    });
  });
}

function saveTags() {
  chrome.storage.local.set({ [TAGS_KEY]: { tags: allTags, colors: tagColors } });
}

function saveNotes() {
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
    if (matchCount >= 2 || (words.length === 1 && matchCount === 1)) chatMatchIds.add(n.id);
  });
}

function updateChatBanner() {
  const count = chatMatchIds.size;
  if (count === 0) { bannerEl.style.display = 'none'; return; }
  bannerEl.style.display = 'flex';
  bannerTextEl.textContent = `${count} note${count !== 1 ? 's' : ''} match this chat`;
}

// ── Tag autocomplete ───────────────────────────────
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

filterBarEl.addEventListener('click', (e) => {
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
  if (e.key === 'Escape') {
    hideFilterInput();
  }
});

filterClearEl.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFilter();
});

document.addEventListener('click', (e) => {
  if (!filterBarEl.contains(e.target)) {
    if (filterDropdownEl.classList.contains('open')) {
      filterDropdownEl.classList.remove('open');
    }
  }
});

// ── Notes ──────────────────────────────────────────
function highlight(text, query) {
  if (!query) return escHtml(text);
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escHtml(text).replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
}

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
        : `<strong>No notes yet</strong>\nSelect text → right-click → Save to DSA Insights\nor type below and hit Save`;
    notesEl.innerHTML = `<div class="empty">${msg}</div>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.id - a.id;
  });

  notesEl.innerHTML = sorted.map((n, idx) => {
    const isMatch = chatMatchIds.has(n.id);
    const realIndex = filtered.indexOf(n);
    return `
    <div class="card${isMatch ? ' chat-match' : ''}${n.pinned ? ' pinned' : ''}" data-id="${n.id}" data-index="${realIndex}">
      <div class="card-body">
        <span class="card-tag" ${tagBadgeStyle(n.tag)}>${escHtml(labelOf(n.tag))}</span>
        <div class="card-text">${highlight(stripTags(n.text), searchQuery)}</div>
        ${n.note ? `<div class="card-note">${highlight(n.note, searchQuery)}</div>` : ''}
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
    btn.addEventListener('click', () => deleteNote(Number(btn.dataset.id)));
  });
  notesEl.querySelectorAll('.card-btn.copy').forEach(btn => {
    btn.addEventListener('click', () => copyNote(Number(btn.dataset.id)));
  });
  notesEl.querySelectorAll('.card-btn.pin').forEach(btn => {
    btn.addEventListener('click', () => togglePin(Number(btn.dataset.id)));
  });
  notesEl.querySelectorAll('.card-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => showEditModal(Number(btn.dataset.id)));
  });
}

function renderAll() {
  renderNotes();
  updateChatBanner();
}

// ── Actions ────────────────────────────────────────
function addNote(text, noteText) {
  const tags = extractTags(text);
  const tag = tags[0] || 'uncategorized';
  ensureTagsExist(tags);
  
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  notes.unshift({ id: Date.now(), text: text.trim(), note: noteText.trim(), tag, date, pinned: false });
  saveNotes();
  updateChatMatches();
  renderAll();
  renderFilters();
  showToast('Saved');
}

function deleteNote(id) {
  const noteToDelete = notes.find(n => n.id === id);
  if (!noteToDelete) return;
  
  deletedNote = noteToDelete;
  notes = notes.filter(n => n.id !== id);
  chatMatchIds.delete(id);
  saveNotes();
  renderAll();
  
  clearTimeout(deleteTimer);
  showToast('Note deleted — <span id="undo-delete">Undo</span>');
  
  document.getElementById('undo-delete')?.addEventListener('click', (e) => {
    e.stopPropagation();
    undoDelete();
  });
  
  deleteTimer = setTimeout(() => {
    deletedNote = null;
  }, 5000);
}

function editNote(id, newText, newNote) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  const oldTags = extractTags(note.text);
  note.text = newText.trim();
  note.note = newNote.trim();
  
  const newTags = extractTags(newText);
  const allNewTags = [...new Set([...oldTags, ...newTags])];
  ensureTagsExist(allNewTags);
  
  if (newTags.length > 0) {
    note.tag = newTags[0];
  }
  
  saveNotes();
  updateChatMatches();
  renderAll();
  renderFilters();
  showToast('Updated');
}

function showEditModal(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  const fullText = note.text;
  
  const html = `<div class="modal-overlay edit-modal-overlay" id="edit-modal-overlay">
    <div class="modal-content edit-modal">
      <div class="modal-header">
        <h3>Edit Note</h3>
        <button class="modal-close" id="edit-modal-close">×</button>
      </div>
      <div class="edit-modal-body">
        <textarea id="edit-text" placeholder="Your note…" rows="4">${escHtml(fullText)}</textarea>
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
  
  const modalOverlay = document.getElementById('edit-modal-overlay');
  const editTextEl = document.getElementById('edit-text');
  const editNoteEl = document.getElementById('edit-note');
  const editSaveEl = document.getElementById('edit-save');
  const editCancelEl = document.getElementById('edit-cancel');
  const editCloseEl = document.getElementById('edit-modal-close');
  
  function closeModal() {
    modalOverlay.remove();
  }
  
  editSaveEl.addEventListener('click', () => {
    editNote(id, editTextEl.value, editNoteEl.value);
    closeModal();
  });
  
  editCancelEl.addEventListener('click', () => closeModal());
  editCloseEl.addEventListener('click', () => closeModal());
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  
  editTextEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      editNote(id, editTextEl.value, editNoteEl.value);
      closeModal();
    }
  });
  
  editTextEl.focus();
  editTextEl.setSelectionRange(editTextEl.value.length, editTextEl.value.length);
}

function undoDelete() {
  if (!deletedNote) return;
  notes.unshift(deletedNote);
  deletedNote = null;
  clearTimeout(deleteTimer);
  saveNotes();
  renderAll();
  showToast('Note restored');
}

function togglePin(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  note.pinned = !note.pinned;
  saveNotes();
  renderAll();
}

function copyNote(id) {
  const n = notes.find(n => n.id === id);
  if (!n) return;
  const cleanText = stripTags(n.text);
  navigator.clipboard.writeText(n.note ? `${cleanText}\n\n${n.note}` : cleanText)
    .then(() => showToast('Copied'));
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
  toast.innerHTML = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
}

// ── Event listeners ────────────────────────────────
saveBtn.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) { inputText.focus(); return; }
  hideAutocomplete();
  addNote(text, inputNote.value);
  inputText.value = '';
  inputNote.value = '';
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
    const query = hashMatch[1];
    showAutocomplete(query);
  } else {
    hideAutocomplete();
  }
});

inputText.addEventListener('blur', () => {
  setTimeout(() => hideAutocomplete(), 150);
});

// ── Tag autocomplete ────────────────────────────────
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
    item.addEventListener('click', () => {
      insertTag(item.dataset.tag);
    });
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

// ── Message listener ───────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CHAT_TEXT') {
    chatText = message.text || '';
    updateChatMatches();
    updateChatBanner();
    renderNotes();
  }
  if (message.type === 'SAVE_SELECTION') {
    const text = message.text?.trim();
    if (text) {
      inputText.value = text;
      inputText.focus();
      showToast('Text ready — pick a tag and save');
      inputText.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

chrome.storage.session.get('pendingSelection', (res) => {
  if (res.pendingSelection) {
    inputText.value = res.pendingSelection;
    chrome.storage.session.remove('pendingSelection');
    showToast('Text ready — pick a tag and save');
  }
});

// ── Theme ─────────────────────────────────────────
function loadTheme() {
  chrome.storage.local.get(THEME_KEY, (res) => {
    if (res[THEME_KEY] === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  });
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    chrome.storage.local.set({ [THEME_KEY]: 'light' });
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    chrome.storage.local.set({ [THEME_KEY]: 'dark' });
  }
}

// ── Onboarding ─────────────────────────────────────
let selectedRole = null;

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
      onboardConfirmEl.disabled = false;
    });
  });
}

function applyRoleTags() {
  if (selectedRole && ROLE_TAGS[selectedRole]) {
    allTags = ROLE_TAGS[selectedRole].tags;
    allTags.forEach(tag => colorOf(tag));
    saveTags();
  }
}

function finishOnboarding(skipped) {
  onboardingEl.style.display = 'none';
  if (!skipped) applyRoleTags();
  chrome.storage.local.set({ [ONBOARD_KEY]: true });
  renderAll();
}

function checkOnboarding() {
  chrome.storage.local.get(ONBOARD_KEY, (res) => {
    if (res[ONBOARD_KEY]) {
      onboardingEl.style.display = 'none';
    } else {
      renderRoleGrid();
      onboardingEl.style.display = 'flex';
    }
  });
}

onboardSkipEl.addEventListener('click', () => finishOnboarding(true));
onboardConfirmEl.addEventListener('click', () => finishOnboarding(false));

// ── Hamburger Menu ─────────────────────────────────
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
menuExportEl.addEventListener('click', () => { closeMenu(); exportNotes(); });
menuImportEl.addEventListener('click', () => { closeMenu(); importFileEl.click(); });
menuThemeEl.addEventListener('click', () => { closeMenu(); toggleTheme(); });

importFileEl.addEventListener('change', handleFileSelect);

// ── Font Size ─────────────────────────────────────
function loadFontSize() {
  chrome.storage.local.get(SIZE_KEY, (res) => {
    const size = res[SIZE_KEY] || 'medium';
    document.documentElement.setAttribute('data-size', size);
    updateSizeButtons(size);
  });
}

function setFontSize(size) {
  document.documentElement.setAttribute('data-size', size);
  chrome.storage.local.set({ [SIZE_KEY]: size });
  updateSizeButtons(size);
}

function updateSizeButtons(active) {
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === active);
  });
}

// Font size button listeners
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => setFontSize(btn.dataset.size));
});

// ── Theme ─────────────────────────────────────────
function updateThemeLabel() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const icon = menuThemeEl.querySelector('.theme-icon');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

function loadTheme() {
  chrome.storage.local.get(THEME_KEY, (res) => {
    if (res[THEME_KEY] === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    updateThemeLabel();
  });
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    chrome.storage.local.set({ [THEME_KEY]: 'light' });
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    chrome.storage.local.set({ [THEME_KEY]: 'dark' });
  }
  updateThemeLabel();
}

// ── Export/Import ──────────────────────────────────
function exportNotes() {
  const data = {
    version: 1,
    exported: new Date().toISOString().split('T')[0],
    notes: notes,
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

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.notes && Array.isArray(data.notes)) {
        pendingImport = data;
        showImportConfirm(data.notes.length);
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

function showImportConfirm(count) {
  if (confirm(`This will replace ${count} notes. Continue?`)) {
    applyImport();
  }
}

function applyImport() {
  if (!pendingImport) return;
  notes = pendingImport.notes;
  if (pendingImport.tags) allTags = pendingImport.tags;
  if (pendingImport.colors) tagColors = pendingImport.colors;
  saveNotes();
  saveTags();
  pendingImport = null;
  updateChatMatches();
  renderAll();
  showToast('Imported');
}

// ── Tag Stats ──────────────────────────────────────
function computeTagStats() {
  const byTag = {};
  let total = notes.length;
  notes.forEach(n => {
    byTag[n.tag] = (byTag[n.tag] || 0) + 1;
  });
  const sorted = Object.entries(byTag).sort((a, b) => b[1] - a[1]);
  const mostUsed = sorted[0]?.[0] || null;
  const leastUsed = sorted[sorted.length - 1]?.[0] || null;
  return { total, byTag, mostUsed, leastUsed };
}

function showStatsModal() {
  const stats = computeTagStats();
  const maxCount = Math.max(...Object.values(stats.byTag), 1);
  const statsHtml = Object.entries(stats.byTag)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => {
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
        <div class="stats-total">${stats.total} total notes</div>
        ${statsHtml || '<div class="stats-empty">No notes yet</div>'}
        ${stats.mostUsed ? `<div class="stats-summary">
          <span>Most used: <strong>${escHtml(labelOf(stats.mostUsed))}</strong></span>
          ${stats.leastUsed ? `<span>Least used: <strong>${escHtml(labelOf(stats.leastUsed))}</strong></span>` : ''}
        </div>` : ''}
      </div>
    </div>
  </div>`;

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('stats-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ── Keyboard Navigation ─────────────────────────────
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
    if (note) copyNote(note.id);
    return;
  }
  
  if (e.key === 'd' && selectedNoteIndex >= 0) {
    e.preventDefault();
    const note = filtered[selectedNoteIndex];
    if (note) deleteNote(note.id);
    return;
  }
  
  if (e.key === 'p' && selectedNoteIndex >= 0) {
    e.preventDefault();
    const note = filtered[selectedNoteIndex];
    if (note) togglePin(note.id);
    return;
  }
}

document.addEventListener('keydown', handleKeyboard);

// ── Init ───────────────────────────────────────────
loadTheme();
loadFontSize();
checkOnboarding();
load().then(() => {
  updateChatMatches();
  renderAll();
});
