import GoogleSignInModule from '../../modules/google-sign-in';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

let isConfigured = false;

async function ensureConfigured() {
  if (!isConfigured && GOOGLE_WEB_CLIENT_ID) {
    await GoogleSignInModule.configure(GOOGLE_WEB_CLIENT_ID);
    isConfigured = true;
  }
}

async function callEdgeFunction(endpoint: string, accessToken: string, body?: object) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const supabase = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,

  async signUp(email: string, password: string) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async signIn(email: string, password: string) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      }
    );
    return res.json();
  },

  async signOut(accessToken: string) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    return res.json();
  },

  async getUser(accessToken: string) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    return res.json();
  },

  async signInWithGoogle(): Promise<{ access_token?: string; msg?: string }> {
    try {
      await ensureConfigured();
      const result = await GoogleSignInModule.signIn();
      
      if (result.idToken) {
        const res = await fetch(
          `${SUPABASE_URL}/auth/v1/token?grant_type=id_token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              provider: 'google',
              id_token: result.idToken,
            }),
          }
        );
        return res.json();
      }
      
      return { msg: 'No ID token received from Google' };
    } catch (error: any) {
      if (error.code === 'E_SIGN_IN_CANCELLED') {
        return { msg: 'Sign in was cancelled' };
      }
      return { msg: error.message || 'Google sign in failed' };
    }
  },

  async fetchNotes(accessToken: string) {
    return callEdgeFunction('load-notes', accessToken);
  },

  async saveNote(accessToken: string, note: {
    id?: string;
    text: string;
    note?: string;
    tag?: string;
    date: string;
    pinned?: boolean;
    updated_at?: string;
  }) {
    return callEdgeFunction('save-note', accessToken, { note });
  },

  async deleteNote(accessToken: string, local_id: string) {
    return callEdgeFunction('delete-note', accessToken, { local_id });
  },

  async syncNotes(accessToken: string, localNotes: any[], last_synced_at?: string) {
    return callEdgeFunction('sync', accessToken, {
      notes: localNotes,
      last_synced_at,
    });
  },
};
