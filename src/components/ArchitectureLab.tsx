import { GitBranch, Layers3, Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LabBranch } from '../types';

const labSteps = [
  { id: 'identity', label: 'Identity', prompt: 'Role, seniority, and expertise' },
  { id: 'tone', label: 'Tone', prompt: 'Style, jargon density, and voice' },
  { id: 'objective', label: 'Objective', prompt: 'Core action, KPIs, and success criteria' },
  { id: 'context', label: 'Context', prompt: 'Audience, domain, constraints, and source material' },
  { id: 'structure', label: 'Structure', prompt: 'Required sections, schema, or response format' },
  { id: 'constraints', label: 'Constraints', prompt: 'Guardrails, forbidden patterns, and safety rules' },
  { id: 'logic', label: 'Logic', prompt: 'Reasoning framework and validation loop' },
] as const;

export function ArchitectureLab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<LabBranch[]>([]);

  const composedPrompt = useMemo(() => {
    return labSteps
      .map((step, index) => {
        const value = values[step.id]?.trim() || `[DEFINE_${step.id.toUpperCase()}]`;
        return `${index + 1}. ${step.label}: ${value}`;
      })
      .join('\n');
  }, [values]);

  function updateStep(stepId: string, value: string) {
    setValues((current) => ({ ...current, [stepId]: value }));
  }

  function forkBranch() {
    const nextBranch: LabBranch = {
      id: `branch-${Date.now()}`,
      name: `V${branches.length + 1}`,
      values,
      createdAt: new Date().toISOString(),
    };
    setBranches((current) => [nextBranch, ...current]);
  }

  return (
    <section className="glass-panel rounded-3xl p-5">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-vault-purple/30 bg-vault-purple/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-vault-purple-soft">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Architecture Lab
          </div>
          <h2 className="text-2xl font-black text-white">7-pass guided prompt builder</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Compose production prompts by separating identity, tone, objective, context, structure, constraints, and logic.
          </p>
        </div>
        <button
          type="button"
          onClick={forkBranch}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-vault-lime/40 bg-vault-lime/10 px-4 py-2.5 text-sm font-black text-vault-lime transition hover:bg-vault-lime/15"
        >
          <GitBranch className="h-4 w-4" aria-hidden="true" />
          Fork Branch
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {labSteps.map((step) => (
            <label key={step.id} className="rounded-2xl border border-vault-border bg-vault-base/60 p-4">
              <span className="mb-1 block text-sm font-black text-white">{step.label}</span>
              <span className="mb-3 block text-xs text-slate-500">{step.prompt}</span>
              <textarea
                value={values[step.id] ?? ''}
                onChange={(event) => updateStep(step.id, event.target.value)}
                rows={4}
                className="w-full resize-y rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
                placeholder={`Define ${step.label.toLowerCase()}...`}
              />
            </label>
          ))}
        </div>

        <aside className="rounded-2xl border border-vault-border bg-vault-base/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-vault-orange" aria-hidden="true" />
            <h3 className="font-black text-white">Production Preview</h3>
          </div>
          <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-vault-border bg-black/20 p-4 font-mono text-xs leading-6 text-slate-300">
            {composedPrompt}
          </pre>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-black text-white">Branches</h4>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-slate-300">{branches.length}</span>
            </div>
            <div className="space-y-2">
              {branches.length > 0 ? (
                branches.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => setValues(branch.values)}
                    className="flex w-full items-center justify-between rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-left text-sm text-slate-300 transition hover:border-vault-lime hover:text-vault-lime"
                  >
                    <span className="inline-flex items-center gap-2">
                      <GitBranch className="h-4 w-4" aria-hidden="true" />
                      {branch.name}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(branch.createdAt).toLocaleTimeString()}</span>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-vault-border p-4 text-sm text-slate-500">
                  <Plus className="mb-2 h-4 w-4" aria-hidden="true" />
                  Fork a branch to preserve an alternate prompt strategy.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
