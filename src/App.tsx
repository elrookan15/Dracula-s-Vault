import { AlertCircle, CheckCircle2, Flame, LibraryBig, SlidersHorizontal, Terminal } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ArchitectureLab } from './components/ArchitectureLab';
import { CategorySidebar } from './components/CategorySidebar';
import { Header } from './components/Header';
import { PromptCard } from './components/PromptCard';
import { PromptEditorModal } from './components/PromptEditorModal';
import { PromptStudio } from './components/PromptStudio';
import { VariableModal } from './components/VariableModal';
import { categories, modelTags } from './data/seedPrompts';
import { usePromptVault } from './hooks/usePromptVault';
import type { ModelTag, PromptCategoryId, PromptFormValues, PromptTemplate } from './types';
import { copyToClipboard, downloadJson, extractVariables } from './utils/promptUtils';

interface ToastState {
  message: string;
  tone: 'success' | 'error';
}

function App() {
  const { prompts, isPersistent, toggleFavorite, savePrompt, deletePrompt, forkPrompt, importPrompts, exportVault } =
    usePromptVault();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategoryId | 'all'>('all');
  const [selectedModel, setSelectedModel] = useState<ModelTag | 'all'>('all');
  const [executingPrompt, setExecutingPrompt] = useState<PromptTemplate | null>(null);
  const [studioPrompt, setStudioPrompt] = useState<PromptTemplate | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), []);

  const categoryCounts = useMemo(() => {
    return prompts.reduce(
      (counts, prompt) => {
        counts[prompt.categoryId] += 1;
        return counts;
      },
      Object.fromEntries(categories.map((category) => [category.id, 0])) as Record<PromptCategoryId, number>,
    );
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return prompts.filter((prompt) => {
      const category = categoryById.get(prompt.categoryId);
      const variableText = extractVariables(prompt.prompt).join(' ').toLowerCase();
      const searchable = [
        prompt.title,
        prompt.description,
        prompt.framework,
        prompt.prompt,
        prompt.model,
        category?.name ?? '',
        prompt.tags.join(' '),
        variableText,
      ]
        .join(' ')
        .toLowerCase();

      return (
        (selectedCategory === 'all' || prompt.categoryId === selectedCategory) &&
        (selectedModel === 'all' || prompt.model === selectedModel) &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [categoryById, prompts, searchQuery, selectedCategory, selectedModel]);

  const favoriteCount = prompts.filter((prompt) => prompt.isFavorite).length;
  const customCount = prompts.filter((prompt) => prompt.isCustom).length;

  function showToast(message: string, tone: ToastState['tone'] = 'success') {
    setToast({ message, tone });
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  }

  async function handleCopy(text: string) {
    try {
      await copyToClipboard(text);
      showToast('Copied formatted prompt to clipboard.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Copy failed.', 'error');
    }
  }

  function handleSave(values: PromptFormValues, existing?: PromptTemplate) {
    savePrompt(values, existing);
    showToast(existing?.isCustom ? 'Prompt updated.' : 'Prompt saved as a custom template.');
  }

  function handleFork(prompt: PromptTemplate) {
    const forked = forkPrompt(prompt);
    showToast(`Forked "${forked.title}" into your custom library.`);
  }

  function handleDelete(promptId: string) {
    deletePrompt(promptId);
    showToast('Custom prompt deleted.');
  }

  function handleStudioSaveFork(title: string, promptText: string, model: ModelTag) {
    const source = studioPrompt;
    savePrompt({
      title,
      categoryId: source?.categoryId ?? 'writing',
      model,
      description: source?.description ?? 'Refined in Prompt Studio.',
      framework: source?.framework ?? 'Custom',
      prompt: promptText,
      tags: source?.tags ?? [],
    });
    showToast('Saved studio draft as a new custom prompt.');
  }

  function handleExport() {
    downloadJson(`promptvault-studio-backup-${new Date().toISOString().slice(0, 10)}.json`, exportVault());
    showToast('Vault backup exported.');
  }

  async function handleImport(file: File) {
    try {
      const importedCount = importPrompts(await file.text());
      showToast(`Imported ${importedCount} prompt${importedCount === 1 ? '' : 's'}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Import failed.', 'error');
    }
  }

  return (
    <main className="min-h-screen bg-vault-radial text-slate-100">
      <Header
        searchQuery={searchQuery}
        selectedModel={selectedModel}
        models={modelTags}
        onSearchChange={setSearchQuery}
        onModelChange={setSelectedModel}
        onNewPrompt={() => {
          setEditingPrompt(null);
          setIsEditorOpen(true);
        }}
        onExport={handleExport}
        onImport={handleImport}
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {!isPersistent ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-vault-orange/40 bg-vault-orange/10 px-4 py-3">
            <Terminal className="mt-0.5 h-5 w-5 shrink-0 text-vault-orange" aria-hidden="true" />
            <p className="text-sm leading-6 text-vault-orange-soft">
              <span className="font-black text-white">Session-only mode.</span> Browser storage is blocked in this
              environment, so the vault runs in memory. Use Export to save your prompts and Import to restore them.
            </p>
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-3xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <LibraryBig className="h-5 w-5 text-vault-purple-soft" aria-hidden="true" />
              <span className="rounded-full bg-vault-purple/10 px-2 py-1 text-xs font-black text-vault-purple-soft">
                {prompts.length}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-400">Total templates</p>
            <p className="mt-1 text-3xl font-black text-white">Master Vault</p>
          </div>

          <div className="glass-panel rounded-3xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <Flame className="h-5 w-5 text-vault-orange" aria-hidden="true" />
              <span className="rounded-full bg-vault-orange/10 px-2 py-1 text-xs font-black text-vault-orange-soft">
                {favoriteCount}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-400">Favorited workflows</p>
            <p className="mt-1 text-3xl font-black text-white">High Signal</p>
          </div>

          <div className="glass-panel rounded-3xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <SlidersHorizontal className="h-5 w-5 text-vault-lime" aria-hidden="true" />
              <span className="rounded-full bg-vault-lime/10 px-2 py-1 text-xs font-black text-vault-lime">
                {customCount}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-400">Custom local templates</p>
            <p className="mt-1 text-3xl font-black text-white">Persistent</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            counts={categoryCounts}
            totalCount={prompts.length}
            onSelect={setSelectedCategory}
          />

          <div className="space-y-6">
            <section>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-vault-lime">Prompt Library</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Production-grade templates</h2>
                </div>
                <p className="text-sm font-semibold text-slate-400">
                  Showing {filteredPrompts.length} of {prompts.length}
                </p>
              </div>

              {filteredPrompts.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredPrompts.map((prompt) => {
                    const category = categoryById.get(prompt.categoryId) ?? categories[0];
                    return (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        category={category}
                        onExecute={setExecutingPrompt}
                        onStudio={setStudioPrompt}
                        onEdit={(target) => {
                          setEditingPrompt(target);
                          setIsEditorOpen(true);
                        }}
                        onFork={handleFork}
                        onFavorite={toggleFavorite}
                        onDelete={handleDelete}
                        onQuickCopy={(target) => handleCopy(target.prompt)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="glass-panel rounded-3xl p-8 text-center">
                  <AlertCircle className="mx-auto mb-4 h-9 w-9 text-vault-orange" aria-hidden="true" />
                  <h3 className="text-xl font-black text-white">No prompts match this filter stack.</h3>
                  <p className="mt-2 text-sm text-slate-400">Clear search, category, or model filters to expand the vault.</p>
                </div>
              )}
            </section>

            <ArchitectureLab />
          </div>
        </div>
      </section>

      <VariableModal
        prompt={executingPrompt}
        isOpen={Boolean(executingPrompt)}
        onClose={() => setExecutingPrompt(null)}
        onCopy={handleCopy}
      />

      <PromptStudio
        prompt={studioPrompt}
        isOpen={Boolean(studioPrompt)}
        onClose={() => setStudioPrompt(null)}
        onCopy={handleCopy}
        onSaveFork={handleStudioSaveFork}
      />

      <PromptEditorModal
        prompt={editingPrompt}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
      />

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-vault-border bg-vault-surface px-4 py-3 shadow-2xl">
          <div className="flex items-center gap-3">
            {toast.tone === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-vault-lime" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-vault-orange" aria-hidden="true" />
            )}
            <p className="text-sm font-bold text-white">{toast.message}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
