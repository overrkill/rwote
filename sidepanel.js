// sidepanel.js

const STORAGE_KEY  = 'dsa_insights_v1';
const TAGS_KEY     = 'dsa_insights_tags_v1';
const THEME_KEY    = 'dsa_insights_theme_v1';
const ONBOARD_KEY  = 'dsa_insights_onboarded_v1';

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
  'general', 'arrays', 'strings', 'sliding-window', 'prefix-sum',
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
let activeTag    = 'all';
let selectedTag  = 'general';
let searchQuery  = '';
let chatText     = '';
let chatMatchIds = new Set();

// ── DOM refs ───────────────────────────────────────
const notesEl       = document.getElementById('notes');
const filtersEl     = document.getElementById('filters');
const searchEl      = document.getElementById('search');
const clearSearchEl = document.getElementById('clear-search');
const countEl       = document.getElementById('note-count');
const bannerEl      = document.getElementById('chat-banner');
const bannerTextEl  = document.getElementById('chat-banner-text');
const inputText     = document.getElementById('input-text');
const inputNote     = document.getElementById('input-note');
const tagPickerEl   = document.getElementById('tag-picker');
const newTagInput   = document.getElementById('new-tag-input');
const saveBtn       = document.getElementById('save-btn');
const themeToggleEl = document.getElementById('theme-toggle');
const onboardingEl  = document.getElementById('onboarding');
const roleGridEl    = document.getElementById('role-grid');
const onboardSkipEl = document.getElementById('onboard-skip');
const onboardConfirmEl = document.getElementById('onboard-confirm');

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
      if (saved.tags) allTags = [...new Set([...DEFAULT_TAGS, ...saved.tags])];
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

// ── Tag picker (add panel) ─────────────────────────
function renderTagPicker() {
  tagPickerEl.innerHTML = allTags.map(tag => {
    const isSelected = selectedTag === tag;
    const label = labelOf(tag);
    return `
      <button class="tag-pick-chip${isSelected ? ' selected' : ''}" data-tag="${tag}">
        ${escHtml(label)}
        ${!isDefaultTag(tag)
          ? `<span class="chip-del" data-del="${tag}" title="Remove">×</span>`
          : ''}
      </button>
    `;
  }).join('');

  tagPickerEl.querySelectorAll('.tag-pick-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.closest('.chip-del')) return;
      selectedTag = btn.dataset.tag;
      renderTagPicker();
    });
  });

  tagPickerEl.querySelectorAll('.chip-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeUserTag(btn.dataset.del);
    });
  });
}

function addUserTag(raw) {
  const slug = slugify(raw);
  if (!slug) return;
  if (allTags.includes(slug)) {
    selectedTag = slug;
    renderTagPicker();
    return;
  }
  colorOf(slug); // assign color
  allTags.push(slug);
  selectedTag = slug;
  saveTags();
  renderTagPicker();
  renderFilters();
}

function removeUserTag(slug) {
  if (isDefaultTag(slug)) return;
  allTags = allTags.filter(t => t !== slug);
  if (selectedTag === slug) selectedTag = 'general';
  if (activeTag === slug) activeTag = 'all';
  saveTags();
  renderAll();
}

// ── Filters (top bar) ──────────────────────────────
function renderFilters() {
  filtersEl.innerHTML = ['all', ...allTags].map(t => `
    <button class="chip${activeTag === t ? ' active' : ''}" data-tag="${t}">
      ${t === 'all' ? 'All' : escHtml(labelOf(t))}
    </button>
  `).join('');

  filtersEl.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag;
      renderFilters();
      renderNotes();
    });
  });
}

// ── Notes ──────────────────────────────────────────
function highlight(text, query) {
  if (!query) return escHtml(text);
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escHtml(text).replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
}

function getFiltered() {
  let result = [...notes];
  if (activeTag !== 'all') result = result.filter(n => n.tag === activeTag);
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

  if (filtered.length === 0) {
    const msg = searchQuery
      ? `No notes match "<strong>${escHtml(searchQuery)}</strong>"`
      : activeTag !== 'all'
        ? `No notes in <strong>${escHtml(labelOf(activeTag))}</strong> yet`
        : `<strong>No notes yet</strong>\nSelect text → right-click → Save to DSA Insights\nor type below and hit Save`;
    notesEl.innerHTML = `<div class="empty">${msg}</div>`;
    return;
  }

  notesEl.innerHTML = filtered.map(n => {
    const isMatch = chatMatchIds.has(n.id);
    return `
    <div class="card${isMatch ? ' chat-match' : ''}" data-id="${n.id}">
      <div class="card-body">
        <span class="card-tag" ${tagBadgeStyle(n.tag)}>${escHtml(labelOf(n.tag))}</span>
        <div class="card-text">${highlight(n.text, searchQuery)}</div>
        ${n.note ? `<div class="card-note">${highlight(n.note, searchQuery)}</div>` : ''}
        <div class="card-meta"><span class="card-date">${n.date}</span></div>
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
    </div>`;
  }).join('');

  notesEl.querySelectorAll('.card-btn.del').forEach(btn => {
    btn.addEventListener('click', () => deleteNote(Number(btn.dataset.id)));
  });
  notesEl.querySelectorAll('.card-btn.copy').forEach(btn => {
    btn.addEventListener('click', () => copyNote(Number(btn.dataset.id)));
  });
}

function renderAll() {
  renderFilters();
  renderTagPicker();
  renderNotes();
  updateChatBanner();
}

// ── Actions ────────────────────────────────────────
function addNote(text, noteText, tag) {
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  notes.unshift({ id: Date.now(), text: text.trim(), note: noteText.trim(), tag, date });
  saveNotes();
  updateChatMatches();
  renderAll();
  showToast('Saved');
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  chatMatchIds.delete(id);
  saveNotes();
  renderAll();
}

function copyNote(id) {
  const n = notes.find(n => n.id === id);
  if (!n) return;
  navigator.clipboard.writeText(n.note ? `${n.text}\n\n${n.note}` : n.text)
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
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ── Event listeners ────────────────────────────────
saveBtn.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) { inputText.focus(); return; }
  addNote(text, inputNote.value, selectedTag);
  inputText.value = '';
  inputNote.value = '';
});

inputText.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveBtn.click();
});

newTagInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = newTagInput.value.trim();
    if (val) { addUserTag(val); newTagInput.value = ''; }
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

// ── Init ───────────────────────────────────────────
loadTheme();
checkOnboarding();
load().then(() => {
  updateChatMatches();
  renderAll();
});

themeToggleEl.addEventListener('click', toggleTheme);
