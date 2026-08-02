import { useEffect, useMemo, useState } from 'react';
import { seedPrompts } from '../data/seedPrompts';
import type { PromptFormValues, PromptTemplate } from '../types';
import { createPromptFromValues, parsePromptImport } from '../utils/promptUtils';

const STORAGE_KEY = 'promptvault-studio:vault';

interface StoredVault {
  customPrompts: PromptTemplate[];
  favoriteIds: string[];
}

const emptyVault: StoredVault = {
  customPrompts: [],
  favoriteIds: [],
};

function readStoredVault(): StoredVault {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyVault;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredVault>;
    return {
      customPrompts: Array.isArray(parsed.customPrompts) ? parsed.customPrompts.filter(Boolean) : [],
      favoriteIds: Array.isArray(parsed.favoriteIds)
        ? parsed.favoriteIds.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return emptyVault;
  }
}

export function usePromptVault() {
  const [storedVault, setStoredVault] = useState<StoredVault>(() => readStoredVault());
  const favoriteIdSet = useMemo(() => new Set(storedVault.favoriteIds), [storedVault.favoriteIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedVault));
  }, [storedVault]);

  const prompts = useMemo<PromptTemplate[]>(() => {
    const seeded = seedPrompts.map((prompt) => ({
      ...prompt,
      isFavorite: favoriteIdSet.has(prompt.id) || prompt.isFavorite,
    }));

    const custom = storedVault.customPrompts.map((prompt) => ({
      ...prompt,
      isFavorite: favoriteIdSet.has(prompt.id) || prompt.isFavorite,
    }));

    return [...custom, ...seeded];
  }, [favoriteIdSet, storedVault.customPrompts]);

  function toggleFavorite(promptId: string) {
    setStoredVault((current) => {
      const nextFavorites = new Set(current.favoriteIds);
      if (nextFavorites.has(promptId)) {
        nextFavorites.delete(promptId);
      } else {
        nextFavorites.add(promptId);
      }

      return { ...current, favoriteIds: [...nextFavorites] };
    });
  }

  function savePrompt(values: PromptFormValues, existing?: PromptTemplate) {
    const nextPrompt = createPromptFromValues(values, existing?.isCustom ? existing : undefined);
    setStoredVault((current) => {
      const withoutExisting = current.customPrompts.filter((prompt) => prompt.id !== nextPrompt.id);
      return { ...current, customPrompts: [nextPrompt, ...withoutExisting] };
    });

    return nextPrompt;
  }

  function deletePrompt(promptId: string) {
    setStoredVault((current) => ({
      customPrompts: current.customPrompts.filter((prompt) => prompt.id !== promptId),
      favoriteIds: current.favoriteIds.filter((id) => id !== promptId),
    }));
  }

  function forkPrompt(prompt: PromptTemplate) {
    const timestamp = new Date().toISOString();
    const forked: PromptTemplate = {
      ...prompt,
      id: `custom-fork-${Date.now()}`,
      title: `${prompt.title} Fork`,
      isCustom: true,
      isFavorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setStoredVault((current) => ({ ...current, customPrompts: [forked, ...current.customPrompts] }));
    return forked;
  }

  function importPrompts(json: string) {
    const imported = parsePromptImport(json);
    setStoredVault((current) => {
      const importedIds = new Set(imported.map((prompt) => prompt.id));
      const retained = current.customPrompts.filter((prompt) => !importedIds.has(prompt.id));
      return { ...current, customPrompts: [...imported, ...retained] };
    });

    return imported.length;
  }

  function exportVault() {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        prompts: prompts.map((prompt) => ({ ...prompt, isCustom: prompt.isCustom || prompt.id.startsWith('seed-') })),
      },
      null,
      2,
    );
  }

  return {
    prompts,
    toggleFavorite,
    savePrompt,
    deletePrompt,
    forkPrompt,
    importPrompts,
    exportVault,
  };
}
