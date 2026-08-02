/**
 * Serializes a string as a safe YAML scalar. Plain output is used only when the
 * value is unambiguous; anything with special characters, leading/trailing
 * whitespace, or YAML-significant tokens is double-quoted via JSON.stringify,
 * which produces YAML-compatible escaping.
 */
const SAFE_PLAIN_SCALAR = /^[A-Za-z0-9][A-Za-z0-9 _./-]*$/;
const RESERVED_WORDS = new Set([
  'true',
  'false',
  'null',
  'yes',
  'no',
  'on',
  'off',
  '~',
]);

export function toYamlScalar(value: string): string {
  if (value.length === 0) {
    return '""';
  }

  if (SAFE_PLAIN_SCALAR.test(value) && !RESERVED_WORDS.has(value.toLowerCase())) {
    return value;
  }

  return JSON.stringify(value);
}

/** Produces a `[ "a", "b" ]` YAML flow sequence with each entry safely quoted. */
export function toYamlFlowSequence(values: string[]): string {
  if (values.length === 0) {
    return '[]';
  }
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}
