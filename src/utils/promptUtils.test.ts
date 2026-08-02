import { describe, expect, it } from 'vitest';
import {
  createId,
  extractVariables,
  highlightedPromptParts,
  interpolatePrompt,
  isPromptTemplate,
  parsePromptImport,
} from './promptUtils';
import type { PromptTemplate } from '../types';

const sampleTemplate: PromptTemplate = {
  id: 'seed-x',
  title: 'X',
  categoryId: 'writing',
  model: 'GPT-4o',
  description: 'd',
  framework: 'f',
  prompt: 'Hello [NAME] and {{place}}',
  tags: ['a'],
  isFavorite: false,
  isCustom: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('extractVariables', () => {
  it('captures both [VAR] and {{var}} syntaxes, de-duplicated and sorted', () => {
    expect(extractVariables('a [ONE] b {{two}} c [ONE]')).toEqual(['ONE', 'two']);
  });

  it('returns empty array when there are no variables', () => {
    expect(extractVariables('nothing here')).toEqual([]);
  });
});

describe('interpolatePrompt', () => {
  it('replaces provided values and leaves unknown tokens intact', () => {
    expect(interpolatePrompt('Hi [NAME], from {{place}}', { NAME: 'Sam' })).toBe('Hi Sam, from {{place}}');
  });

  it('does not crash on prototype-property variable names', () => {
    expect(() => interpolatePrompt('X {{constructor}} {{toString}} [VALUEOF]', {})).not.toThrow();
    expect(interpolatePrompt('{{constructor}}', {})).toBe('{{constructor}}');
  });

  it('uses an own value even when it shadows a prototype name', () => {
    expect(interpolatePrompt('{{toString}}', { toString: 'done' })).toBe('done');
  });
});

describe('highlightedPromptParts', () => {
  it('marks filled values and unresolved variables', () => {
    const parts = highlightedPromptParts('a [NAME] b', { NAME: 'Sam' });
    expect(parts).toEqual([
      { text: 'a ', kind: 'static' },
      { text: 'Sam', kind: 'value' },
      { text: ' b', kind: 'static' },
    ]);
  });

  it('does not crash on prototype-property names', () => {
    expect(() => highlightedPromptParts('{{constructor}}', {})).not.toThrow();
  });
});

describe('createId', () => {
  it('produces unique, prefixed ids', () => {
    const a = createId('custom');
    const b = createId('custom');
    expect(a.startsWith('custom-')).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe('isPromptTemplate', () => {
  it('accepts a well-formed template and rejects malformed input', () => {
    expect(isPromptTemplate(sampleTemplate)).toBe(true);
    expect(isPromptTemplate({ ...sampleTemplate, categoryId: 'not-real' })).toBe(false);
    expect(isPromptTemplate({ ...sampleTemplate, model: 'GPT-9' })).toBe(false);
    expect(isPromptTemplate(null)).toBe(false);
    expect(isPromptTemplate([sampleTemplate])).toBe(false);
  });
});

describe('parsePromptImport', () => {
  it('accepts a { prompts: [...] } payload and marks entries custom', () => {
    const json = JSON.stringify({ prompts: [{ ...sampleTemplate, id: 'custom-1', isCustom: true }] });
    const result = parsePromptImport(json);
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0].isCustom).toBe(true);
  });

  it('re-ids seed prompts on import to avoid collisions', () => {
    const json = JSON.stringify([sampleTemplate]);
    const result = parsePromptImport(json);
    expect(result.prompts[0].id).not.toBe('seed-x');
    expect(result.prompts[0].id.startsWith('custom-import-')).toBe(true);
  });

  it('throws on malformed JSON', () => {
    expect(() => parsePromptImport('{ not json')).toThrow(/malformed/i);
  });

  it('throws when no valid templates are present', () => {
    expect(() => parsePromptImport(JSON.stringify([{ nope: true }]))).toThrow(/no valid/i);
  });
});
