import { describe, expect, it } from 'vitest';
import { decryptJson, encryptJson } from './secureStore';
import type { VaultStorage } from './safeStorage';

function memoryStorage(): VaultStorage {
  const map = new Map<string, string>();
  return {
    isPersistent: true,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

describe('secureStore round trip', () => {
  it('encrypts and decrypts back to the original value', async () => {
    const storage = memoryStorage();
    const secret = { openaiKey: 'sk-secret', note: 'café ☕ 日本語' };

    const payload = await encryptJson(secret, storage);
    expect(payload.startsWith('enc:') || payload.startsWith('plain:')).toBe(true);
    // The raw secret must not appear verbatim in the stored payload.
    expect(payload.includes('sk-secret')).toBe(false);

    const restored = await decryptJson(payload, storage, {});
    expect(restored).toEqual(secret);
  });

  it('returns the fallback for a corrupt payload', async () => {
    const storage = memoryStorage();
    const fallback = { openaiKey: '' };
    const restored = await decryptJson('enc:not-real-base64$$$', storage, fallback);
    expect(restored).toEqual(fallback);
  });
});
