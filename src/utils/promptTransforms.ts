export const XML_TAGS = ['system', 'context', 'instructions', 'examples', 'guardrails', 'output_format'] as const;

export type XmlTag = (typeof XML_TAGS)[number];

export function wrapInXmlTag(text: string, tag: XmlTag): string {
  return `<${tag}>\n${text}\n</${tag}>`;
}

/** Wraps loose prompt text into an Anthropic-style structured XML skeleton. */
export function scaffoldXmlStructure(prompt: string): string {
  return [
    '<system>',
    'You are a production-grade assistant.',
    '</system>',
    '',
    '<context>',
    '[CONTEXT]',
    '</context>',
    '',
    '<instructions>',
    prompt.trim() || '[INSTRUCTIONS]',
    '</instructions>',
    '',
    '<examples>',
    '[EXAMPLES]',
    '</examples>',
    '',
    '<guardrails>',
    '- Stay within the provided context.',
    '- Ask for missing inputs instead of guessing.',
    '</guardrails>',
    '',
    '<output_format>',
    '[OUTPUT_FORMAT]',
    '</output_format>',
  ].join('\n');
}

export const SLOP_PHRASES = [
  'delve',
  'tapestry',
  'game-changer',
  'in the ever-evolving',
  'it is important to note',
  "let's dive in",
  'buckle up',
  'unleash',
  'in conclusion',
  'as an ai language model',
];

export interface AntiSlopOptions {
  banFiller: boolean;
  banBuzzwords: boolean;
  banApologies: boolean;
  banComments: boolean;
}

export function buildAntiSlopBlock(options: AntiSlopOptions): string {
  const rules: string[] = [];

  if (options.banFiller) {
    rules.push('Do not open with conversational filler such as "Sure, I can help!" or "Great question". Answer directly.');
  }
  if (options.banBuzzwords) {
    rules.push(`Never use hollow buzzwords: ${SLOP_PHRASES.slice(0, 6).join(', ')}.`);
  }
  if (options.banApologies) {
    rules.push('Do not apologize or hedge. State facts and limits plainly.');
  }
  if (options.banComments) {
    rules.push('Do not add explanatory code comments unless explicitly requested.');
  }

  if (rules.length === 0) {
    return '';
  }

  return ['<guardrails>', ...rules.map((rule) => `- ${rule}`), '</guardrails>'].join('\n');
}

export function detectSlop(text: string): string[] {
  const lower = text.toLowerCase();
  return SLOP_PHRASES.filter((phrase) => lower.includes(phrase));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface SlopSpan {
  text: string;
  slop: boolean;
}

/**
 * Splits text into ordered segments, flagging spans that match a slop phrase.
 * Word boundaries prevent partial matches (e.g. "delve" inside "delved").
 */
export function findSlopSpans(text: string): SlopSpan[] {
  const pattern = new RegExp(`\\b(?:${SLOP_PHRASES.map(escapeRegExp).join('|')})\\b`, 'gi');
  const spans: SlopSpan[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, index), slop: false });
    }
    spans.push({ text: match[0], slop: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    spans.push({ text: text.slice(lastIndex), slop: false });
  }

  return spans;
}

/** Builds the negative constraint appended when a user bans a slop phrase. */
export function buildSlopConstraint(phrase: string): string {
  return `Never use the word or phrase "${phrase.trim().toLowerCase()}".`;
}

export interface HallucinationOptions {
  requireCitations: boolean;
  restrictToContext: boolean;
  allowUncertainty: boolean;
}

export function buildHallucinationBlock(options: HallucinationOptions): string {
  const rules: string[] = [];

  if (options.restrictToContext) {
    rules.push('Answer using only the information in the provided context. Do not rely on outside knowledge.');
  }
  if (options.requireCitations) {
    rules.push('Cite the specific source passage for every factual claim, e.g. [source: <id>].');
  }
  if (options.allowUncertainty) {
    rules.push('If the context is insufficient, reply exactly: "I don\'t have enough information to answer that."');
  }

  if (rules.length === 0) {
    return '';
  }

  return ['<grounding>', ...rules.map((rule) => `- ${rule}`), '</grounding>'].join('\n');
}

/** Lightweight, deterministic context compression: dedupe, trim filler, bulletize. */
export function compressPrompt(prompt: string): string {
  const lines = prompt
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const compressed: string[] = [];

  for (const line of lines) {
    let cleaned = line;
    for (const phrase of SLOP_PHRASES) {
      cleaned = cleaned.replace(new RegExp(phrase, 'gi'), '');
    }
    cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();

    if (!cleaned) {
      continue;
    }

    const key = cleaned.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const bullet = /^[-*\d]/.test(cleaned) ? cleaned : `- ${cleaned}`;
    compressed.push(bullet);
  }

  return compressed.join('\n');
}

/** Deterministic meta-prompt expansion: turns a rough idea into a structured spec. */
export function buildMetaPrompt(idea: string): string {
  const cleanIdea = idea.trim() || '[YOUR_IDEA]';
  return [
    'You are a prompt engineering specialist. Produce a production-grade system prompt from the idea below.',
    '',
    `Idea: "${cleanIdea}"`,
    '',
    'Follow this process:',
    '1. Identity — define the ideal role, seniority, and domain expertise for this task.',
    '2. Objective — state the single measurable outcome the prompt must achieve.',
    '3. Context — list the inputs the assistant will receive and the audience it serves.',
    '4. Structure — specify the exact output format (sections, schema, or length).',
    '5. Constraints — add guardrails, forbidden patterns, and edge-case handling.',
    '6. Self-critique — review the draft against clarity, completeness, and ambiguity, then revise once.',
    '',
    'Return only the final, refined system prompt.',
  ].join('\n');
}
