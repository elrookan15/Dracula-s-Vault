import { categories, modelTags } from '../data/seedPrompts';
import type { ModelTag, PromptCategoryId, PromptFormValues, PromptTemplate } from '../types';

export const VARIABLE_PATTERN = /\[([A-Z0-9_]+)\]/g;

const categoryIds = new Set(categories.map((category) => category.id));
const modelTagSet = new Set<ModelTag>(modelTags);

export function extractVariables(prompt: string): string[] {
  const variables = new Set<string>();
  for (const match of prompt.matchAll(VARIABLE_PATTERN)) {
    variables.add(match[1]);
  }
  return [...variables].sort((a, b) => a.localeCompare(b));
}

export function interpolatePrompt(prompt: string, values: Record<string, string>): string {
  return prompt.replace(VARIABLE_PATTERN, (match, variable: string) => {
    const value = values[variable]?.trim();
    return value ? value : match;
  });
}

export function highlightedPromptParts(prompt: string, values: Record<string, string>) {
  const parts: Array<{ text: string; kind: 'static' | 'variable' | 'value' }> = [];
  let lastIndex = 0;

  for (const match of prompt.matchAll(VARIABLE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ text: prompt.slice(lastIndex, index), kind: 'static' });
    }

    const variable = match[1];
    const value = values[variable]?.trim();
    parts.push({ text: value || match[0], kind: value ? 'value' : 'variable' });
    lastIndex = index + match[0].length;
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
    id: existing?.id ?? `custom-${baseId || 'prompt'}-${Date.now()}`,
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

export function parsePromptImport(json: string): PromptTemplate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Import failed: JSON is malformed.');
  }

  const payload = isRecord(parsed) && Array.isArray(parsed.prompts) ? parsed.prompts : parsed;
  if (!Array.isArray(payload)) {
    throw new Error('Import failed: expected an array of prompts or an object with a prompts array.');
  }

  const validPrompts = payload.filter(isPromptTemplate);
  if (validPrompts.length === 0) {
    throw new Error('Import failed: no valid prompt templates were found.');
  }

  return validPrompts.map((prompt) => ({
    ...prompt,
    isCustom: true,
    updatedAt: new Date().toISOString(),
  }));
}

export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API is unavailable in this browser.');
  }

  await navigator.clipboard.writeText(text);
}
