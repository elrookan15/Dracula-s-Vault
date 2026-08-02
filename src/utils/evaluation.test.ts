import { describe, expect, it } from 'vitest';
import { evaluatePrompt } from './evaluation';

function gate(prompt: string, key: string) {
  const result = evaluatePrompt(prompt);
  const found = result.gates.find((entry) => entry.key === key);
  if (!found) {
    throw new Error(`gate ${key} missing`);
  }
  return found;
}

describe('evaluatePrompt guardrail matching', () => {
  it('does not count guard terms that only appear as substrings', () => {
    // "commonly" contains "only"; boundary matching must not credit it.
    expect(gate('This is commonly used', 'guardrails').score).toBe(0);
  });

  it('counts a real standalone guard term', () => {
    expect(gate('Use only the provided context', 'guardrails').score).toBeGreaterThan(0);
  });
});

describe('evaluatePrompt scoring', () => {
  it('scores a rich, structured prompt higher than a bare one', () => {
    const bare = evaluatePrompt('hi');
    const rich = evaluatePrompt(
      'You are an expert editor. Analyze the [DRAFT] for a technical audience. Output a markdown bullet list. Do not use filler. Never invent facts.',
    );
    expect(rich.total).toBeGreaterThan(bare.total);
    expect(['A', 'B', 'C', 'D']).toContain(rich.grade);
  });

  it('rewards variable definition', () => {
    expect(gate('Summarize [INPUT] for [AUDIENCE]', 'variables').score).toBeGreaterThan(
      gate('Summarize the input', 'variables').score,
    );
  });
});
