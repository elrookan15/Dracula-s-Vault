import type { ModelTag, PromptTemplate } from '../types';

export type TargetFormat = 'claude' | 'openai' | 'gemini' | 'ollama';

export interface TranslationTarget {
  id: TargetFormat;
  label: string;
  language: 'xml' | 'json' | 'markdown' | 'bash';
}

export const translationTargets: TranslationTarget[] = [
  { id: 'claude', label: 'Claude System Prompt (XML)', language: 'xml' },
  { id: 'openai', label: 'OpenAI Chat Completion Payload', language: 'json' },
  { id: 'gemini', label: 'Gemini System Instruction', language: 'json' },
  { id: 'ollama', label: 'Local LLM / Ollama Modelfile', language: 'bash' },
];

const modelApiName: Record<ModelTag, string> = {
  'GPT-4o': 'gpt-4o',
  'Claude 3.5': 'claude-3-5-sonnet-latest',
  'Gemini 2.5': 'gemini-2.5-pro',
  DeepSeek: 'deepseek-chat',
  'Local LLM': 'llama3',
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function slugModel(prompt: PromptTemplate): string {
  return modelApiName[prompt.model] ?? 'gpt-4o';
}

export function translatePrompt(prompt: PromptTemplate, target: TargetFormat, userMessage = ''): string {
  const system = prompt.prompt;

  switch (target) {
    case 'claude':
      return [
        '<system>',
        escapeXml(system),
        '</system>',
        '',
        '<user>',
        escapeXml(userMessage || '[USER_INPUT]'),
        '</user>',
        '',
        '<!-- Optional: prefill the assistant turn to steer the response format -->',
        '<assistant></assistant>',
      ].join('\n');

    case 'openai':
      return JSON.stringify(
        {
          model: slugModel(prompt),
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage || '[USER_INPUT]' },
          ],
          temperature: 0.7,
        },
        null,
        2,
      );

    case 'gemini':
      return JSON.stringify(
        {
          model: slugModel(prompt),
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: userMessage || '[USER_INPUT]' }] }],
          generationConfig: { temperature: 0.7 },
        },
        null,
        2,
      );

    case 'ollama':
      return [
        `FROM ${slugModel(prompt)}`,
        '',
        'PARAMETER temperature 0.7',
        '',
        'SYSTEM """',
        system,
        '"""',
      ].join('\n');

    default:
      return system;
  }
}
