import { GoogleSignin } from '@react-native-google-signin/google-signin';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
});

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
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = (userInfo as any).idToken;
      if (idToken) {
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
              id_token: idToken,
            }),
          }
        );
        return res.json();
      }
      
      return { msg: 'No ID token received from Google' };
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') {
        return { msg: 'Sign in was cancelled' };
      }
      return { msg: error.message || 'Google sign in failed' };
    }
  },

  async fetchNotes(accessToken: string) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes?select=*&order=created_at.desc`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    return res.json();
  },

  async createNote(accessToken: string, note: { title: string; content: string; tags: string[] }) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(note),
    });
    return res.json();
  },

  async updateNote(accessToken: string, id: string, updates: Partial<{ title: string; content: string; tags: string[]; pinned: boolean }>) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteNote(accessToken: string, id: string) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    return res.json();
  },
};
