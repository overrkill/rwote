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

async function cloudDeleteNote(noteId, token) {
  return callEdgeFunction('delete-note', { id: noteId }, token);
}

async function getSubscriptionStatus(token) {
  return callEdgeFunction('subscription-status', {}, token);
}

async function subscribeToPlan(plan, token) {
  return callEdgeFunction('subscribe', { plan }, token);
}

// ── AI Settings ─────────────────────────────────────
const AI_PROVIDER_KEY = 'rwote_ai_provider';
const OLLAMA_URL_KEY = 'rwote_ollama_url';
const OLLAMA_MODEL_KEY = 'rwote_ollama_model';
const GROQ_MODEL_KEY = 'rwote_groq_model';

function getAiProvider() {
  return new Promise(resolve => {
    chrome.storage.local.get(AI_PROVIDER_KEY, res => {
      resolve(res[AI_PROVIDER_KEY] || 'disabled');
    });
  });
}

function setAiProvider(provider) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [AI_PROVIDER_KEY]: provider }, resolve);
  });
}

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

function getGroqModel() {
  return new Promise(resolve => {
    chrome.storage.local.get(GROQ_MODEL_KEY, res => {
      resolve(res[GROQ_MODEL_KEY] || 'llama-3.1-8b-instant');
    });
  });
}

function setGroqModel(model) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [GROQ_MODEL_KEY]: model }, resolve);
  });
}

async function summarizeWithOllama(text, ollamaUrl, model) {
  const prompt = `You are a precise summarization assistant. Given the text below, do the following:

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

async function summarizeWithGroq(text, token) {
  try {
    const response = await callEdgeFunction('summarize', { text }, token);

    if (response.error) {
      throw new Error(response.error);
    }

    return parseSummarizeResponse(response.response);
  } catch (error) {
    throw error;
  }
}

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
