import type { ModelTag, PromptTemplate } from '../types';

export type CopyFormat = 'raw' | 'interpolated' | 'apiPayload' | 'markdown';

const modelApiName: Record<ModelTag, string> = {
  'GPT-4o': 'gpt-4o',
  'Claude 3.5': 'claude-3-5-sonnet-latest',
  'Gemini 2.5': 'gemini-2.5-pro',
  DeepSeek: 'deepseek-chat',
  'Local LLM': 'llama3',
};

export function toApiPayload(prompt: PromptTemplate, content: string): string {
  return JSON.stringify(
    {
      model: modelApiName[prompt.model] ?? 'gpt-4o',
      messages: [
        { role: 'system', content },
        { role: 'user', content: '[USER_INPUT]' },
      ],
    },
    null,
    2,
  );
}

export function toMarkdownDoc(prompt: PromptTemplate, content: string): string {
  return [
    `# ${prompt.title}`,
    '',
    `> ${prompt.description}`,
    '',
    `- **Category:** ${prompt.categoryId}`,
    `- **Model:** ${prompt.model}`,
    `- **Framework:** ${prompt.framework}`,
    prompt.tags.length ? `- **Tags:** ${prompt.tags.map((tag) => `\`${tag}\``).join(', ')}` : '- **Tags:** —',
    '',
    '## Prompt',
    '',
    '```text',
    content,
    '```',
  ].join('\n');
}

export function buildCopyPayload(prompt: PromptTemplate, format: CopyFormat, interpolated: string): string {
  switch (format) {
    case 'raw':
      return prompt.prompt;
    case 'interpolated':
      return interpolated;
    case 'apiPayload':
      return toApiPayload(prompt, interpolated);
    case 'markdown':
      return toMarkdownDoc(prompt, interpolated);
    default:
      return prompt.prompt;
  }
}

export type AgentFileFormat = 'cursorrules' | 'mdc' | 'claude-md';

export interface AgentFileConfig {
  projectName: string;
  standards: string;
  globs: string;
  body: string;
}

export function buildAgentFile(format: AgentFileFormat, config: AgentFileConfig): { filename: string; content: string } {
  const standardsList = config.standards
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join('\n');

  if (format === 'mdc') {
    const globs = config.globs
      .split(',')
      .map((glob) => glob.trim())
      .filter(Boolean);
    const frontMatter = [
      '---',
      `description: Standing orders for ${config.projectName || 'this project'}`,
      `globs: ${globs.length ? `[${globs.map((glob) => `"${glob}"`).join(', ')}]` : '[]'}`,
      'alwaysApply: false',
      '---',
    ].join('\n');
    return {
      filename: 'project-rules.mdc',
      content: [frontMatter, '', `# ${config.projectName || 'Project'} Rules`, '', standardsList, '', config.body].join('\n'),
    };
  }

  if (format === 'claude-md') {
    return {
      filename: 'CLAUDE.md',
      content: [
        `# ${config.projectName || 'Project'}`,
        '',
        '## Standing Orders',
        '',
        standardsList,
        '',
        '## Working Agreement',
        '',
        config.body,
      ].join('\n'),
    };
  }

  return {
    filename: '.cursorrules',
    content: [
      `# ${config.projectName || 'Project'} — Cursor Rules`,
      '',
      '## Coding Standards',
      '',
      standardsList,
      '',
      '## Directory Scope',
      '',
      config.globs.trim() ? `Applies to: ${config.globs.trim()}` : 'Applies to: entire repository',
      '',
      '## Standing Orders',
      '',
      config.body,
    ].join('\n'),
  };
}
