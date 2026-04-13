// supabase.js — Supabase REST API client (no external deps)

const SUPABASE_URL = 'https://joqxsbboxmkpcizasdbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcXhzYmJveG1rcGNpemFzZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjI2ODgsImV4cCI6MjA5MTQzODY4OH0.AlJh4bvWk_aMxHnWFg4xqZhY3UzbUclcKtLvkBARAQo';

async function request(method, endpoint, body = null, token = null) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
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
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.msg || data.error_description || data.error || 'Request failed');
  }
  
  return data;
}

async function signUp(email, password, name = '') {
  return request('POST', '/auth/v1/signup', {
    email,
    password,
    data: { name }
  });
}

async function signIn(email, password) {
  try {
    const data = await request('POST', '/auth/v1/token?grant_type=password', {
      email,
      password
    });
    
    return {
      data: {
        user: data.user,
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token
        }
      }
    };
  } catch (error) {
    return { error: { message: error.message } };
  }
}

async function signOut(token) {
  return request('POST', '/auth/v1/logout', null, token);
}

async function getUser(token) {
  const user = await request('GET', '/auth/v1/user', null, token);
  return { user };
}

async function refreshAccessToken(refreshToken) {
  const data = await request('POST', '/auth/v1/token?grant_type=refresh_token', {
    refresh_token: refreshToken
  });
  
  return {
    data: {
      user: data.user,
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token
      }
    }
  };
}

// Edge function helpers
async function callEdgeFunction(functionName, body, token) {
  return request('POST', `/functions/v1/${functionName}`, body, token);
}

// Cloud note functions
async function cloudSaveNote(note, token) {
  return callEdgeFunction('save-note', { note }, token);
}

async function cloudLoadNotes(token) {
  return callEdgeFunction('load-notes', {}, token);
}

async function cloudDeleteNote(localId, token) {
  return callEdgeFunction('delete-note', { local_id: localId }, token);
}

async function getSubscriptionStatus(token) {
  return callEdgeFunction('subscription-status', {}, token);
}

async function subscribeToPlan(plan, token) {
  return callEdgeFunction('subscribe', { plan }, token);
}

// ── Ollama Local AI ─────────────────────────────────
const OLLAMA_URL_KEY = 'rwote_ollama_url';
const OLLAMA_ENABLED_KEY = 'rwote_ollama_enabled';
const OLLAMA_MODEL_KEY = 'rwote_ollama_model';

function getOllamaUrl() {
  return new Promise(resolve => {
    chrome.storage.local.get(OLLAMA_URL_KEY, res => {
      resolve(res[OLLAMA_URL_KEY] || 'http://localhost:11434');
    });
  });
}

function setOllamaUrl(url) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [OLLAMA_URL_KEY]: url }, resolve);
  });
}

function isOllamaEnabled() {
  return new Promise(resolve => {
    chrome.storage.local.get(OLLAMA_ENABLED_KEY, res => {
      resolve(res[OLLAMA_ENABLED_KEY] || false);
    });
  });
}

function setOllamaEnabled(enabled) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [OLLAMA_ENABLED_KEY]: enabled }, resolve);
  });
}

function getOllamaModel() {
  return new Promise(resolve => {
    chrome.storage.local.get(OLLAMA_MODEL_KEY, res => {
      resolve(res[OLLAMA_MODEL_KEY] || 'llama3.2');
    });
  });
}

function setOllamaModel(model) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [OLLAMA_MODEL_KEY]: model }, resolve);
  });
}

async function summarizeWithOllama(text, ollamaUrl, model) {
  const prompt = `You are a helpful assistant. Summarize the following note in 3-4 clear bullet points. Also suggest 1-2 relevant hashtags from these categories: general, arrays, strings, sliding-window, prefix-sum, hashing, trees, graphs, dp, sorting, backtracking, binary-search, heaps, tries.

Format your response exactly like this:
SUMMARY:
- bullet point 1
- bullet point 2
- bullet point 3
- bullet point 4 (optional)

TAGS:
#tag1 #tag2

ORIGINAL:
${text}`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return parseSummarizeResponse(data.response);
  } catch (error) {
    throw error;
  }
}

function parseSummarizeResponse(response) {
  let summary = '';
  let tags = [];

  // Try to parse structured response
  const summaryMatch = response.match(/SUMMARY:([\s\S]*?)(?=TAGS:|$)/i);
  const tagsMatch = response.match(/TAGS:\s*(.*?)(?=ORIGINAL:|$)/i);

  if (summaryMatch) {
    summary = summaryMatch[1]
      .trim()
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  if (tagsMatch) {
    tags = tagsMatch[1].match(/#?(\w+)/g) || [];
    tags = tags.map(t => t.replace('#', '').toLowerCase()).filter(t => t.length > 0);
  }

  // Fallback: if parsing failed, use raw response as summary
  if (!summary && response.trim()) {
    summary = response.trim().split('\n').slice(0, 4).join('\n');
  }

  // Fallback: try to extract any hashtags from response
  if (tags.length === 0) {
    const hashtagMatches = response.match(/#(\w+)/gi) || [];
    tags = hashtagMatches.slice(0, 2).map(t => t.replace('#', '').toLowerCase());
  }

  return { summary, tags };
}
