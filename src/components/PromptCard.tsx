import { Copy, GitFork, Pencil, Play, SlidersHorizontal, Star, Trash2, Variable } from 'lucide-react';
import type { PromptCategory, PromptTemplate } from '../types';
import { extractVariables } from '../utils/promptUtils';

interface PromptCardProps {
  prompt: PromptTemplate;
  category: PromptCategory;
  onExecute: (prompt: PromptTemplate) => void;
  onStudio: (prompt: PromptTemplate) => void;
  onEdit: (prompt: PromptTemplate) => void;
  onFork: (prompt: PromptTemplate) => void;
  onFavorite: (promptId: string) => void;
  onDelete: (promptId: string) => void;
  onQuickCopy: (prompt: PromptTemplate) => void;
}

const categoryAccent: Record<PromptCategory['accent'], string> = {
  lime: 'border-vault-lime/30 bg-vault-lime/10 text-vault-lime',
  purple: 'border-vault-purple/30 bg-vault-purple/10 text-vault-purple-soft',
  orange: 'border-vault-orange/30 bg-vault-orange/10 text-vault-orange-soft',
};

export function PromptCard({
  prompt,
  category,
  onExecute,
  onStudio,
  onEdit,
  onFork,
  onFavorite,
  onDelete,
  onQuickCopy,
}: PromptCardProps) {
  const variables = extractVariables(prompt.prompt);

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-vault-border bg-vault-surface/88 p-5 shadow-glow transition hover:-translate-y-1 hover:border-vault-purple/60">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${categoryAccent[category.accent]}`}>
              {category.icon} {category.name}
            </span>
            <span className="rounded-full border border-vault-orange/30 bg-vault-orange/10 px-3 py-1 text-xs font-black text-vault-orange-soft">
              {prompt.model}
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">{prompt.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{prompt.description}</p>
        </div>

        <button
          type="button"
          onClick={() => onFavorite(prompt.id)}
          className={`rounded-xl border p-2 transition ${
            prompt.isFavorite
              ? 'border-vault-orange/50 bg-vault-orange/15 text-vault-orange'
              : 'border-vault-border text-slate-500 hover:border-vault-orange hover:text-vault-orange'
          }`}
          aria-label={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className="h-5 w-5" fill={prompt.isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-vault-border bg-vault-base/70 p-4">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-vault-purple-soft">{prompt.framework}</p>
        <p className="line-clamp-5 font-mono text-xs leading-6 text-slate-300">{prompt.prompt}</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {prompt.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-slate-300">
            #{tag}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 rounded-full bg-vault-purple/10 px-2.5 py-1 text-xs font-black text-vault-purple-soft">
          <Variable className="h-3.5 w-3.5" aria-hidden="true" />
          {variables.length} variables
        </span>
        {prompt.isCustom ? (
          <span className="rounded-full bg-vault-lime/10 px-2.5 py-1 text-xs font-black text-vault-lime">Custom</span>
        ) : null}
      </div>

      <div className="mt-auto grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onExecute(prompt)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-vault-orange px-3 py-2.5 text-sm font-black text-white shadow-orange transition hover:bg-vault-orange-soft"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          Direct Test
        </button>
        <button
          type="button"
          onClick={() => onQuickCopy(prompt)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-vault-lime/40 bg-vault-lime/10 px-3 py-2.5 text-sm font-black text-vault-lime transition hover:bg-vault-lime/15"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy
        </button>
        <button
          type="button"
          onClick={() => onStudio(prompt)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-vault-purple/40 bg-vault-purple/10 px-3 py-2.5 text-sm font-black text-vault-purple-soft transition hover:bg-vault-purple/15"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Studio
        </button>
        <button
          type="button"
          onClick={() => onFork(prompt)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-vault-border px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-vault-purple hover:text-vault-purple-soft"
        >
          <GitFork className="h-4 w-4" aria-hidden="true" />
          Fork
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(prompt)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-vault-border px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-vault-orange hover:text-vault-orange-soft"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(prompt.id)}
            disabled={!prompt.isCustom}
            className="inline-flex items-center justify-center rounded-xl border border-vault-border px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Delete custom prompt"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
