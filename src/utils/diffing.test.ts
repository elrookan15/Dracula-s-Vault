import { describe, expect, it } from 'vitest';
import { diffLines, diffStats } from './diffing';

describe('diffLines', () => {
  it('reports added, removed, and unchanged lines', () => {
    const result = diffLines('a\nb\nc', 'a\nx\nc');
    expect(result).toEqual([
      { kind: 'unchanged', text: 'a' },
      { kind: 'removed', text: 'b' },
      { kind: 'added', text: 'x' },
      { kind: 'unchanged', text: 'c' },
    ]);
  });

  it('treats identical input as fully unchanged', () => {
    const result = diffLines('same\ntext', 'same\ntext');
    expect(result.every((line) => line.kind === 'unchanged')).toBe(true);
  });

  it('falls back to a linear diff for very large inputs without throwing', () => {
    const before = Array.from({ length: 1100 }, (_, i) => `line-${i}`).join('\n');
    const afterLines = Array.from({ length: 1100 }, (_, i) => `line-${i}`);
    afterLines[550] = 'CHANGED';
    const after = afterLines.join('\n');

    const result = diffLines(before, after);
    const stats = diffStats(result);
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(1);
  });
});

describe('diffStats', () => {
  it('counts added and removed lines', () => {
    const stats = diffStats([
      { kind: 'added', text: '1' },
      { kind: 'added', text: '2' },
      { kind: 'removed', text: '3' },
      { kind: 'unchanged', text: '4' },
    ]);
    expect(stats).toEqual({ added: 2, removed: 1 });
  });
});
