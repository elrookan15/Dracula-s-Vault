import type { VaultStorage } from './safeStorage';

const DEVICE_KEY_STORAGE = 'promptvault-studio:device-key';

/**
 * At-rest obfuscation for BYOK API keys. A random AES-GCM device key is stored
 * next to the ciphertext, so this protects against casual inspection of storage
 * but is NOT a defense against an attacker with access to the device. The UI
 * states this plainly. When Web Crypto is unavailable, values fall back to
 * UTF-8-safe base64 so the app keeps working in restricted contexts.
 */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** UTF-8-safe base64 that survives non-ASCII characters (emoji, accents). */
function encodeUtf8Base64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

function decodeUtf8Base64(value: string): string {
  return new TextDecoder().decode(base64ToBytes(value));
}

async function getDeviceKey(storage: VaultStorage): Promise<CryptoKey | null> {
  if (!globalThis.crypto?.subtle) {
    return null;
  }

  try {
    const existing = storage.getItem(DEVICE_KEY_STORAGE);
    if (existing) {
      return await crypto.subtle.importKey('jwk', JSON.parse(existing), { name: 'AES-GCM' }, true, [
        'encrypt',
        'decrypt',
      ]);
    }

    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const exported = await crypto.subtle.exportKey('jwk', key);
    storage.setItem(DEVICE_KEY_STORAGE, JSON.stringify(exported));
    return key;
  } catch {
    return null;
  }
}

export async function encryptJson(value: unknown, storage: VaultStorage): Promise<string> {
  const plain = JSON.stringify(value);
  const key = await getDeviceKey(storage);

  if (!key) {
    return `plain:${encodeUtf8Base64(plain)}`;
  }

  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
    const payload = new Uint8Array(iv.length + ciphertext.byteLength);
    payload.set(iv, 0);
    payload.set(new Uint8Array(ciphertext), iv.length);
    return `enc:${bytesToBase64(payload)}`;
  } catch {
    return `plain:${encodeUtf8Base64(plain)}`;
  }
}

export async function decryptJson<T>(payload: string, storage: VaultStorage, fallback: T): Promise<T> {
  try {
    if (payload.startsWith('plain:')) {
      return JSON.parse(decodeUtf8Base64(payload.slice('plain:'.length))) as T;
    }

    if (payload.startsWith('enc:')) {
      const key = await getDeviceKey(storage);
      if (!key) {
        return fallback;
      }
      const bytes = base64ToBytes(payload.slice('enc:'.length));
      const iv = bytes.slice(0, 12);
      const ciphertext = bytes.slice(12);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
      return JSON.parse(new TextDecoder().decode(plain)) as T;
    }
  } catch {
    // Corrupt or undecryptable payloads fall through to the default.
  }

  return fallback;
}
