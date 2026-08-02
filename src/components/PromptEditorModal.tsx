import { Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { categories, modelTags } from '../data/seedPrompts';
import type { PromptCategoryId, PromptFormValues, PromptTemplate } from '../types';

interface PromptEditorModalProps {
  prompt: PromptTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: PromptFormValues, existing?: PromptTemplate) => void;
}

const emptyForm: PromptFormValues = {
  title: '',
  categoryId: 'writing',
  model: 'GPT-4o',
  description: '',
  framework: '',
  prompt: '',
  tags: [],
};

export function PromptEditorModal({ prompt, isOpen, onClose, onSave }: PromptEditorModalProps) {
  const [form, setForm] = useState<PromptFormValues>(emptyForm);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (prompt) {
      setForm({
        title: prompt.title,
        categoryId: prompt.categoryId,
        model: prompt.model,
        description: prompt.description,
        framework: prompt.framework,
        prompt: prompt.prompt,
        tags: prompt.tags,
      });
      setTagInput(prompt.tags.join(', '));
    } else {
      setForm(emptyForm);
      setTagInput('');
    }
  }, [prompt, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField<Key extends keyof PromptFormValues>(key: Key, value: PromptFormValues[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tags = tagInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    onSave({ ...form, tags }, prompt ?? undefined);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close editor" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="glass-panel relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-vault-orange">Prompt Editor</p>
            <h2 className="mt-2 text-2xl font-black text-white">
              {prompt ? (prompt.isCustom ? 'Edit Custom Prompt' : 'Fork Seed Prompt') : 'Create New Prompt'}
            </h2>
            {!prompt?.isCustom && prompt ? (
              <p className="mt-2 text-sm text-slate-400">Seed prompts are protected. Saving creates a custom fork.</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-vault-border p-2 text-slate-400 transition hover:border-vault-orange hover:text-vault-orange"
            aria-label="Close prompt editor"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-300">Title</span>
            <input
              required
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="w-full rounded-2xl border border-vault-border bg-vault-base px-4 py-3 text-sm text-white focus:border-vault-orange"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">Category</span>
            <select
              value={form.categoryId}
              onChange={(event) => updateField('categoryId', event.target.value as PromptCategoryId)}
              className="w-full rounded-2xl border border-vault-border bg-vault-base px-4 py-3 text-sm text-white focus:border-vault-purple"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">Model Tag</span>
            <select
              value={form.model}
              onChange={(event) => updateField('model', event.target.value as PromptFormValues['model'])}
              className="w-full rounded-2xl border border-vault-border bg-vault-base px-4 py-3 text-sm text-white focus:border-vault-orange"
            >
              {modelTags.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-300">Description</span>
            <input
              required
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="w-full rounded-2xl border border-vault-border bg-vault-base px-4 py-3 text-sm text-white focus:border-vault-purple"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-300">Framework Tag</span>
            <input
              required
              value={form.framework}
              onChange={(event) => updateField('framework', event.target.value)}
              className="w-full rounded-2xl border border-vault-border bg-vault-base px-4 py-3 text-sm text-white focus:border-vault-lime"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-300">Tags (comma separated)</span>
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              className="w-full rounded-2xl border border-vault-border bg-vault-base px-4 py-3 text-sm text-white focus:border-vault-orange"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-300">System Prompt Text</span>
            <textarea
              required
              value={form.prompt}
              onChange={(event) => updateField('prompt', event.target.value)}
              rows={10}
              placeholder="Use [VARIABLE_NAME] tokens to activate the dynamic variable engine."
              className="w-full resize-y rounded-2xl border border-vault-border bg-vault-base px-4 py-3 font-mono text-sm leading-6 text-white focus:border-vault-purple"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-vault-border px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-slate-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-vault-orange px-4 py-2.5 text-sm font-black text-white shadow-orange transition hover:bg-vault-orange-soft"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Prompt
          </button>
        </div>
      </form>
    </div>
  );
}
