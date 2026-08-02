import { describe, expect, it } from 'vitest';
import { estimateCost, estimateTokens, formatCost, formatTokens } from './tokenizer';

describe('estimateTokens', () => {
  it('returns 0 for empty text', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('grows with text length', () => {
    const short = estimateTokens('hello');
    const long = estimateTokens('hello world this is a longer piece of text');
    expect(long).toBeGreaterThan(short);
  });
});

describe('estimateCost', () => {
  it('is free for Local LLM and non-zero for GPT-4o', () => {
    const local = estimateCost(1000, 'Local LLM');
    const gpt = estimateCost(1000, 'GPT-4o');
    expect(local.totalCost).toBe(0);
    expect(gpt.totalCost).toBeGreaterThan(0);
  });

  it('caps context usage ratio at 1', () => {
    const estimate = estimateCost(10_000_000, 'GPT-4o');
    expect(estimate.contextUsedRatio).toBeLessThanOrEqual(1);
    expect(estimate.contextUsedRatio).toBeGreaterThan(0);
  });
});

describe('formatting helpers', () => {
  it('formats cost', () => {
    expect(formatCost(0)).toBe('Free');
    expect(formatCost(0.0005)).toMatch(/^\$0\.0005$/);
    expect(formatCost(1.5)).toBe('$1.50');
  });

  it('formats tokens with k and M suffixes', () => {
    expect(formatTokens(500)).toBe('500');
    expect(formatTokens(1500)).toBe('1.5k');
    expect(formatTokens(2_000_000)).toBe('2.00M');
  });
});
