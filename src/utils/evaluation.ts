import { extractVariables } from './promptUtils';
import { detectSlop } from './promptTransforms';

export interface QualityGate {
  key: string;
  label: string;
  score: number;
  max: number;
  notes: string;
}

export interface EvaluationResult {
  gates: QualityGate[];
  total: number;
  max: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Counts terms present as whole words/phrases rather than substrings, so `only`
 * does not match inside `commonly` and `never` does not match `nevertheless`.
 */
function countTerms(text: string, terms: string[]): number {
  return terms.filter((term) => {
    const pattern = new RegExp(`(?:^|[^A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, 'i');
    return pattern.test(text);
  }).length;
}

/**
 * Deterministic, offline "LLM-as-a-judge" style rubric. It approximates the five
 * quality gates with measurable heuristics so scoring is stable and explainable.
 */
export function evaluatePrompt(prompt: string): EvaluationResult {
  const text = prompt.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const variables = extractVariables(text);

  // Gate 1: Instruction clarity — imperative verbs and explicit structure.
  const actionVerbs = ['analyze', 'write', 'generate', 'review', 'summarize', 'create', 'rewrite', 'build', 'act as', 'you are'];
  const verbHits = countTerms(text, actionVerbs);
  const clarity = clamp(Math.round(verbHits * 5 + (wordCount > 20 ? 5 : 0)), 20);

  // Gate 2: Context completeness — length and presence of framing terms.
  const contextTerms = ['context', 'audience', 'background', 'given', 'based on', 'input'];
  const contextHits = countTerms(text, contextTerms);
  const context = clamp(Math.round((wordCount > 60 ? 10 : wordCount / 6) + contextHits * 3), 20);

  // Gate 3: Output formatting rigor — explicit format directives.
  const formatTerms = ['format', 'json', 'markdown', 'bullet', 'table', 'sections', 'output', 'list', 'schema'];
  const formatHits = countTerms(text, formatTerms);
  const formatting = clamp(Math.round(formatHits * 5), 20);

  // Gate 4: Guardrail strength — constraints and prohibitions.
  const guardTerms = ['do not', "don't", 'avoid', 'never', 'only', 'must', 'constraint', 'guardrail', 'refuse'];
  const guardHits = countTerms(text, guardTerms);
  const slopPenalty = detectSlop(text).length * 3;
  const guardrails = clamp(Math.round(guardHits * 4 - slopPenalty), 20);

  // Gate 5: Variable definition — presence and reasonable count of variables.
  const variableScore = variables.length === 0 ? 4 : clamp(8 + variables.length * 3, 20);

  const gates: QualityGate[] = [
    {
      key: 'clarity',
      label: 'Instruction Clarity',
      score: clarity,
      max: 20,
      notes: verbHits ? `${verbHits} action directive(s) detected.` : 'No clear action verb found.',
    },
    {
      key: 'context',
      label: 'Context Completeness',
      score: context,
      max: 20,
      notes: contextHits ? `${contextHits} framing term(s) present.` : 'Add audience/background framing.',
    },
    {
      key: 'formatting',
      label: 'Output Formatting Rigor',
      score: formatting,
      max: 20,
      notes: formatHits ? `${formatHits} format directive(s).` : 'No explicit output format specified.',
    },
    {
      key: 'guardrails',
      label: 'Guardrail Strength',
      score: guardrails,
      max: 20,
      notes: slopPenalty ? 'Contains "AI slop" phrasing — penalized.' : `${guardHits} constraint term(s).`,
    },
    {
      key: 'variables',
      label: 'Variable Definition',
      score: variableScore,
      max: 20,
      notes: variables.length ? `${variables.length} variable(s): ${variables.join(', ')}.` : 'No dynamic variables.',
    },
  ];

  const total = gates.reduce((sum, gate) => sum + gate.score, 0);
  const max = gates.reduce((sum, gate) => sum + gate.max, 0);
  const ratio = total / max;
  const grade: EvaluationResult['grade'] = ratio >= 0.85 ? 'A' : ratio >= 0.7 ? 'B' : ratio >= 0.5 ? 'C' : 'D';

  return { gates, total, max, grade };
}
