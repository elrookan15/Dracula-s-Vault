import { useEffect, useMemo, useRef, useState } from 'react';
import { seedPrompts } from '../data/seedPrompts';
import type { PromptFormValues, PromptTemplate } from '../types';
import { createId, createPromptFromValues, isPromptTemplate, parsePromptImport } from '../utils/promptUtils';
import { createVaultStorage, type VaultStorage } from '../utils/safeStorage';

const STORAGE_KEY = 'promptvault-studio:vault';

interface StoredVault {
  customPrompts: PromptTemplate[];
  favoriteIds: string[];
}

const defaultFavoriteIds = seedPrompts.filter((prompt) => prompt.isFavorite).map((prompt) => prompt.id);

const initialVault: StoredVault = {
  customPrompts: [],
  favoriteIds: defaultFavoriteIds,
};

function readStoredVault(storage: VaultStorage): StoredVault {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return initialVault;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredVault>;
    return {
      customPrompts: Array.isArray(parsed.customPrompts) ? parsed.customPrompts.filter(isPromptTemplate) : [],
      favoriteIds: Array.isArray(parsed.favoriteIds)
        ? parsed.favoriteIds.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return initialVault;
  }
}

export function usePromptVault() {
  const storageRef = useRef<VaultStorage | null>(null);
  storageRef.current ??= createVaultStorage();
  const storage = storageRef.current;

  const [storedVault, setStoredVault] = useState<StoredVault>(() => readStoredVault(storage));
  const favoriteIdSet = useMemo(() => new Set(storedVault.favoriteIds), [storedVault.favoriteIds]);

  useEffect(() => {
    storage.setItem(STORAGE_KEY, JSON.stringify(storedVault));
  }, [storage, storedVault]);

  const prompts = useMemo<PromptTemplate[]>(() => {
    const seeded = seedPrompts.map((prompt) => ({
      ...prompt,
      isFavorite: favoriteIdSet.has(prompt.id),
    }));

    const custom = storedVault.customPrompts.map((prompt) => ({
      ...prompt,
      isFavorite: favoriteIdSet.has(prompt.id),
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
      id: createId('custom-fork'),
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
      const importedIds = new Set(imported.prompts.map((prompt) => prompt.id));
      const importedFavorites = imported.prompts.filter((prompt) => prompt.isFavorite).map((prompt) => prompt.id);
      const nextFavorites = new Set([...current.favoriteIds, ...imported.favoriteIds, ...importedFavorites]);
      const retained = current.customPrompts.filter((prompt) => !importedIds.has(prompt.id));
      return {
        customPrompts: [...imported.prompts, ...retained],
        favoriteIds: [...nextFavorites],
      };
    });

    return imported.prompts.length;
  }

  function exportVault() {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        favoriteIds: storedVault.favoriteIds,
        prompts: storedVault.customPrompts,
      },
      null,
      2,
    );
  }

  return {
    prompts,
    isPersistent: storage.isPersistent,
    toggleFavorite,
    savePrompt,
    deletePrompt,
    forkPrompt,
    importPrompts,
    exportVault,
  };
}
