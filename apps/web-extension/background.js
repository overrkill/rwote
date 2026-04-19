// background.js — Service Worker (Manifest V3)
// Business logic hub: Auth, Storage, API, AI, Message Routing

// ── Constants ────────────────────────────────────────
const SUPABASE_URL = 'https://joqxsbboxmkpcizasdbc.supabase.co';

const STORAGE_KEYS = {
  NOTES: 'rwote_v1',
  TAGS: 'rwote_tags_v1',
  AUTH: 'rwote_auth_v1',
  AUTH_REFRESH: 'rwote_auth_refresh_v1',
  SETTINGS: 'rwote_settings_v1',
  ONBOARD: 'rwote_onboard_v1',
  MODE: 'rwote_mode_v1',
  PENDING_SELECTION: 'pendingSelection',
  LAST_SYNCED: 'rwote_last_sync_v1',
  OPERATION_QUEUE: 'rwote_op_queue_v1'
};

const SYNC_INTERVAL_MINUTES = 2;
const MAX_RETRY_ATTEMPTS = 3;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh if < 5 min left

const DEFAULT_TAGS = ['note', 'general', 'research', 'uncategorized'];

// ── Token Validity Cache ──────────────────────────────
// Caches token expiry to avoid decoding JWT on every operation
let cachedTokenExpiry = null;
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN_MS = 30 * 1000; // Don't retry refresh for 30s after failure

const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontSize: 'medium',
  aiProvider: 'disabled',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  groqModel: 'llama-3.1-8b-instant'
};

// ── Storage Wrapper ─────────────────────────────────
const storage = {
  get(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  },
  set(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, resolve));
  },
  remove(keys) {
    return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
  },
  clear() {
    return new Promise(resolve => chrome.storage.local.clear(resolve));
  },
  sessionGet(keys) {
    return new Promise(resolve => chrome.storage.session.get(keys, resolve));
  },
  sessionSet(obj) {
    return new Promise(resolve => chrome.storage.session.set(obj, resolve));
  },
  sessionRemove(keys) {
    return new Promise(resolve => chrome.storage.session.remove(keys, resolve));
  },
  sessionClear() {
    return new Promise(resolve => chrome.storage.session.clear(resolve));
  }
};

// ── Operation Queue ──────────────────────────────────
// Queue operations for background sync with retry logic
async function getQueue() {
  const res = await storage.get(STORAGE_KEYS.OPERATION_QUEUE);
  return res[STORAGE_KEYS.OPERATION_QUEUE] || [];
}

async function saveQueue(queue) {
  await storage.set({ [STORAGE_KEYS.OPERATION_QUEUE]: queue });
}

async function addToQueue(operation) {
  const queue = await getQueue();
  const op = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...operation,
    attempts: 0,
    createdAt: Date.now()
  };
  queue.push(op);
  await saveQueue(queue);
  return op;
}

async function removeFromQueue(opId) {
  const queue = await getQueue();
  const filtered = queue.filter(op => op.id !== opId);
  await saveQueue(filtered);
}

async function updateQueueItem(opId, updates) {
  const queue = await getQueue();
  const idx = queue.findIndex(op => op.id === opId);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...updates };
    await saveQueue(queue);
  }
}

async function processQueue() {
  const mode = await getMode();
  if (mode !== 'cloud') return;

  const auth = await ensureValidToken();
  if (!auth?.token) {
    console.log('Auth invalid or expired, queue will retry later');
    return; // Don't process, don't logout - retry in next periodic sync
  }

  const queue = await getQueue();
  if (queue.length === 0) return;

  console.log(`Processing ${queue.length} queued operations`);

  const failedOps = [];

  for (const op of queue) {
    try {
      let success = false;

      switch (op.type) {
        case 'sync_note':
          await syncNoteToCloud(op.note, auth.token);
          success = true;
          break;
        case 'delete_note':
          await cloudDeleteNote(op.noteId, auth.token);
          success = true;
          break;
      }

      if (success) {
        await removeFromQueue(op.id);
        console.log(`Queue op ${op.id} completed`);
      }
    } catch (e) {
      const newAttempts = op.attempts + 1;
      console.error(`Queue op ${op.id} failed (attempt ${newAttempts}):`, e.message);

      if (newAttempts >= MAX_RETRY_ATTEMPTS) {
        await removeFromQueue(op.id);
        failedOps.push({ ...op, error: e.message });
        console.log(`Queue op ${op.id} permanently failed after ${MAX_RETRY_ATTEMPTS} attempts`);
      } else {
        await updateQueueItem(op.id, { attempts: newAttempts });
        failedOps.push(op);
      }
    }
  }

  // Notify sidepanel of permanently failed operations
  if (failedOps.length > 0) {
    broadcastQueueFailures(failedOps);
  }
}

async function broadcastQueueFailures(failedOps) {
  chrome.runtime.sendMessage({
    type: 'SYNC_FAILED',
    operations: failedOps.map(op => ({
      type: op.type,
      noteId: op.note?.id || op.noteId,
      error: op.error
    }))
  }).catch(() => {});
}

// ── API Helpers ──────────────────────────────────────
async function apiRequest(method, endpoint, body = null, token = null) {
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcXhzYmJveG1rcGNpemFzZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjI2ODgsImV4cCI6MjA5MTQzODY4OH0.AlJh4bvWk_aMxHnWFg4xqZhY3UzbUclcKtLvkBARAQo',
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = { method, headers };
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, config);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  
  if (!response.ok) {
    throw new Error(data.msg || data.error_description || data.error || 'Request failed');
  }
  
  return data;
}

async function callEdgeFunction(functionName, body, token) {
  return apiRequest('POST', `/functions/v1/${functionName}`, body, token);
}

// ── Auth Module ──────────────────────────────────────
// Access token in session (ephemeral), refresh token in local (persistent)
async function getAuth() {
  const sessionRes = await storage.sessionGet(STORAGE_KEYS.AUTH);
  const localRes = await storage.get(STORAGE_KEYS.AUTH_REFRESH);
  
  const sessionAuth = sessionRes[STORAGE_KEYS.AUTH];
  const refreshToken = localRes[STORAGE_KEYS.AUTH_REFRESH];
  
  if (!sessionAuth && !refreshToken) return null;
  
  return {
    user: sessionAuth?.user || null,
    token: sessionAuth?.token || null,
    refreshToken: refreshToken || sessionAuth?.refreshToken || null
  };
}

async function setAuth(auth) {
  // Store access token in session (ephemeral - cleared on browser close)
  await storage.sessionSet({ [STORAGE_KEYS.AUTH]: {
    user: auth.user,
    token: auth.token
  }});
  
  // Store refresh token in local (persistent - survives browser close)
  if (auth.refreshToken) {
    await storage.set({ [STORAGE_KEYS.AUTH_REFRESH]: auth.refreshToken });
  }
}

async function clearAuth() {
  await storage.sessionRemove(STORAGE_KEYS.AUTH);
  await storage.remove(STORAGE_KEYS.AUTH_REFRESH);
}

// Restore auth from refresh token on startup
async function restoreAuthFromRefreshToken() {
  const auth = await getAuth();
  if (!auth?.refreshToken) return null;
  
  try {
    const refreshRes = await apiRequest('POST', '/auth/v1/token?grant_type=refresh_token', {
      refresh_token: auth.refreshToken
    });
    
    const newAuth = {
      user: refreshRes.user,
      token: refreshRes.access_token,
      refreshToken: refreshRes.refresh_token
    };
    
    await setAuth(newAuth);
    console.log('Auth restored from refresh token');
    return newAuth;
  } catch (e) {
    console.error('Failed to restore auth:', e);
    await clearAuth();
    return null;
  }
}

async function decodeToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const OAUTH_VERIFIER_KEY = 'oauth_verifier';

async function handleSignInWithGoogle() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  await storage.sessionSet({ [OAUTH_VERIFIER_KEY]: codeVerifier });

  const callbackUrl = chrome.identity.getRedirectURL('callback.html');
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl)}&scopes=email profile&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return new Promise((resolve) => {
    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
      if (chrome.runtime.lastError) {
        await storage.sessionRemove(OAUTH_VERIFIER_KEY);
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }

      if (!responseUrl) {
        await storage.sessionRemove(OAUTH_VERIFIER_KEY);
        resolve({ ok: false, error: 'Authentication cancelled' });
        return;
      }

      const url = new URL(responseUrl);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        await storage.sessionRemove(OAUTH_VERIFIER_KEY);
        resolve({ ok: false, error: url.searchParams.get('error_description') || error });
        return;
      }

      if (!code) {
        await storage.sessionRemove(OAUTH_VERIFIER_KEY);
        resolve({ ok: false, error: 'No authorization code received' });
        return;
      }

      const storedVerifier = (await storage.sessionGet(OAUTH_VERIFIER_KEY))[OAUTH_VERIFIER_KEY];
      await storage.sessionRemove(OAUTH_VERIFIER_KEY);

      if (!storedVerifier) {
        resolve({ ok: false, error: 'OAuth state lost. Please try again.' });
        return;
      }

      try {
        const tokenRes = await apiRequest('POST', '/auth/v1/token?grant_type=pkce', {
          auth_code: code,
          code_verifier: storedVerifier
        });

        const auth = {
          user: tokenRes.user,
          token: tokenRes.access_token,
          refreshToken: tokenRes.refresh_token
        };
        await setAuth(auth);
        broadcastAuthUpdate();
        resolve({ ok: true, user: auth.user });
      } catch (e) {
        resolve({ ok: false, error: e.message });
      }
    });
  });
}

async function ensureValidToken(skipCache = false) {
  const auth = await getAuth();
  if (!auth?.refreshToken) return null;
  
  // Fast path: use cached expiry if valid
  if (!skipCache && cachedTokenExpiry && Date.now() < cachedTokenExpiry - TOKEN_REFRESH_BUFFER_MS) {
    return auth;
  }
  
  // Cooldown after refresh failure - don't hammer the endpoint
  if (!skipCache && lastRefreshAttempt && Date.now() - lastRefreshAttempt < REFRESH_COOLDOWN_MS) {
    return null; // Don't retry refresh yet
  }
  
  // Decode and check token
  const payload = decodeToken(auth.token);
  const expTime = payload?.exp ? payload.exp * 1000 : 0;
  const timeLeft = expTime - Date.now();
  
  // Token is still valid with buffer
  if (timeLeft > TOKEN_REFRESH_BUFFER_MS) {
    cachedTokenExpiry = expTime;
    lastRefreshAttempt = 0; // Clear cooldown on valid token
    return auth;
  }
  
  // Need to refresh - mark attempt
  lastRefreshAttempt = Date.now();
  
  try {
    const refreshRes = await apiRequest('POST', '/auth/v1/token?grant_type=refresh_token', {
      refresh_token: auth.refreshToken
    });
    
    const newAuth = {
      user: refreshRes.user,
      token: refreshRes.access_token,
      refreshToken: refreshRes.refresh_token
    };
    await setAuth(newAuth);
    
    // Cache new expiry and clear cooldown
    const newPayload = decodeToken(newAuth.token);
    cachedTokenExpiry = newPayload?.exp ? newPayload.exp * 1000 : null;
    lastRefreshAttempt = 0;
    
    console.log('Token refreshed successfully');
    return newAuth;
  } catch (e) {
    console.error('Token refresh failed:', e.message);
    
    // Network error? Don't logout - keep refresh token for next attempt
    if (isNetworkError(e)) {
      console.log('Network error during refresh, will retry later');
      return null;
    }
    
    // Real auth failure (token revoked, expired, etc.) - logout
    if (e.message.includes('refresh_token') || e.message.includes('invalid') || e.message.includes('expired')) {
      console.log('Auth token revoked, clearing session');
      await clearAuth();
      broadcastAuthUpdate();
    }
    
    return null;
  }
}

function isNetworkError(e) {
  return e.message.includes('Failed to fetch') ||
         e.message.includes('NetworkError') ||
         e.message.includes('net::') ||
         e.message.includes('Network request failed');
}

async function handleSignUp(email, password, name = '') {
  try {
    const data = await apiRequest('POST', '/auth/v1/signup', {
      email,
      password,
      data: { name }
    });
    
    const auth = {
      user: data.user,
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token
    };
    await setAuth(auth);
    return { ok: true, user: auth.user };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleSignIn(email, password) {
  try {
    const data = await apiRequest('POST', '/auth/v1/token?grant_type=password', {
      email,
      password
    });
    
    const auth = {
      user: data.user,
      token: data.access_token,
      refreshToken: data.refresh_token
    };
    await setAuth(auth);
    return { ok: true, user: auth.user };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleSignOut() {
  try {
    const auth = await getAuth();
    if (auth?.token) {
      await apiRequest('POST', '/auth/v1/logout', null, auth.token);
    }
  } catch (e) {
    console.error('Sign out API error:', e);
  }
  await clearAuth();
  broadcastAuthUpdate();
  return { ok: true };
}

// ── State Managers ───────────────────────────────────
async function getNotes() {
  const res = await storage.get(STORAGE_KEYS.NOTES);
  const notes = res[STORAGE_KEYS.NOTES] || [];
  
  return notes.map(n => {
    if (n.title !== undefined) return n;
    
    return {
      id: n.id,
      title: n.text || '',
      content: n.note || '',
      tags: n.tag ? [n.tag] : ['uncategorized'],
      pinned: n.pinned || false,
      created_at: n.date || new Date().toISOString(),
      updated_at: n.date || new Date().toISOString()
    };
  });
}

async function setNotes(notes) {
  await storage.set({ [STORAGE_KEYS.NOTES]: notes });
}

async function getTags() {
  const res = await storage.get(STORAGE_KEYS.TAGS);
  if (res[STORAGE_KEYS.TAGS]) {
    return res[STORAGE_KEYS.TAGS];
  }
  return { tags: [...DEFAULT_TAGS], colors: {} };
}

async function setTags(tagsData) {
  await storage.set({ [STORAGE_KEYS.TAGS]: tagsData });
}

async function getSettings() {
  const res = await storage.get(STORAGE_KEYS.SETTINGS);
  if (res[STORAGE_KEYS.SETTINGS]) {
    return res[STORAGE_KEYS.SETTINGS];
  }
  return { ...DEFAULT_SETTINGS };
}

async function setSettings(settings) {
  await storage.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

async function getMode() {
  const res = await storage.get(STORAGE_KEYS.MODE);
  return res[STORAGE_KEYS.MODE] || 'local';
}

async function getOnboarded() {
  const res = await storage.get(STORAGE_KEYS.ONBOARD);
  return res[STORAGE_KEYS.ONBOARD] || false;
}

async function setOnboarded(value) {
  await storage.set({ [STORAGE_KEYS.ONBOARD]: value });
}

// ── Note Operations ──────────────────────────────────
function slugify(str) {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function extractTags(text) {
  const matches = text.match(/#(\w+)/g) || [];
  return [...new Set(matches.map(m => slugify(m.slice(1))))];
}

async function addNote(text, noteText = '') {
  const notes = await getNotes();
  const tagsData = await getTags();
  const mode = await getMode();
  
  const noteTags = extractTags(text);
  const tag = noteTags[0] || 'uncategorized';
  
  if (!tagsData.tags.includes(tag)) {
    tagsData.tags.push(tag);
    await setTags(tagsData);
  }
  
  const newNote = {
    id: String(Date.now()),
    title: text.trim(),
    content: noteText.trim(),
    tags: noteTags,
    pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  notes.unshift(newNote);
  await setNotes(notes);
  
  // Queue cloud sync if in cloud mode (non-blocking)
  if (mode === 'cloud') {
    addToQueue({ type: 'sync_note', note: newNote }).catch(console.error);
  }
  
  broadcastStateUpdate();
  return { ok: true, note: newNote };
}

async function updateNote(id, text, noteText = '') {
  const notes = await getNotes();
  const tagsData = await getTags();
  const mode = await getMode();
  
  const note = notes.find(n => n.id === id);
  if (!note) return { ok: false, error: 'Note not found' };
  
  const oldTags = note.tags || [];
  note.title = text.trim();
  note.content = noteText.trim();
  
  const newTags = extractTags(text);
  const allNewTags = [...new Set([...oldTags, ...newTags])];
  
  allNewTags.forEach(t => {
    if (!tagsData.tags.includes(t)) {
      tagsData.tags.push(t);
    }
  });
  
  await setTags(tagsData);
  
  note.tags = allNewTags;
  note.updated_at = new Date().toISOString();
  await setNotes(notes);
  
  // Queue cloud sync if in cloud mode (non-blocking)
  if (mode === 'cloud') {
    addToQueue({ type: 'sync_note', note }).catch(console.error);
  }
  
  broadcastStateUpdate();
  return { ok: true };
}

async function deleteNote(id) {
  const notes = await getNotes();
  const mode = await getMode();
  
  const filtered = notes.filter(n => n.id !== id);
  await setNotes(filtered);
  
  // Queue cloud delete if in cloud mode (non-blocking)
  if (mode === 'cloud') {
    addToQueue({ type: 'delete_note', noteId: id }).catch(console.error);
  }
  
  broadcastStateUpdate();
  return { ok: true };
}

async function togglePin(id) {
  const notes = await getNotes();
  const mode = await getMode();
  
  const note = notes.find(n => n.id === id);
  if (!note) return { ok: false };
  
  note.pinned = !note.pinned;
  note.updated_at = new Date().toISOString();
  await setNotes(notes);
  
  // Queue cloud sync if in cloud mode (non-blocking)
  if (mode === 'cloud') {
    addToQueue({ type: 'sync_note', note }).catch(console.error);
  }
  
  broadcastStateUpdate();
  return { ok: true };
}

// ── Cloud Sync ───────────────────────────────────────
async function syncNoteToCloud(note, token) {
  try {
    await callEdgeFunction('save-note', { note }, token);
  } catch (e) {
    console.error('Cloud save error:', e);
  }
}

async function cloudDeleteNote(noteId, token) {
  try {
    await callEdgeFunction('delete-note', { id: noteId }, token);
  } catch (e) {
    console.error('Cloud delete error:', e);
  }
}

async function loadNotesFromCloud() {
  const auth = await ensureValidToken();
  if (!auth?.token) return { ok: false, error: 'Not authenticated' };
  
  try {
    const res = await callEdgeFunction('load-notes', {}, auth.token);
    if (res.error) return { ok: false, error: res.error };
    
    const cloudNotes = res.notes || [];
    const localNotes = await getNotes();
    
    const cloudMap = new Map();
    cloudNotes.forEach(n => {
      const id = String(n.id);
      cloudMap.set(id, {
        id,
        title: n.title || 'Untitled',
        content: n.content || '',
        tags: n.tags || [],
        pinned: n.pinned || false,
        created_at: n.created_at || new Date().toISOString(),
        updated_at: n.updated_at || new Date().toISOString(),
      });
    });
    
    const merged = new Map();
    localNotes.forEach(n => merged.set(n.id, n));
    cloudMap.forEach((cloudNote, cloudId) => {
      if (!merged.has(cloudId)) {
        merged.set(cloudId, cloudNote);
      } else {
        const local = merged.get(cloudId);
        const cloudTime = new Date(cloudNote.updated_at).getTime();
        const localTime = new Date(local.updated_at).getTime();
        if (cloudTime > localTime) {
          merged.set(cloudId, cloudNote);
        }
      }
    });
    
    const mergedNotes = Array.from(merged.values()).sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    await setNotes(mergedNotes);
    
    broadcastStateUpdate();
    return { ok: true, notes: mergedNotes };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Subscription ─────────────────────────────────────
async function getSubscriptionStatus() {
  const auth = await getAuth();
  if (!auth?.token) return { ok: false, error: 'Not authenticated' };
  
  const validAuth = await ensureValidToken();
  if (!validAuth) return { ok: false, error: 'Token expired' };
  
  try {
    const res = await callEdgeFunction('subscription-status', {}, validAuth.token);
    return { ok: true, ...res };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function handleSubscribe(plan) {
  const auth = await ensureValidToken();
  if (!auth?.token) return { ok: false, error: 'Not authenticated' };
  
  try {
    const res = await callEdgeFunction('subscribe', { plan }, auth.token);
    return res;
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── AI Module ────────────────────────────────────────
const SUMMARY_PROMPT = `You are a precise summarization assistant. Given the text below, do the following:

1. Summarize the content into **4-5 concise bullet points** using markdown formatting.
2. Each bullet point should capture a distinct key idea — no repetition.
3. At the end, add **1-4 relevant hashtags** that best represent the topic or theme of the text.

Respond ONLY in this format:

**Summary:**
- bullet point 1
- bullet point 2
- bullet point 3
- bullet point 4
- bullet point 5 (if needed)

**Tags:** #tag1 #tag2 #tag3

---
Text:
{{TEXT}}`;

function parseSummarizeResponse(response) {
  let summary = '';
  let tags = [];
  
  const summaryMatch = response.match(/\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*Tags:|$)/i);
  const tagsMatch = response.match(/\*\*Tags:\*\*\s*(.*?)$/im);
  
  if (summaryMatch) {
    summary = summaryMatch[1]
      .trim()
      .split('\n')
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .join('\n');
  }
  
  if (tagsMatch) {
    tags = tagsMatch[1].match(/#?(\w+)/g) || [];
    tags = tags.map(t => t.replace('#', '').toLowerCase()).filter(t => t.length > 0);
  }
  
  if (!summary && response.trim()) {
    summary = response.trim().split('\n').slice(0, 4).join('\n');
  }
  
  if (tags.length === 0) {
    const hashtagMatches = response.match(/#(\w+)/gi) || [];
    tags = hashtagMatches.slice(0, 4).map(t => t.replace('#', '').toLowerCase());
  }
  
  return { summary, tags };
}

async function summarizeWithOllama(text) {
  const settings = await getSettings();
  const prompt = SUMMARY_PROMPT.replace('{{TEXT}}', text);
  
  const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.ollamaModel,
      prompt: prompt,
      stream: false
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }
  
  const data = await response.json();
  return parseSummarizeResponse(data.response);
}

async function summarizeWithCloud(text) {
  const auth = await ensureValidToken();
  if (!auth?.token) throw new Error('Not authenticated');
  
  const res = await callEdgeFunction('summarize', { text }, auth.token);
  if (res.error) throw new Error(res.error);
  
  return parseSummarizeResponse(res.response);
}

async function handleSummarize(text) {
  const settings = await getSettings();
  
  if (settings.aiProvider === 'ollama') {
    return await summarizeWithOllama(text);
  } else if (settings.aiProvider === 'groq') {
    return await summarizeWithCloud(text);
  } else {
    throw new Error('AI provider not configured');
  }
}

async function updateAiSettings(provider, ollamaUrl, ollamaModel) {
  const settings = await getSettings();
  settings.aiProvider = provider;
  if (ollamaUrl) settings.ollamaUrl = ollamaUrl;
  if (ollamaModel) settings.ollamaModel = ollamaModel;
  await setSettings(settings);
  return { ok: true };
}

// ── Periodic Sync ─────────────────────────────────
async function getLastSynced() {
  const res = await storage.get(STORAGE_KEYS.LAST_SYNCED);
  return res[STORAGE_KEYS.LAST_SYNCED] || null;
}

async function setLastSynced(timestamp) {
  await storage.set({ [STORAGE_KEYS.LAST_SYNCED]: timestamp });
}

async function performPeriodicSync() {
  const mode = await getMode();
  if (mode !== 'cloud') return;
  
  const auth = await ensureValidToken();
  if (!auth?.token) return;
  
  try {
    // First, process any queued operations
    await processQueue();
    
    // Then do a full sync from cloud
    const result = await loadNotesFromCloud();
    if (result.ok) {
      await setLastSynced(Date.now());
      broadcastStateUpdate();
    }
  } catch (e) {
    console.error('Periodic sync failed:', e);
  }
}

function setupPeriodicSync() {
  // Create alarm for periodic sync
  chrome.alarms.create('periodicSync', { 
    periodInMinutes: SYNC_INTERVAL_MINUTES,
    delayInMinutes: 1 // Start after 1 minute
  });
  
  // Listen for alarm
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'periodicSync') {
      performPeriodicSync();
    }
  });
}

function clearPeriodicSync() {
  chrome.alarms.clear('periodicSync');
}

// Update mode to handle sync setup
async function setMode(mode) {
  await storage.set({ [STORAGE_KEYS.MODE]: mode });
  if (mode === 'cloud') {
    setupPeriodicSync();
    await performPeriodicSync(); // Immediate sync on cloud mode enable
  } else {
    clearPeriodicSync();
  }
}

// ── Startup ─────────────────────────────────────────
async function initializeExtension() {
  // Try to restore auth from refresh token
  const mode = await getMode();
  
  if (mode === 'cloud') {
    setupPeriodicSync();
    
    // Try to restore auth and do initial sync
    const restoredAuth = await restoreAuthFromRefreshToken();
    if (restoredAuth) {
      await performPeriodicSync();
    }
  }
}

// ── Broadcast Updates ────────────────────────────────
async function broadcastStateUpdate() {
  const notes = await getNotes();
  const tagsData = await getTags();
  const lastSynced = await getLastSynced();
  
  chrome.runtime.sendMessage({
    type: 'STATE_UPDATED',
    notes,
    tags: tagsData.tags,
    tagColors: tagsData.colors,
    lastSyncedAt: lastSynced
  }).catch(() => {});
}

async function broadcastAuthUpdate() {
  const auth = await getAuth();
  const subscription = auth ? await getSubscriptionStatus() : null;
  const lastSynced = await getLastSynced();
  
  chrome.runtime.sendMessage({
    type: 'AUTH_UPDATED',
    user: auth?.user || null,
    subscription: subscription?.ok ? subscription : null,
    lastSyncedAt: lastSynced
  }).catch(() => {});
}

// ── Message Router ──────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // async response
});

async function handleMessage(message) {
  switch (message.type) {
    // State
    case 'GET_STATE': {
      const notes = await getNotes();
      const tagsData = await getTags();
      const settings = await getSettings();
      const auth = await getAuth();
      const mode = await getMode();
      const onboarded = await getOnboarded();
      const subscription = auth ? await getSubscriptionStatus() : null;
      const lastSynced = await getLastSynced();
      
      return {
        ok: true,
        notes,
        tags: tagsData.tags,
        tagColors: tagsData.colors,
        settings,
        user: auth?.user || null,
        mode,
        onboarded,
        subscription,
        lastSyncedAt: lastSynced
      };
    }

    case 'GET_MODE':
      return await getMode();
    
    case 'ADD_NOTE':
      return await addNote(message.text, message.noteText);
    
    case 'UPDATE_NOTE':
      return await updateNote(message.id, message.text, message.noteText);
    
    case 'DELETE_NOTE':
      return await deleteNote(message.id);
    
    case 'TOGGLE_PIN':
      return await togglePin(message.id);
    
    // Auth
    case 'SIGN_IN':
      return await handleSignIn(message.email, message.password);
    
    case 'SIGN_UP':
      return await handleSignUp(message.email, message.password, message.name);
    
    case 'SIGN_IN_GOOGLE':
      return await handleSignInWithGoogle();
    
    case 'OAUTH_CODE': {
      const { code } = message;
      const tokenRes = await apiRequest('POST', '/auth/v1/token?grant_type=pkce', {
        auth_code: code
      });
      const auth = {
        user: tokenRes.user,
        token: tokenRes.access_token,
        refreshToken: tokenRes.refresh_token
      };
      await setAuth(auth);
      broadcastAuthUpdate();
      return { ok: true, user: auth.user };
    }
    
    case 'OAUTH_ERROR': {
      return { ok: false, error: message.error_description || message.error };
    }
    
    case 'SIGN_OUT':
      return await handleSignOut();
    
    case 'SIGN_OUT_CLOUD': {
      const auth = await getAuth();
      if (auth?.token) {
        await apiRequest('POST', '/auth/v1/logout', null, auth.token);
      }
      await clearAuth();
      await storage.clear();
      await storage.sessionClear();
      broadcastAuthUpdate();
      return { ok: true };
    }
    
    case 'REFRESH_AUTH':
      return { ok: true, valid: !!(await ensureValidToken()) };
    
    case 'GET_AUTH': {
      const auth = await getAuth();
      const subscription = auth ? await getSubscriptionStatus() : null;
      return {
        ok: true,
        user: auth?.user || null,
        subscription: subscription?.ok ? subscription : null,
        mode: await getMode()
      };
    }
    
    // Settings
    case 'GET_SETTINGS':
      return { ok: true, settings: await getSettings() };
    
    case 'UPDATE_SETTINGS':
      await setSettings(message.settings);
      return { ok: true };
    
    case 'UPDATE_AI_SETTINGS':
      return await updateAiSettings(message.provider, message.ollamaUrl, message.ollamaModel);
    
    // Mode
    case 'SET_MODE':
      await setMode(message.mode);
      if (message.mode === 'cloud') {
        await loadNotesFromCloud();
      }
      return { ok: true };
    
    case 'SET_ONBOARDED':
      await setOnboarded(true);
      return { ok: true };
    
    // Cloud Sync
    case 'SYNC_FROM_CLOUD':
      return await loadNotesFromCloud();
    
    case 'GET_SUBSCRIPTION':
      return await getSubscriptionStatus();
    
    case 'SUBSCRIBE':
      return await handleSubscribe(message.plan);
    
    // AI
    case 'SUMMARIZE':
      return await handleSummarize(message.text);
    
    case 'TEST_OLLAMA': {
      try {
        const settings = await getSettings();
        const res = await fetch(`${settings.ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: settings.ollamaModel,
            prompt: 'Say "OK"',
            stream: false
          })
        });
        return { ok: res.ok };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }
    
    // Selection
    case 'TEXT_SELECTION':
      await storage.sessionSet({ [STORAGE_KEYS.PENDING_SELECTION]: message.text });
      return { ok: true };
    
    case 'GET_PENDING_SELECTION': {
      const res = await storage.sessionGet(STORAGE_KEYS.PENDING_SELECTION);
      if (res[STORAGE_KEYS.PENDING_SELECTION]) {
        await storage.sessionRemove(STORAGE_KEYS.PENDING_SELECTION);
        return { ok: true, text: res[STORAGE_KEYS.PENDING_SELECTION] };
      }
      return { ok: true, text: null };
    }
    
    default:
      return { ok: false, error: 'Unknown message type' };
  }
}

// ── Extension Setup ──────────────────────────────────
// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Set side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-insight',
    title: 'Save to Rwote',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-insight' && info.selectionText) {
    const text = info.selectionText.trim();
    if (!text) return;
    
    // Store selection for side panel to pick up
    storage.sessionSet({ [STORAGE_KEYS.PENDING_SELECTION]: text });
    
    // Open side panel
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// ── Initialize on Startup ──────────────────────────────
initializeExtension();
