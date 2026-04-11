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
    throw new Error(data.msg || data.error_description || 'Request failed');
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
}

async function signOut(token) {
  return request('POST', '/auth/v1/logout', null, token);
}

async function getUser(token) {
  const user = await request('GET', '/auth/v1/user', null, token);
  return { user };
}

async function refreshToken(refreshToken) {
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
