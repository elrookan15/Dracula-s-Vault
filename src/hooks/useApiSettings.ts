import { useEffect, useMemo, useRef, useState } from 'react';
import { type ApiSettings, defaultApiSettings } from '../utils/providers';
import { createVaultStorage, type VaultStorage } from '../utils/safeStorage';
import { decryptJson, encryptJson } from '../utils/secureStore';

const SETTINGS_STORAGE_KEY = 'promptvault-studio:api-settings';

export interface UseApiSettingsResult {
  settings: ApiSettings;
  isPersistent: boolean;
  isReady: boolean;
  saveSettings: (next: ApiSettings) => Promise<void>;
  clearSettings: () => void;
}

export function useApiSettings(): UseApiSettingsResult {
  const storageRef = useRef<VaultStorage | null>(null);
  storageRef.current ??= createVaultStorage();
  const storage = storageRef.current;

  const [settings, setSettings] = useState<ApiSettings>(defaultApiSettings);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);

    if (!raw) {
      setIsReady(true);
      return;
    }

    decryptJson<ApiSettings>(raw, storage, defaultApiSettings).then((loaded) => {
      if (!cancelled) {
        setSettings({ ...defaultApiSettings, ...loaded });
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [storage]);

  async function saveSettings(next: ApiSettings) {
    setSettings(next);
    const payload = await encryptJson(next, storage);
    storage.setItem(SETTINGS_STORAGE_KEY, payload);
  }

  function clearSettings() {
    setSettings(defaultApiSettings);
    storage.removeItem(SETTINGS_STORAGE_KEY);
  }

  return useMemo(
    () => ({ settings, isPersistent: storage.isPersistent, isReady, saveSettings, clearSettings }),
    [settings, storage.isPersistent, isReady],
  );
}
