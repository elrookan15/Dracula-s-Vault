import { Eye, EyeOff, KeyRound, ShieldAlert, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type ApiSettings, providerMeta } from '../utils/providers';

interface SettingsDrawerProps {
  isOpen: boolean;
  settings: ApiSettings;
  isPersistent: boolean;
  onClose: () => void;
  onSave: (next: ApiSettings) => void;
  onClear: () => void;
}

type KeyField = 'openaiKey' | 'anthropicKey' | 'googleKey' | 'deepseekKey';

const keyFields: Array<{ field: KeyField; provider: keyof typeof providerMeta }> = [
  { field: 'openaiKey', provider: 'openai' },
  { field: 'anthropicKey', provider: 'anthropic' },
  { field: 'googleKey', provider: 'google' },
  { field: 'deepseekKey', provider: 'deepseek' },
];

export function SettingsDrawer({ isOpen, settings, isPersistent, onClose, onSave, onClear }: SettingsDrawerProps) {
  const [draft, setDraft] = useState<ApiSettings>(settings);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setRevealed({});
    }
  }, [isOpen, settings]);

  if (!isOpen) {
    return null;
  }

  function update<Key extends keyof ApiSettings>(key: Key, value: ApiSettings[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    onSave(draft);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[55] flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close settings" onClick={onClose} />

      <section className="relative flex h-full w-full max-w-lg flex-col border-l border-vault-border bg-vault-base shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-vault-border bg-vault-surface/90 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-vault-orange">Settings</p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
              <KeyRound className="h-6 w-6 text-vault-lime" aria-hidden="true" />
              API Keys (BYOK)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-vault-border p-2 text-slate-400 transition hover:border-vault-orange hover:text-vault-orange"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex items-start gap-3 rounded-2xl border border-vault-orange/40 bg-vault-orange/10 px-4 py-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-vault-orange" aria-hidden="true" />
            <p className="text-sm leading-6 text-vault-orange-soft">
              Keys are stored only in your browser and encrypted at rest with a device-local key. This blocks casual
              inspection but is not protection against someone with access to this device. Calls go directly from your
              browser to each provider.
              {!isPersistent && ' Storage is blocked here, so keys live in memory for this session only.'}
            </p>
          </div>

          {keyFields.map(({ field, provider }) => {
            const meta = providerMeta[provider];
            const isRevealed = revealed[field];
            return (
              <div key={field}>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor={field} className="text-sm font-bold text-slate-200">
                    {meta.label} API Key
                  </label>
                  {!meta.browserSupported && (
                    <span className="rounded-full bg-vault-orange/10 px-2 py-0.5 text-[10px] font-black uppercase text-vault-orange-soft">
                      may hit CORS
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id={field}
                    type={isRevealed ? 'text' : 'password'}
                    value={draft[field]}
                    onChange={(event) => update(field, event.target.value)}
                    placeholder={meta.keyHint}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-vault-border bg-vault-surface px-3 py-2.5 pr-11 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
                  />
                  <button
                    type="button"
                    onClick={() => setRevealed((current) => ({ ...current, [field]: !current[field] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-slate-200"
                    aria-label={isRevealed ? 'Hide key' : 'Reveal key'}
                  >
                    {isRevealed ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                <a
                  href={meta.docs}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-slate-500 underline decoration-dotted hover:text-vault-purple-soft"
                >
                  Get a {meta.label} key
                </a>
              </div>
            );
          })}

          <div>
            <label htmlFor="ollamaBaseUrl" className="mb-1 block text-sm font-bold text-slate-200">
              {providerMeta.ollama.label} Base URL
            </label>
            <input
              id="ollamaBaseUrl"
              value={draft.ollamaBaseUrl}
              onChange={(event) => update('ollamaBaseUrl', event.target.value)}
              placeholder={providerMeta.ollama.keyHint}
              spellCheck={false}
              className="w-full rounded-xl border border-vault-border bg-vault-surface px-3 py-2.5 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
            />
            <p className="mt-1 text-xs text-slate-500">
              Local models need Ollama running with browser access allowed (set <code>OLLAMA_ORIGINS</code>).
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-vault-border bg-vault-surface/85 p-4">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-xl border border-vault-border px-3 py-2 text-sm font-bold text-slate-300 transition hover:border-red-500 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear all
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-vault-border px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-vault-orange px-4 py-2 text-sm font-black text-white shadow-orange transition hover:bg-vault-orange-soft"
            >
              Save keys
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
