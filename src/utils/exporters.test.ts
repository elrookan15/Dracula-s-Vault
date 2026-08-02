import { describe, expect, it } from 'vitest';
import { buildAgentFile, buildCopyPayload, toApiPayload, toMarkdownDoc } from './exporters';
import type { PromptTemplate } from '../types';

const prompt: PromptTemplate = {
  id: 'p1',
  title: 'My Prompt',
  categoryId: 'code',
  model: 'GPT-4o',
  description: 'desc',
  framework: 'STCO',
  prompt: 'Do the thing with [X]',
  tags: ['t'],
  isFavorite: false,
  isCustom: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('toMarkdownDoc', () => {
  it('uses a fence longer than any backtick run inside the content', () => {
    const content = 'here is code:\n```js\nconst a = 1;\n```';
    const doc = toMarkdownDoc(prompt, content);
    // content has a run of 3 backticks, so the outer fence must be at least 4.
    expect(doc).toContain('````text');
    expect(doc.trimEnd().endsWith('````')).toBe(true);
  });

  it('uses a plain triple fence when content has no backticks', () => {
    const doc = toMarkdownDoc(prompt, 'plain content');
    expect(doc).toContain('```text');
  });
});

describe('toApiPayload', () => {
  it('produces a chat payload with system and user messages', () => {
    const payload = JSON.parse(toApiPayload(prompt, 'system text'));
    expect(payload.model).toBe('gpt-4o');
    expect(payload.messages[0]).toEqual({ role: 'system', content: 'system text' });
    expect(payload.messages[1].role).toBe('user');
  });
});

describe('buildCopyPayload', () => {
  it('differentiates raw from interpolated output', () => {
    expect(buildCopyPayload(prompt, 'raw', 'INTERP')).toBe('Do the thing with [X]');
    expect(buildCopyPayload(prompt, 'interpolated', 'INTERP')).toBe('INTERP');
  });

  it('supports api and markdown formats', () => {
    expect(buildCopyPayload(prompt, 'apiPayload', 'INTERP')).toContain('"messages"');
    expect(buildCopyPayload(prompt, 'markdown', 'INTERP')).toContain('# My Prompt');
  });
});

describe('buildAgentFile mdc', () => {
  it('escapes YAML front matter built from free text', () => {
    const file = buildAgentFile('mdc', {
      projectName: 'my proj: v2',
      standards: 'Use strict mode\nWrite tests',
      globs: 'src/**/*.ts, test/**/*.ts',
      body: 'body',
    });
    expect(file.filename).toBe('project-rules.mdc');
    // Colon-containing description must be quoted.
    expect(file.content).toContain('description: "Standing orders for my proj: v2"');
    // Globs render as a quoted flow sequence.
    expect(file.content).toContain('globs: ["src/**/*.ts", "test/**/*.ts"]');
  });

  it('produces the expected filenames for each format', () => {
    expect(buildAgentFile('cursorrules', { projectName: 'p', standards: '', globs: '', body: '' }).filename).toBe(
      '.cursorrules',
    );
    expect(buildAgentFile('claude-md', { projectName: 'p', standards: '', globs: '', body: '' }).filename).toBe(
      'CLAUDE.md',
    );
  });
});
