import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  credentialForProvider,
  defaultApiSettings,
  hasCredential,
  providerForModel,
  runChat,
  type ApiSettings,
} from './providers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('model routing', () => {
  it('maps each model to its provider', () => {
    expect(providerForModel('GPT-4o')).toBe('openai');
    expect(providerForModel('Claude 3.5')).toBe('anthropic');
    expect(providerForModel('Gemini 2.5')).toBe('google');
    expect(providerForModel('DeepSeek')).toBe('deepseek');
    expect(providerForModel('Local LLM')).toBe('ollama');
  });
});

describe('credentials', () => {
  it('reads the credential for a provider', () => {
    const settings: ApiSettings = { ...defaultApiSettings, openaiKey: 'sk-test' };
    expect(credentialForProvider('openai', settings)).toBe('sk-test');
    expect(hasCredential('GPT-4o', settings)).toBe(true);
    expect(hasCredential('Claude 3.5', settings)).toBe(false);
  });
});

describe('runChat', () => {
  it('rejects when no credential is configured', async () => {
    await expect(
      runChat({ model: 'GPT-4o', system: 's', messages: [{ role: 'user', content: 'hi' }], settings: defaultApiSettings }),
    ).rejects.toThrow(/API key/i);
  });

  it('calls OpenAI and returns the assistant content', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'hello from model' } }] }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const settings: ApiSettings = { ...defaultApiSettings, openaiKey: 'sk-test' };
    const reply = await runChat({
      model: 'GPT-4o',
      system: 'system',
      messages: [{ role: 'user', content: 'hi' }],
      settings,
    });

    expect(reply).toBe('hello from model');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('api.openai.com');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test');
  });

  it('surfaces a provider error on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'invalid key' } }),
      })),
    );

    const settings: ApiSettings = { ...defaultApiSettings, anthropicKey: 'sk-ant-test' };
    await expect(
      runChat({ model: 'Claude 3.5', system: 's', messages: [{ role: 'user', content: 'hi' }], settings }),
    ).rejects.toThrow(/invalid key/i);
  });

  it('wraps network/CORS failures in a friendly message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    const settings: ApiSettings = { ...defaultApiSettings, googleKey: 'AIza-test' };
    await expect(
      runChat({ model: 'Gemini 2.5', system: 's', messages: [{ role: 'user', content: 'hi' }], settings }),
    ).rejects.toThrow(/failed/i);
  });
});
