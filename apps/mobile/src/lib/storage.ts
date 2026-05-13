import * as SecureStore from 'expo-secure-store';

const store: Record<string, string> = {};

async function persist(key: string, raw: string): Promise<void> {
  try { await SecureStore.setItemAsync(key, raw); } catch { /* SecureStore may fail on web */ }
}

async function loadPersisted(key: string): Promise<string | null> {
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}

async function removePersisted(key: string): Promise<void> {
  try { await SecureStore.deleteItemAsync(key); } catch { /* ignore */ }
}

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (store[key] !== undefined) {
      try { return JSON.parse(store[key]); } catch { return defaultValue; }
    }
    return defaultValue;
  },

  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    store[key] = raw;
    persist(key, raw);
  },

  remove(key: string): void {
    delete store[key];
    removePersisted(key);
  },

  async hydrate(key: string): Promise<void> {
    if (store[key] !== undefined) return;
    const raw = await loadPersisted(key);
    if (raw !== null) store[key] = raw;
  },

  async clear(): Promise<void> {
    for (const key of Object.keys(store)) {
      delete store[key];
      await removePersisted(key);
    }
  },
};
