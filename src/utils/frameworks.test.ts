import { describe, expect, it } from 'vitest';
import { frameworks, getFramework, scaffoldFramework } from './frameworks';

describe('frameworks catalog', () => {
  it('exposes the six required frameworks', () => {
    const ids = frameworks.map((f) => f.id);
    expect(ids).toHaveLength(6);
    expect(ids).toEqual(expect.arrayContaining(['RTCC', 'CRISPE', 'STCO', 'TCREI', 'ReAct', 'ToT']));
  });

  it('falls back to the first framework for an unknown id', () => {
    // @ts-expect-error intentionally invalid id
    expect(getFramework('NOPE').id).toBe(frameworks[0].id);
  });
});

describe('scaffoldFramework', () => {
  it('renders section headings and fills provided values', () => {
    const out = scaffoldFramework('RTCC', { role: 'engineer' });
    expect(out).toContain('## Role');
    expect(out).toContain('engineer');
    // Unfilled sections show an uppercase placeholder token.
    expect(out).toContain('[TASK]');
  });

  it('renders the ReAct loop', () => {
    const out = scaffoldFramework('ReAct', { objective: 'help' });
    expect(out).toContain('Thought:');
    expect(out).toContain('Action:');
    expect(out).toContain('Observation:');
  });

  it('renders the Tree of Thoughts structure', () => {
    const out = scaffoldFramework('ToT', {});
    expect(out.toLowerCase()).toContain('branch');
  });
});
