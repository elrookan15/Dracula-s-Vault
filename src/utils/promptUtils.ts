import { categories, modelTags } from '../data/seedPrompts';
import type { ModelTag, PromptCategoryId, PromptFormValues, PromptTemplate } from '../types';

export const VARIABLE_PATTERN = /\[([A-Z0-9_]+)\]/g;
/** Matches either `[VARIABLE_NAME]` or `{{variable}}` tokens. */
export const COMBINED_VARIABLE_PATTERN = /\[([A-Z0-9_]+)\]|\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

const categoryIds = new Set(categories.map((category) => category.id));
const modelTagSet = new Set<ModelTag>(modelTags);

interface VariableMatch {
  name: string;
  raw: string;
  index: number;
}

function iterateVariableMatches(prompt: string): VariableMatch[] {
  const matches: VariableMatch[] = [];
  for (const match of prompt.matchAll(COMBINED_VARIABLE_PATTERN)) {
    const name = match[1] ?? match[2];
    if (!name) {
      continue;
    }
    matches.push({ name, raw: match[0], index: match.index ?? 0 });
  }
  return matches;
}

/** `crypto.randomUUID` is unavailable over plain HTTP and in older engines. */
export function createId(prefix: string): string {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) {
      return `${prefix}-${uuid}`;
    }
  } catch {
    // Fall through to the entropy-based identifier below.
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function extractVariables(prompt: string): string[] {
  const variables = new Set<string>();
  for (const match of iterateVariableMatches(prompt)) {
    variables.add(match.name);
  }
  return [...variables].sort((a, b) => a.localeCompare(b));
}

export function interpolatePrompt(prompt: string, values: Record<string, string>): string {
  return prompt.replace(COMBINED_VARIABLE_PATTERN, (raw, bracket: string | undefined, curly: string | undefined) => {
    const name = bracket ?? curly;
    const value = name ? values[name]?.trim() : undefined;
    return value ? value : raw;
  });
}

export function highlightedPromptParts(prompt: string, values: Record<string, string>) {
  const parts: Array<{ text: string; kind: 'static' | 'variable' | 'value' }> = [];
  let lastIndex = 0;

  for (const match of iterateVariableMatches(prompt)) {
    if (match.index > lastIndex) {
      parts.push({ text: prompt.slice(lastIndex, match.index), kind: 'static' });
    }

    const value = values[match.name]?.trim();
    parts.push({ text: value || match.raw, kind: value ? 'value' : 'variable' });
    lastIndex = match.index + match.raw.length;
  }

  if (lastIndex < prompt.length) {
    parts.push({ text: prompt.slice(lastIndex), kind: 'static' });
  }

  return parts;
}

export function createPromptFromValues(values: PromptFormValues, existing?: PromptTemplate): PromptTemplate {
  const timestamp = new Date().toISOString();
  const baseId = values.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return {
    id: existing?.id ?? createId(`custom-${baseId || 'prompt'}`),
    ...values,
    tags: values.tags.map((tag) => tag.trim()).filter(Boolean),
    isFavorite: existing?.isFavorite ?? false,
    isCustom: true,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPromptCategoryId(value: unknown): value is PromptCategoryId {
  return typeof value === 'string' && categoryIds.has(value as PromptCategoryId);
}

function isModelTag(value: unknown): value is ModelTag {
  return typeof value === 'string' && modelTagSet.has(value as ModelTag);
}

export function isPromptTemplate(value: unknown): value is PromptTemplate {
  if (!isRecord(value)) {
    return false;
  }

  const requiredStrings = ['id', 'title', 'description', 'framework', 'prompt', 'createdAt', 'updatedAt'];
  const hasRequiredStrings = requiredStrings.every((key) => typeof value[key] === 'string');
  const tags = value.tags;

  return (
    hasRequiredStrings &&
    isPromptCategoryId(value.categoryId) &&
    isModelTag(value.model) &&
    Array.isArray(tags) &&
    tags.every((tag) => typeof tag === 'string') &&
    typeof value.isFavorite === 'boolean' &&
    typeof value.isCustom === 'boolean'
  );
}

export interface PromptImportResult {
  prompts: PromptTemplate[];
  favoriteIds: string[];
}

export function parsePromptImport(json: string): PromptImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Import failed: JSON is malformed.');
  }

  const favoriteIds =
    isRecord(parsed) && Array.isArray(parsed.favoriteIds)
      ? parsed.favoriteIds.filter((id): id is string => typeof id === 'string')
      : [];
  const payload =
    isRecord(parsed) && Array.isArray(parsed.prompts)
      ? parsed.prompts
      : isRecord(parsed) && Array.isArray(parsed.customPrompts)
        ? parsed.customPrompts
        : isRecord(parsed)
          ? []
          : parsed;

  if (!Array.isArray(payload)) {
    throw new Error('Import failed: expected an array of prompts or an object with a prompts array.');
  }

  const validPrompts = payload.filter(isPromptTemplate);
  if (validPrompts.length === 0 && favoriteIds.length === 0) {
    throw new Error('Import failed: no valid prompt templates or favorite IDs were found.');
  }

  return {
    prompts: validPrompts.map((prompt) => {
      const isSeedPrompt = prompt.id.startsWith('seed-');
      return {
        ...prompt,
        id: isSeedPrompt ? createId(`custom-import-${prompt.id}`) : prompt.id,
        title: isSeedPrompt ? `${prompt.title} Import` : prompt.title,
        isCustom: true,
        updatedAt: new Date().toISOString(),
      };
    }),
    favoriteIds,
  };
}

export function downloadJson(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Sandboxed frames often reject the async clipboard, so fall back to a selection copy. */
function copyViaSelection(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Permission-blocked clipboard access retries through the selection path.
  }

  if (!copyViaSelection(text)) {
    throw new Error('Clipboard access is blocked here. Use Export to save the prompt instead.');
  }
}
