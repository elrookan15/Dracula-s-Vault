import { describe, expect, it } from 'vitest';
import { createExemplar, formatExemplars, type Exemplar } from './fewShot';

const examples: Exemplar[] = [
  { id: '1', input: 'hi', output: 'hello' },
  { id: '2', input: 'name: bob', output: 'ok' },
];

describe('createExemplar', () => {
  it('creates an empty exemplar with an id', () => {
    const example = createExemplar();
    expect(example.id).toBeTruthy();
    expect(example.input).toBe('');
    expect(example.output).toBe('');
  });
});

describe('formatExemplars', () => {
  it('returns empty string when nothing is filled', () => {
    expect(formatExemplars([createExemplar()], 'json')).toBe('');
  });

  it('emits JSON pairs', () => {
    const parsed = JSON.parse(formatExemplars(examples, 'json'));
    expect(parsed).toEqual([
      { input: 'hi', output: 'hello' },
      { input: 'name: bob', output: 'ok' },
    ]);
  });

  it('quotes YAML values that contain colons', () => {
    const yaml = formatExemplars(examples, 'yaml');
    expect(yaml).toContain('input: "name: bob"');
    expect(yaml).toContain('input: hi');
  });

  it('emits markdown code blocks', () => {
    const md = formatExemplars(examples, 'markdown');
    expect(md).toContain('### Example 1');
    expect(md).toContain('**Input**');
  });
});
