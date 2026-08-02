import { Download, Plus, Search, Settings, ShieldCheck, Upload } from 'lucide-react';
import type { ModelTag } from '../types';

interface HeaderProps {
  searchQuery: string;
  selectedModel: ModelTag | 'all';
  models: ModelTag[];
  onSearchChange: (value: string) => void;
  onModelChange: (value: ModelTag | 'all') => void;
  onNewPrompt: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onOpenSettings: () => void;
}

export function Header({
  searchQuery,
  selectedModel,
  models,
  onSearchChange,
  onModelChange,
  onNewPrompt,
  onExport,
  onImport,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-vault-border/80 bg-vault-base/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-vault-purple/50 bg-vault-surface shadow-glow">
              <ShieldCheck className="h-6 w-6 text-vault-lime" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-vault-orange shadow-orange" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-vault-purple-soft">
                PromptVault
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Studio Command Deck
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-vault-lime hover:text-vault-lime"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-vault-purple hover:text-vault-purple-soft">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImport(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-vault-orange hover:text-vault-orange-soft"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </button>
            <button
              type="button"
              onClick={onNewPrompt}
              className="inline-flex items-center gap-2 rounded-xl bg-vault-orange px-4 py-2 text-sm font-black text-white shadow-orange transition hover:bg-vault-orange-soft"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Prompt
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <span className="sr-only">Search prompts</span>
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by keyword, tag, or variable name..."
              className="h-12 w-full rounded-2xl border border-vault-border bg-vault-surface/80 pl-12 pr-4 text-sm text-slate-100 shadow-inner transition placeholder:text-slate-500 focus:border-vault-purple"
            />
          </label>
          <label className="block">
            <span className="sr-only">Filter by model</span>
            <select
              value={selectedModel}
              onChange={(event) => onModelChange(event.target.value as ModelTag | 'all')}
              className="h-12 w-full rounded-2xl border border-vault-border bg-vault-surface/80 px-4 text-sm font-semibold text-slate-100 transition focus:border-vault-orange"
            >
              <option value="all">All model tags</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}
