import type { ModelTag } from '../types';

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'ollama';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** How the credential is supplied for this provider. */
  credential: 'apiKey' | 'baseUrl';
  keyHint: string;
  /** True when the provider supports direct in-browser CORS requests. */
  browserSupported: boolean;
  docs: string;
}

export const providerMeta: Record<ProviderId, ProviderMeta> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    credential: 'apiKey',
    keyHint: 'sk-...',
    browserSupported: true,
    docs: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    credential: 'apiKey',
    keyHint: 'sk-ant-...',
    browserSupported: true,
    docs: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    id: 'google',
    label: 'Google Gemini',
    credential: 'apiKey',
    keyHint: 'AIza...',
    browserSupported: true,
    docs: 'https://aistudio.google.com/app/apikey',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    credential: 'apiKey',
    keyHint: 'sk-...',
    browserSupported: false,
    docs: 'https://platform.deepseek.com/api_keys',
  },
  ollama: {
    id: 'ollama',
    label: 'Local LLM (Ollama)',
    credential: 'baseUrl',
    keyHint: 'http://localhost:11434',
    browserSupported: true,
    docs: 'https://github.com/ollama/ollama',
  },
};

export const providerOrder: ProviderId[] = ['openai', 'anthropic', 'google', 'deepseek', 'ollama'];

const modelToProvider: Record<ModelTag, ProviderId> = {
  'GPT-4o': 'openai',
  'Claude 3.5': 'anthropic',
  'Gemini 2.5': 'google',
  DeepSeek: 'deepseek',
  'Local LLM': 'ollama',
};

const modelApiId: Record<ModelTag, string> = {
  'GPT-4o': 'gpt-4o',
  'Claude 3.5': 'claude-3-5-sonnet-latest',
  'Gemini 2.5': 'gemini-2.5-pro',
  DeepSeek: 'deepseek-chat',
  'Local LLM': 'llama3',
};

export function providerForModel(model: ModelTag): ProviderId {
  return modelToProvider[model];
}

export interface ApiSettings {
  openaiKey: string;
  anthropicKey: string;
  googleKey: string;
  deepseekKey: string;
  ollamaBaseUrl: string;
}

export const defaultApiSettings: ApiSettings = {
  openaiKey: '',
  anthropicKey: '',
  googleKey: '',
  deepseekKey: '',
  ollamaBaseUrl: 'http://localhost:11434',
};

export function credentialForProvider(provider: ProviderId, settings: ApiSettings): string {
  switch (provider) {
    case 'openai':
      return settings.openaiKey.trim();
    case 'anthropic':
      return settings.anthropicKey.trim();
    case 'google':
      return settings.googleKey.trim();
    case 'deepseek':
      return settings.deepseekKey.trim();
    case 'ollama':
      return settings.ollamaBaseUrl.trim();
    default:
      return '';
  }
}

export function hasCredential(model: ModelTag, settings: ApiSettings): boolean {
  return credentialForProvider(providerForModel(model), settings).length > 0;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RunChatArgs {
  model: ModelTag;
  system: string;
  messages: ChatMessage[];
  settings: ApiSettings;
}

class ProviderError extends Error {}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    const message = data?.error?.message ?? data?.error ?? data?.message;
    if (typeof message === 'string') {
      return message;
    }
    return JSON.stringify(data).slice(0, 300);
  } catch {
    return `HTTP ${response.status} ${response.statusText}`;
  }
}

async function runOpenAiCompatible(baseUrl: string, apiKey: string, model: string, system: string, messages: ChatMessage[]) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new ProviderError(await readError(response));
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '[No content returned]';
}

async function runAnthropic(apiKey: string, model: string, system: string, messages: ChatMessage[]) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    }),
  });

  if (!response.ok) {
    throw new ProviderError(await readError(response));
  }

  const data = await response.json();
  const text = Array.isArray(data?.content)
    ? data.content.map((block: { text?: string }) => block.text ?? '').join('')
    : '';
  return text || '[No content returned]';
}

async function runGemini(apiKey: string, model: string, system: string, messages: ChatMessage[]) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      generationConfig: { temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    throw new ProviderError(await readError(response));
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((part: { text?: string }) => part.text ?? '').join('') : '';
  return text || '[No content returned]';
}

async function runOllama(baseUrl: string, model: string, system: string, messages: ChatMessage[]) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });

  if (!response.ok) {
    throw new ProviderError(await readError(response));
  }

  const data = await response.json();
  return data?.message?.content ?? '[No content returned]';
}

export async function runChat({ model, system, messages, settings }: RunChatArgs): Promise<string> {
  const provider = providerForModel(model);
  const credential = credentialForProvider(provider, settings);
  const apiModel = modelApiId[model];

  if (!credential) {
    const meta = providerMeta[provider];
    throw new ProviderError(
      meta.credential === 'apiKey'
        ? `No ${meta.label} API key set. Add one in Settings to run this model live.`
        : `No ${meta.label} base URL set. Configure it in Settings to run this model live.`,
    );
  }

  try {
    switch (provider) {
      case 'openai':
        return await runOpenAiCompatible('https://api.openai.com/v1', credential, apiModel, system, messages);
      case 'deepseek':
        return await runOpenAiCompatible('https://api.deepseek.com/v1', credential, apiModel, system, messages);
      case 'anthropic':
        return await runAnthropic(credential, apiModel, system, messages);
      case 'google':
        return await runGemini(credential, apiModel, system, messages);
      case 'ollama':
        return await runOllama(credential, apiModel, system, messages);
      default:
        throw new ProviderError('Unsupported provider.');
    }
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }
    // Network/CORS failures land here with an opaque TypeError.
    throw new ProviderError(
      `Request to ${providerMeta[provider].label} failed. This is often a CORS or network restriction in the browser. Details: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    );
  }
}
