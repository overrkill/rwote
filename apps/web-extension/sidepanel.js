// sidepanel.js — UI Layer
// No business logic - all operations go through background.js
/* global applyTheme, getTheme */

// ── Constants ────────────────────────────────────────
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
let lastSyncedAt = null;
let syncStatus = ''; // '', 'syncing', 'synced', 'error'

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
const addPanelEl = document.getElementById('add-panel');
const onboardingEl = document.getElementById('onboarding');
const modeSectionEl = document.getElementById('mode-section');
const modeGridEl = document.getElementById('mode-grid');
const authSectionEl = document.getElementById('auth-section');
const roleSectionEl = document.getElementById('role-section');
const roleGridEl = document.getElementById('role-grid');
const roleConfirmBtnEl = document.getElementById('role-confirm-btn');
const onboardingActionsEl = document.getElementById('onboarding-actions');
const authErrorEl = document.getElementById('auth-error');
const emailFormsEl = document.getElementById('email-forms');
const showEmailLoginEl = document.getElementById('show-email-login');
const showRegisterFormEl = document.getElementById('show-register-form');
const showLoginFormEl = document.getElementById('show-login-form');
const authBackBtnEl = document.getElementById('auth-back-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const googleSigninBtn = document.getElementById('google-signin-btn');
const hamburgerBtnEl = document.getElementById('hamburger-btn');
const hamburgerMenuEl = document.getElementById('hamburger-menu');
const menuStatsEl = document.getElementById('menu-stats');
const menuLogoutEl = document.getElementById('menu-logout');
const menuLoginEl = document.getElementById('menu-login');
const importFileEl = document.getElementById('import-file');
const menuThemeEl = document.getElementById('menu-theme');
const userProfileEl = document.getElementById('user-profile');
const userAvatarEl = document.getElementById('user-avatar');
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const userDividerEl = document.getElementById('user-divider');
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
const syncStatusEl = document.getElementById('sync-status');
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
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const color = { bg: `hsl(${hue}, 70%, 85%)`, text: `hsl(${hue}, 70%, 25%)` };
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
  lastSyncedAt = state.lastSyncedAt;
  
  // Apply theme
  const themeId = settings.theme || 'paper_dark';
  applyTheme(getTheme(themeId));
  
  updateSyncStatus();
  
  return state;
}

function updateSyncStatus() {
  if (mode !== 'cloud' || !user) {
    syncStatus = '';
    if (syncStatusEl) syncStatusEl.textContent = '';
    return;
  }
  
  let text = '';
  if (lastSyncedAt) {
    const diff = Date.now() - lastSyncedAt;
    const mins = Math.floor(diff / 60000);
    
    if (mins < 1) {
      text = 'synced';
    } else if (mins < 60) {
      text = `${mins}m ago`;
    } else {
      const hours = Math.floor(mins / 60);
      text = hours === 1 ? '1h ago' : `${hours}h ago`;
    }
  } else {
    text = 'syncing…';
  }
  
  syncStatus = text;
  if (syncStatusEl) syncStatusEl.textContent = text;
}

function formatSyncTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  
  if (mins < 1) return 'just now';
  if (mins === 1) return '1m ago';
  if (mins < 60) return `${mins}m ago`;
  
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1h ago';
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  return `${days}d ago`;
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
      const count = notes.filter(n => n.tags && n.tags.includes(tag)).length;
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
    const words = (n.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 4);
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
    result = result.filter(n => n.tags && n.tags.some(t => activeTags.has(t)));
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
    );
  }
  return result;
}

// ── Render Notes ─────────────────────────────────────
let cardEventListenersAttached = false;

function tagBadgeStyle(slug) {
  const c = colorOf(slug);
  return `style="background:${c.bg};color:${c.text}"`;
}

function noteCardHTML(n, realIndex) {
  const isMatch = chatMatchIds.has(n.id);
  return `
  <div class="card${isMatch ? ' chat-match' : ''}${n.pinned ? ' pinned' : ''}" data-id="${n.id}" data-index="${realIndex}">
    <div class="card-body">
      <div class="card-tags">${(n.tags && n.tags.length > 0 ? n.tags : ['uncategorized']).map(tag => `<span class="card-tag" ${tagBadgeStyle(tag)}>${escHtml(labelOf(tag))}</span>`).join('')}</div>
      <div class="card-text">${processNoteText(n.title || '', searchQuery)}</div>
      ${n.content ? `<div class="card-note">${processNoteText(n.content, searchQuery)}</div>` : ''}
      <div class="card-meta"><span class="card-date">${n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</span></div>
    </div>
    <div class="card-actions">
      <button class="card-btn pin${n.pinned ? ' active' : ''}" data-id="${n.id}" title="${n.pinned ? 'Unpin' : 'Pin'}">
        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="${n.pinned ? 'currentColor' : 'none'}" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      </button>
      <button class="card-btn edit" data-id="${n.id}" title="Edit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="card-btn copy" data-id="${n.id}" title="Copy">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button class="card-btn del" data-id="${n.id}" title="Delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>`;
}

function attachCardEventListeners() {
  if (cardEventListenersAttached) return;
  
  notesEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.card-btn');
    if (!btn) return;
    
    const id = String(btn.dataset.id);
    
    if (btn.classList.contains('del')) {
      const res = await sendMessage({ type: 'DELETE_NOTE', id });
      if (res.ok) await refreshState();
      renderNotes();
    } else if (btn.classList.contains('copy')) {
      const n = notes.find(x => x.id === id);
      if (!n) return;
      const cleanText = stripTags(n.title || '');
      navigator.clipboard.writeText(n.content ? `${cleanText}\n\n${n.content}` : cleanText)
        .then(() => showToast('Copied'));
    } else if (btn.classList.contains('pin')) {
      const res = await sendMessage({ type: 'TOGGLE_PIN', id });
      if (res.ok) await refreshState();
      renderNotes();
    } else if (btn.classList.contains('edit')) {
      showEditModal(id);
    }
  });
  
  cardEventListenersAttached = true;
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

  attachCardEventListeners();

  const existingCards = new Map();
  notesEl.querySelectorAll('.card').forEach(card => {
    existingCards.set(card.dataset.id, card);
  });

  const sortedIds = new Set(sorted.map(n => n.id));
  
  for (const [id, card] of existingCards) {
    if (!sortedIds.has(id)) {
      card.remove();
    }
  }

  const fragment = document.createDocumentFragment();
  sorted.forEach((n, idx) => {
    const realIndex = filtered.indexOf(n);
    const existingCard = existingCards.get(n.id);
    
    if (existingCard) {
      const isMatch = chatMatchIds.has(n.id);
      existingCard.className = `card${isMatch ? ' chat-match' : ''}${n.pinned ? ' pinned' : ''}`;
      existingCard.dataset.index = realIndex;
      
      const tagsContainer = existingCard.querySelector('.card-tags');
      if (tagsContainer) {
        const tags = n.tags && n.tags.length > 0 ? n.tags : ['uncategorized'];
        tagsContainer.innerHTML = tags.map(tag => `<span class="card-tag" ${tagBadgeStyle(tag)}>${escHtml(labelOf(tag))}</span>`).join('');
      }
      
      const textEl = existingCard.querySelector('.card-text');
      if (textEl) textEl.innerHTML = processNoteText(n.title || '', searchQuery);
      
      const noteEl = existingCard.querySelector('.card-note');
      const expectedNoteHTML = n.content ? processNoteText(n.content, searchQuery) : '';
      if (noteEl) {
        noteEl.innerHTML = expectedNoteHTML;
      } else if (n.content) {
        const newNoteEl = document.createElement('div');
        newNoteEl.className = 'card-note';
        newNoteEl.innerHTML = expectedNoteHTML;
        textEl?.after(newNoteEl);
      }
      
      const dateEl = existingCard.querySelector('.card-date');
      if (dateEl) dateEl.textContent = n.created_at ? new Date(n.created_at).toLocaleDateString() : '';
      
      const pinBtn = existingCard.querySelector('.card-btn.pin');
      if (pinBtn) {
        pinBtn.className = `card-btn pin${n.pinned ? ' active' : ''}`;
        pinBtn.title = n.pinned ? 'Unpin' : 'Pin';
        pinBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="${n.pinned ? 'currentColor' : 'none'}" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
      }
    } else {
      const temp = document.createElement('div');
      temp.innerHTML = noteCardHTML(n, realIndex);
      fragment.appendChild(temp.firstElementChild);
    }
  });

  notesEl.appendChild(fragment);
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
        <textarea id="edit-text" placeholder="Your note…" rows="4">${escHtml(note.title || '')}</textarea>
        <textarea id="edit-note" placeholder="Extra context (optional)…" rows="2">${escHtml(note.content || '')}</textarea>
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
let themeDropdownEl = null;

function showThemeDropdown() {
  closeMenu();
  
  if (themeDropdownEl) {
    themeDropdownEl.remove();
    themeDropdownEl = null;
    return;
  }
  
  themeDropdownEl = document.createElement('div');
  themeDropdownEl.className = 'theme-dropdown';
  
  const themes = [
    { id: 'paper_dark', name: 'Paper Dark' },
    { id: 'tokyonight', name: 'Tokyo Night' },
    { id: 'catppuccin', name: 'Catppuccin' },
    { id: 'nord', name: 'Nord' },
    { id: 'ayu', name: 'Ayu Dark' },
    { id: 'monokai', name: 'Monokai' },
    { id: 'tokyonight_light', name: 'Tokyo Night Light' },
    { id: 'catppuccin_light', name: 'Catppuccin Latte' },
    { id: 'nord_light', name: 'Nord Frost' },
    { id: 'ayu_light', name: 'Ayu Mirage' },
    { id: 'monokai_light', name: 'Monokai Pro' },
  ];
  
  const currentTheme = settings.theme || 'paper_dark';
  
  themeDropdownEl.innerHTML = themes.map(t => `
    <button class="theme-option${t.id === currentTheme ? ' active' : ''}" data-theme="${t.id}">
      ${t.name}
      ${t.id === currentTheme ? '<span class="theme-check">✓</span>' : ''}
    </button>
  `).join('');
  
  themeDropdownEl.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.theme;
      applyTheme(getTheme(themeId));
      settings.theme = themeId;
      sendMessage({ type: 'UPDATE_SETTINGS', settings });
      themeDropdownEl.remove();
      themeDropdownEl = null;
      showToast('Theme applied');
    });
  });
  
  const rect = menuThemeEl.getBoundingClientRect();
  themeDropdownEl.style.position = 'absolute';
  themeDropdownEl.style.top = `${rect.bottom + 4}px`;
  themeDropdownEl.style.right = '10px';
  themeDropdownEl.style.zIndex = '200';
  
  document.body.appendChild(themeDropdownEl);
  
  setTimeout(() => {
    document.addEventListener('click', handleThemeDropdownOutside, { once: true });
  }, 0);
}

function handleThemeDropdownOutside(e) {
  if (themeDropdownEl && !themeDropdownEl.contains(e.target) && e.target !== menuThemeEl) {
    themeDropdownEl.remove();
    themeDropdownEl = null;
  }
}

// ── User Profile ─────────────────────────────────────
function updateUserProfileUI() {
  if (user) {
    userProfileEl.style.display = 'flex';
    userDividerEl.style.display = 'block';
    menuLogoutEl.style.display = 'flex';
    menuLoginEl.style.display = 'none';
    
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    const avatarUrl = user.user_metadata?.avatar_url || 
                       user.identities?.[0]?.identity_data?.avatar_url;
    
    if (avatarUrl) {
      userAvatarEl.innerHTML = `<img src="${avatarUrl}" alt="${name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    } else {
      const initial = name.charAt(0).toUpperCase();
      userAvatarEl.textContent = initial;
    }
    
    userNameEl.textContent = name;
    userEmailEl.textContent = user.email || '';
    
    updateUserStatus();
  } else {
    userProfileEl.style.display = 'none';
    userDividerEl.style.display = 'none';
    menuLogoutEl.style.display = 'none';
    menuLoginEl.style.display = 'flex';
  }
}

function updateUserStatus() {
  if (!user || !subscription) {
    menuSubscriptionEl.style.display = 'none';
    return;
  }
  
  const status = subscription.subscription_status;
  const daysLeft = subscription.days_left;
  const subStatusEl = menuSubscriptionEl.querySelector('.sub-status');
  
  if (status === 'paid') {
    subStatusEl.textContent = 'Pro';
    menuSubscriptionEl.style.display = 'flex';
  } else if (status === 'trial') {
    subStatusEl.textContent = `Trial · ${daysLeft}d left`;
    menuSubscriptionEl.style.display = 'flex';
  } else if (status === 'expired') {
    subStatusEl.textContent = 'Expired';
    menuSubscriptionEl.style.display = 'flex';
  } else {
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
menuThemeEl.addEventListener('click', () => { closeMenu(); showThemeDropdown(); });

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

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.notes && Array.isArray(data.notes)) {
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

importFileEl.addEventListener('change', handleFileSelect);

// ── Stats Modal ───────────────────────────────────────
function showStatsModal() {
  const byTag = {};
  notes.forEach(n => {
    (n.tags || ['general']).forEach(t => {
      byTag[t] = (byTag[t] || 0) + 1;
    });
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
let selectedMode = null;
let selectedRole = null;

function showModeSelection() {
  addPanelEl.style.display = 'none';
  modeSectionEl.style.display = 'block';
  authSectionEl.style.display = 'none';
  roleSectionEl.style.display = 'none';
  onboardingActionsEl.style.display = 'flex';
}

function showAuthSection() {
  addPanelEl.style.display = 'none';
  modeSectionEl.style.display = 'none';
  authSectionEl.style.display = 'block';
  roleSectionEl.style.display = 'none';
  onboardingActionsEl.style.display = 'none';
  emailFormsEl.style.display = 'none';
  authErrorEl.textContent = '';
  loginForm.style.display = 'flex';
  registerForm.style.display = 'none';
  showRegisterFormEl.style.display = 'inline';
  showLoginFormEl.style.display = 'none';
}

function showRoleSelection() {
  addPanelEl.style.display = 'none';
  modeSectionEl.style.display = 'none';
  authSectionEl.style.display = 'none';
  roleSectionEl.style.display = 'block';
  onboardingActionsEl.style.display = 'flex';
  renderRoleGrid();
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

roleConfirmBtnEl?.addEventListener('click', () => {
  finishOnboarding();
});

async function finishOnboarding() {
  if (selectedMode === 'local' || selectedMode === 'cloud') {
    await sendMessage({ type: 'SET_MODE', mode: selectedMode });
  }
  
  await sendMessage({ type: 'SET_ONBOARDED' });
  onboardingEl.style.display = 'none';
  addPanelEl.style.display = 'flex';
  await refreshState();
  renderAll();
}

modeGridEl.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    selectedMode = card.dataset.mode;
    if (selectedMode === 'local') {
      showRoleSelection();
    } else if (selectedMode === 'cloud') {
      showAuthSection();
    }
  });
});

authBackBtnEl.addEventListener('click', () => {
  emailFormsEl.style.display = 'none';
  showEmailLoginEl.style.display = 'inline';
  showModeSelection();
});

showEmailLoginEl.addEventListener('click', (e) => {
  e.preventDefault();
  emailFormsEl.style.display = 'block';
  showEmailLoginEl.style.display = 'none';
  authErrorEl.textContent = '';
});

showRegisterFormEl.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  registerForm.style.display = 'flex';
  showRegisterFormEl.style.display = 'none';
  showLoginFormEl.style.display = 'inline';
  authErrorEl.textContent = '';
});

showLoginFormEl.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.style.display = 'none';
  loginForm.style.display = 'flex';
  showRegisterFormEl.style.display = 'inline';
  showLoginFormEl.style.display = 'none';
  authErrorEl.textContent = '';
});

// Google Sign In
googleSigninBtn?.addEventListener('click', async () => {
  authErrorEl.textContent = '';
  googleSigninBtn.disabled = true;
  googleSigninBtn.querySelector('span').innerHTML = '<span class="btn-spinner"></span> Signing in...';
  
  const res = await sendMessage({ type: 'SIGN_IN_GOOGLE' });
  
  if (res.error) {
    googleSigninBtn.disabled = false;
    googleSigninBtn.querySelector('span').textContent = 'Continue with Google';
    showToast('Sign in failed: ' + res.error);
    return;
  }
  
  if (res.ok) {
    googleSigninBtn.querySelector('span').textContent = 'Success!';
    await refreshState();
    finishOnboarding();
    showToast('Welcome!');
  }
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

// Import/Export Modal
const importExportModalEl = document.getElementById('import-export-modal');
const importExportCloseEl = document.getElementById('import-export-close');
const exportBtnEl = document.getElementById('export-btn');
const importBtnEl = document.getElementById('import-btn');

document.getElementById('menu-import-export')?.addEventListener('click', () => {
  closeMenu();
  importExportModalEl.style.display = 'flex';
});

importExportCloseEl?.addEventListener('click', () => {
  importExportModalEl.style.display = 'none';
});

importExportModalEl?.addEventListener('click', (e) => {
  if (e.target === importExportModalEl) importExportModalEl.style.display = 'none';
});

exportBtnEl?.addEventListener('click', () => {
  importExportModalEl.style.display = 'none';
  exportNotes();
});

importBtnEl?.addEventListener('click', () => {
  importExportModalEl.style.display = 'none';
  importFileEl.click();
});

// ── Logout/Login ─────────────────────────────────────
async function handleLogout() {
  closeMenu();
  const currentMode = await sendMessage({ type: 'GET_MODE' });
  if (currentMode === 'cloud') {
    await sendMessage({ type: 'SIGN_OUT_CLOUD' });
    user = null;
    subscription = null;
    notes = [];
    allTags = [...DEFAULT_TAGS];
    tagColors = {};
    activeTags = new Set();
    searchQuery = '';
    mode = 'local';
    onboarded = false;
    googleSigninBtn.disabled = false;
    googleSigninBtn.querySelector('span').textContent = 'Continue with Google';
    updateUserProfileUI();
    countEl.textContent = '0 notes';
    renderAll();
    selectedMode = null;
    showModeSelection();
    onboardingEl.style.display = 'flex';
    addPanelEl.style.display = 'none';
    showToast('Signed out');
  } else {
    await sendMessage({ type: 'SIGN_OUT' });
    showToast('Signed out');
  }
}

menuLogoutEl.addEventListener('click', handleLogout);
menuLoginEl.addEventListener('click', () => {
  closeMenu();
  selectedMode = 'cloud';
  showModeSelection();
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
      const cleanText = stripTags(note.title || '');
      navigator.clipboard.writeText(note.content ? `${cleanText}\n\n${note.content}` : cleanText)
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
    lastSyncedAt = message.lastSyncedAt;
    updateSyncStatus();
    renderNotes();
  }
  if (message.type === 'AUTH_UPDATED') {
    user = message.user;
    subscription = message.subscription;
    lastSyncedAt = message.lastSyncedAt;
    updateSyncStatus();
    updateUserProfileUI();
  }
  if (message.type === 'CHAT_TEXT') {
    chatText = message.text || '';
    updateChatMatches();
    updateChatBanner();
    renderNotes();
  }
  if (message.type === 'SYNC_FAILED') {
    message.operations?.forEach(op => {
      if (op.type === 'delete_note') {
        showToast('Sync failed: note may not be deleted on server');
      } else {
        showToast('Sync failed: changes may not be saved');
      }
    });
  }
});

// ── Init ─────────────────────────────────────────────
async function init() {
  await refreshState();
  renderAll();
  
  // Check for pending selection from context menu
  const pending = await sendMessage({ type: 'GET_PENDING_SELECTION' });
  if (pending.text) {
    inputText.value = pending.text;
    showToast('Text ready — pick a tag and save');
  }
  
  // Show onboarding if needed
  if (!onboarded) {
    showModeSelection();
    onboardingEl.style.display = 'flex';
  } else {
    onboardingEl.style.display = 'none';
  }
  
  loaderEl.classList.add('hidden');
  
  // Periodic sync status update (every minute)
  setInterval(() => {
    if (mode === 'cloud' && user) {
      updateSyncStatus();
    }
  }, 60000);
}

// Start
init();
