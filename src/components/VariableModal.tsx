import { Copy, Download, X, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PromptTemplate } from '../types';
import { extractVariables, highlightedPromptParts, interpolatePrompt, downloadJson } from '../utils/promptUtils';

interface VariableModalProps {
  prompt: PromptTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export function VariableModal({ prompt, isOpen, onClose, onCopy }: VariableModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const variables = useMemo(() => (prompt ? extractVariables(prompt.prompt) : []), [prompt]);
  const finalPrompt = useMemo(() => (prompt ? interpolatePrompt(prompt.prompt, values) : ''), [prompt, values]);
  const previewParts = useMemo(() => (prompt ? highlightedPromptParts(prompt.prompt, values) : []), [prompt, values]);

  useEffect(() => {
    setValues({});
  }, [prompt?.id]);

  if (!isOpen || !prompt) {
    return null;
  }

  const activePrompt = prompt;

  function updateVariable(variable: string, value: string) {
    setValues((current) => ({ ...current, [variable]: value }));
  }

  function exportExecution() {
    const payload = JSON.stringify(
      {
        promptId: activePrompt.id,
        title: activePrompt.title,
        values,
        finalPrompt,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
    downloadJson(`${activePrompt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-execution.json`, payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close drawer" onClick={onClose} />
      <section className="relative flex h-full w-full max-w-3xl flex-col border-l border-vault-border bg-vault-base shadow-2xl">
        <div className="border-b border-vault-border bg-vault-surface/90 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-vault-lime">Execution Drawer</p>
              <h2 className="mt-2 text-2xl font-black text-white">{prompt.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{prompt.framework}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-vault-border p-2 text-slate-400 transition hover:border-vault-orange hover:text-vault-orange"
              aria-label="Close execution drawer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[300px_1fr]">
          <div className="overflow-y-auto border-b border-vault-border p-5 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-white">Dynamic Variables</h3>
              <span className="rounded-full bg-vault-purple/10 px-2.5 py-1 text-xs font-black text-vault-purple-soft">
                {variables.length}
              </span>
            </div>

            {variables.length > 0 ? (
              <div className="space-y-4">
                {variables.map((variable) => (
                  <label key={variable} className="block">
                    <span className="mb-2 block font-mono text-xs font-black text-vault-purple-soft">
                      [{variable}]
                    </span>
                    <textarea
                      value={values[variable] ?? ''}
                      onChange={(event) => updateVariable(variable, event.target.value)}
                      placeholder={`Enter ${variable.toLowerCase().replace(/_/g, ' ')}`}
                      className="min-h-24 w-full resize-y rounded-2xl border border-vault-border bg-vault-surface px-3 py-3 text-sm text-slate-100 transition placeholder:text-slate-600 focus:border-vault-purple"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-vault-border bg-vault-surface/70 p-4 text-sm text-slate-400">
                This prompt has no bracketed variables. You can still copy or export the final prompt.
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vault-border p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Live Preview</p>
                <p className="text-sm text-slate-400">Purple = unresolved variable, green = inserted value.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportExecution}
                  className="inline-flex items-center gap-2 rounded-xl border border-vault-border px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-vault-purple hover:text-vault-purple-soft"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export Run
                </button>
                <button
                  type="button"
                  onClick={() => onCopy(finalPrompt)}
                  className="inline-flex items-center gap-2 rounded-xl bg-vault-lime px-3 py-2 text-sm font-black text-vault-base shadow-lime transition hover:bg-vault-lime-soft"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy Formatted
                </button>
              </div>
            </div>

            <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap p-5 font-mono text-sm leading-7 text-slate-200">
              {previewParts.map((part, index) => (
                <span
                  key={`${part.text}-${index}`}
                  className={
                    part.kind === 'value'
                      ? 'rounded bg-vault-lime/15 px-1 text-vault-lime'
                      : part.kind === 'variable'
                        ? 'rounded bg-vault-purple/15 px-1 text-vault-purple-soft'
                        : undefined
                  }
                >
                  {part.text}
                </span>
              ))}
            </pre>
          </div>
        </div>

        <div className="border-t border-vault-border bg-vault-surface/85 p-4">
          <div className="flex items-center gap-2 rounded-2xl border border-vault-orange/30 bg-vault-orange/10 px-4 py-3 text-sm text-vault-orange-soft">
            <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
            Direct Test mode is local-only in this SPA. Copy the generated prompt into your target LLM runner.
          </div>
        </div>
      </section>
    </div>
  );
}
