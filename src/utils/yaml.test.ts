import { describe, expect, it } from 'vitest';
import { toYamlFlowSequence, toYamlScalar } from './yaml';

describe('toYamlScalar', () => {
  it('leaves simple values unquoted', () => {
    expect(toYamlScalar('simple-value_1')).toBe('simple-value_1');
    expect(toYamlScalar('src/utils/file.ts')).toBe('src/utils/file.ts');
  });

  it('quotes empty strings', () => {
    expect(toYamlScalar('')).toBe('""');
  });

  it('quotes values containing colons or glob/special characters', () => {
    expect(toYamlScalar('has: colon')).toBe('"has: colon"');
    expect(toYamlScalar('a "quote"')).toBe(JSON.stringify('a "quote"'));
    expect(toYamlScalar('src/**/*.ts')).toBe(JSON.stringify('src/**/*.ts'));
  });

  it('quotes YAML reserved words', () => {
    expect(toYamlScalar('true')).toBe('"true"');
    expect(toYamlScalar('null')).toBe('"null"');
  });
});

describe('toYamlFlowSequence', () => {
  it('renders an empty array', () => {
    expect(toYamlFlowSequence([])).toBe('[]');
  });

  it('quotes each entry', () => {
    expect(toYamlFlowSequence(['a', 'src/**/*.ts'])).toBe('["a", "src/**/*.ts"]');
  });
});
