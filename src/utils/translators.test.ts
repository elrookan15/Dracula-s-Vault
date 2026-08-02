import { describe, expect, it } from 'vitest';
import { translatePrompt } from './translators';
import type { PromptTemplate } from '../types';

const prompt: PromptTemplate = {
  id: 'p1',
  title: 'T',
  categoryId: 'writing',
  model: 'GPT-4o',
  description: 'd',
  framework: 'f',
  prompt: 'You are helpful.',
  tags: [],
  isFavorite: false,
  isCustom: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('translatePrompt', () => {
  it('produces a valid OpenAI chat payload', () => {
    const parsed = JSON.parse(translatePrompt(prompt, 'openai'));
    expect(parsed.model).toBe('gpt-4o');
    expect(parsed.messages[0]).toEqual({ role: 'system', content: 'You are helpful.' });
  });

  it('wraps Claude output in XML tags', () => {
    const out = translatePrompt(prompt, 'claude');
    expect(out).toContain('<system>');
    expect(out).toContain('<user>');
  });

  it('produces a Gemini systemInstruction payload', () => {
    const parsed = JSON.parse(translatePrompt(prompt, 'gemini'));
    expect(parsed.systemInstruction.parts[0].text).toBe('You are helpful.');
  });

  it('produces an Ollama Modelfile', () => {
    const out = translatePrompt(prompt, 'ollama');
    expect(out).toContain('FROM ');
    expect(out).toContain('SYSTEM');
  });
});
