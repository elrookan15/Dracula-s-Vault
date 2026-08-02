const PROBE_KEY = '__promptvault_probe__';

export interface VaultStorage {
  isPersistent: boolean;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/**
 * Opaque-origin sandboxes throw a SecurityError on the `localStorage` property
 * access itself, so detection has to happen inside the try block.
 */
function resolvePersistentStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) {
      return null;
    }

    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return null;
  }
}

export function createVaultStorage(): VaultStorage {
  const persistentStorage = resolvePersistentStorage();
  const memoryStorage = new Map<string, string>();

  if (!persistentStorage) {
    return {
      isPersistent: false,
      getItem: (key) => memoryStorage.get(key) ?? null,
      setItem: (key, value) => {
        memoryStorage.set(key, value);
      },
      removeItem: (key) => {
        memoryStorage.delete(key);
      },
    };
  }

  return {
    isPersistent: true,
    getItem: (key) => {
      try {
        return persistentStorage.getItem(key);
      } catch {
        return memoryStorage.get(key) ?? null;
      }
    },
    setItem: (key, value) => {
      memoryStorage.set(key, value);
      try {
        persistentStorage.setItem(key, value);
      } catch {
        // Quota or permission failures mid-session keep the in-memory copy only.
      }
    },
    removeItem: (key) => {
      memoryStorage.delete(key);
      try {
        persistentStorage.removeItem(key);
      } catch {
        // Ignore removal failures in restricted environments.
      }
    },
  };
}
