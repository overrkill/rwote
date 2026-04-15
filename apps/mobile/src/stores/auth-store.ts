import { create } from 'zustand';
import { Alert } from 'react-native';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  initialized: false,

  initialize: () => {
    const savedToken = storage.get<string | null>('accessToken', null);
    const savedUser = storage.get<User | null>('user', null);
    if (savedToken && savedUser) {
      set({ accessToken: savedToken, user: savedUser, initialized: true });
    } else {
      set({ initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await supabase.signIn(email, password);
      if (data.access_token) {
        const userData = await supabase.getUser(data.access_token);
        storage.set('accessToken', data.access_token);
        storage.set('user', { id: userData.id, email: userData.email });
        set({ accessToken: data.access_token, user: { id: userData.id, email: userData.email } });
      } else {
        throw new Error(data.msg || JSON.stringify(data));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await supabase.signUp(email, password);
      if (data.access_token) {
        const userData = await supabase.getUser(data.access_token);
        storage.set('accessToken', data.access_token);
        storage.set('user', { id: userData.id, email: userData.email });
        set({ accessToken: data.access_token, user: { id: userData.id, email: userData.email } });
      } else if (data.confirmation_url) {
        Alert.alert('Check your email', 'Please confirm your email to continue');
      } else {
        throw new Error(data.msg || 'Failed to sign up');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const { accessToken } = get();
    if (accessToken) {
      await supabase.signOut(accessToken);
    }
    storage.remove('accessToken');
    storage.remove('user');
    set({ accessToken: null, user: null });
  },
}));
