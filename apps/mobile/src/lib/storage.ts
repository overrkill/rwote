const storageCache: Record<string, string> = {};

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (storageCache[key] !== undefined) {
      try {
        return JSON.parse(storageCache[key]);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  },

  set<T>(key: string, value: T): void {
    storageCache[key] = JSON.stringify(value);
  },

  remove(key: string): void {
    delete storageCache[key];
  },
};
