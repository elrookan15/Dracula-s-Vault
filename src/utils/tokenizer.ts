import type { ModelTag } from '../types';

export interface ModelProfile {
  model: ModelTag;
  label: string;
  contextWindow: number;
  /** USD per 1M input tokens. */
  inputCostPerMillion: number;
  /** USD per 1M output tokens. */
  outputCostPerMillion: number;
}

/**
 * Published list prices as of mid-2026. These are estimates for planning only;
 * the app never calls a provider, so exact billing is out of scope.
 */
export const modelProfiles: Record<ModelTag, ModelProfile> = {
  'GPT-4o': {
    model: 'GPT-4o',
    label: 'OpenAI GPT-4o',
    contextWindow: 128_000,
    inputCostPerMillion: 2.5,
    outputCostPerMillion: 10,
  },
  'Claude 3.5': {
    model: 'Claude 3.5',
    label: 'Anthropic Claude 3.5',
    contextWindow: 200_000,
    inputCostPerMillion: 3,
    outputCostPerMillion: 15,
  },
  'Gemini 2.5': {
    model: 'Gemini 2.5',
    label: 'Google Gemini 2.5',
    contextWindow: 1_000_000,
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 10,
  },
  DeepSeek: {
    model: 'DeepSeek',
    label: 'DeepSeek',
    contextWindow: 128_000,
    inputCostPerMillion: 0.27,
    outputCostPerMillion: 1.1,
  },
  'Local LLM': {
    model: 'Local LLM',
    label: 'Local LLM / Ollama',
    contextWindow: 32_000,
    inputCostPerMillion: 0,
    outputCostPerMillion: 0,
  },
};

/**
 * Heuristic BPE-style token estimate. Real tokenizers vary by model, so this
 * blends a character-per-token ratio with a word count for a stable estimate
 * without shipping a multi-megabyte tokenizer table.
 */
export function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }

  const characters = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const byChars = characters / 4;
  const byWords = words * 1.33;
  return Math.max(1, Math.round((byChars + byWords) / 2));
}

export interface CostEstimate {
  model: ModelTag;
  label: string;
  inputTokens: number;
  estimatedOutputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  contextWindow: number;
  contextUsedRatio: number;
}

export function estimateCost(inputTokens: number, model: ModelTag, estimatedOutputTokens = 500): CostEstimate {
  const profile = modelProfiles[model];
  const inputCost = (inputTokens / 1_000_000) * profile.inputCostPerMillion;
  const outputCost = (estimatedOutputTokens / 1_000_000) * profile.outputCostPerMillion;

  return {
    model,
    label: profile.label,
    inputTokens,
    estimatedOutputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    contextWindow: profile.contextWindow,
    contextUsedRatio: Math.min(1, inputTokens / profile.contextWindow),
  };
}

export function formatCost(cost: number): string {
  if (cost === 0) {
    return 'Free';
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return `${tokens}`;
}
