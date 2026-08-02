import { Grid2X2, Sparkles } from 'lucide-react';
import type { PromptCategory, PromptCategoryId } from '../types';

interface CategorySidebarProps {
  categories: PromptCategory[];
  selectedCategory: PromptCategoryId | 'all';
  counts: Record<PromptCategoryId, number>;
  totalCount: number;
  onSelect: (category: PromptCategoryId | 'all') => void;
}

const accentClasses: Record<PromptCategory['accent'], string> = {
  lime: 'text-vault-lime border-vault-lime/30 bg-vault-lime/10',
  purple: 'text-vault-purple-soft border-vault-purple/30 bg-vault-purple/10',
  orange: 'text-vault-orange-soft border-vault-orange/30 bg-vault-orange/10',
};

export function CategorySidebar({
  categories,
  selectedCategory,
  counts,
  totalCount,
  onSelect,
}: CategorySidebarProps) {
  return (
    <aside className="glass-panel rounded-3xl p-3 lg:sticky lg:top-36">
      <div className="mb-3 flex items-center justify-between px-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Vault Index</p>
          <h2 className="text-lg font-black text-white">Categories</h2>
        </div>
        <Sparkles className="h-5 w-5 text-vault-lime" aria-hidden="true" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={`flex min-w-56 items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
            selectedCategory === 'all'
              ? 'border-vault-orange bg-vault-orange/15 text-white'
              : 'border-transparent text-slate-300 hover:border-vault-border hover:bg-white/[0.03]'
          }`}
        >
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-vault-surface">
              <Grid2X2 className="h-4 w-4 text-vault-orange" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold">All Categories</span>
              <span className="text-xs text-slate-500">Master vault</span>
            </span>
          </span>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black">{totalCount}</span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`flex min-w-64 items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
              selectedCategory === category.id
                ? 'border-vault-purple bg-vault-purple/15 text-white'
                : 'border-transparent text-slate-300 hover:border-vault-border hover:bg-white/[0.03]'
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${accentClasses[category.accent]}`}>
                {category.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{category.name}</span>
                <span className="text-xs text-slate-500">{category.id}</span>
              </span>
            </span>
            <span className="ml-3 rounded-full bg-white/10 px-2 py-1 text-xs font-black">{counts[category.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
