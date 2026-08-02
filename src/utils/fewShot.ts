import { createId } from './promptUtils';
import { toYamlScalar } from './yaml';

export type FewShotFormat = 'json' | 'yaml' | 'markdown';

export interface Exemplar {
  id: string;
  input: string;
  output: string;
}

export function createExemplar(): Exemplar {
  return { id: createId('shot'), input: '', output: '' };
}

export function formatExemplars(exemplars: Exemplar[], format: FewShotFormat): string {
  const filled = exemplars.filter((example) => example.input.trim() || example.output.trim());
  if (filled.length === 0) {
    return '';
  }

  if (format === 'json') {
    return JSON.stringify(
      filled.map((example) => ({ input: example.input, output: example.output })),
      null,
      2,
    );
  }

  if (format === 'yaml') {
    return filled
      .map((example) => `- input: ${toYamlScalar(example.input)}\n  output: ${toYamlScalar(example.output)}`)
      .join('\n');
  }

  return filled
    .map((example, index) => {
      return [
        `### Example ${index + 1}`,
        '',
        '**Input**',
        '```',
        example.input,
        '```',
        '',
        '**Output**',
        '```',
        example.output,
        '```',
      ].join('\n');
    })
    .join('\n\n');
}
