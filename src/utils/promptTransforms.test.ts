import { describe, expect, it } from 'vitest';
import { buildSlopConstraint, detectSlop, findSlopSpans } from './promptTransforms';

describe('findSlopSpans', () => {
  it('flags slop phrases and preserves surrounding text', () => {
    const spans = findSlopSpans('We must delve into the tapestry today');
    const slopWords = spans.filter((s) => s.slop).map((s) => s.text.toLowerCase());
    expect(slopWords).toContain('delve');
    expect(slopWords).toContain('tapestry');
    // Reassembling spans must reproduce the original text exactly.
    expect(spans.map((s) => s.text).join('')).toBe('We must delve into the tapestry today');
  });

  it('does not flag slop words embedded in larger words', () => {
    const spans = findSlopSpans('The delved trench and unleashed potential');
    // "delve" inside "delved" and "unleash" inside "unleashed" must not match.
    expect(spans.every((s) => !s.slop)).toBe(true);
  });

  it('returns a single non-slop span for clean text', () => {
    const spans = findSlopSpans('a clean sentence');
    expect(spans).toEqual([{ text: 'a clean sentence', slop: false }]);
  });

  it('matches multi-word phrases case-insensitively', () => {
    const spans = findSlopSpans('In Conclusion, this works');
    expect(spans.some((s) => s.slop && s.text.toLowerCase() === 'in conclusion')).toBe(true);
  });
});

describe('buildSlopConstraint', () => {
  it('produces a normalized negative constraint', () => {
    expect(buildSlopConstraint('Delve')).toBe('Never use the word or phrase "delve".');
  });
});

describe('detectSlop still works', () => {
  it('lists matched phrases', () => {
    expect(detectSlop('a testament to the tapestry')).toContain('tapestry');
  });
});
