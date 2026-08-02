export type FrameworkId = 'RTCC' | 'CRISPE' | 'STCO' | 'TCREI' | 'ReAct' | 'ToT';

export interface FrameworkSection {
  key: string;
  label: string;
  hint: string;
  placeholder: string;
}

export interface FrameworkDefinition {
  id: FrameworkId;
  name: string;
  summary: string;
  sections: FrameworkSection[];
}

export const frameworks: FrameworkDefinition[] = [
  {
    id: 'RTCC',
    name: 'RTCC',
    summary: 'Role, Task, Context, Constraints — a compact structure for focused single-turn instructions.',
    sections: [
      { key: 'role', label: 'Role', hint: 'Who the model should act as.', placeholder: 'a senior backend engineer' },
      { key: 'task', label: 'Task', hint: 'The concrete action to perform.', placeholder: 'review this API handler' },
      { key: 'context', label: 'Context', hint: 'Background and inputs.', placeholder: 'Node.js service handling auth' },
      { key: 'constraints', label: 'Constraints', hint: 'Guardrails and limits.', placeholder: 'no new dependencies' },
    ],
  },
  {
    id: 'CRISPE',
    name: 'CRISPE',
    summary: 'Context, Response, Input, System, Persona, Execution — layered control for rich generations.',
    sections: [
      { key: 'context', label: 'Context', hint: 'Situation and goal.', placeholder: 'launching a new SaaS product' },
      { key: 'response', label: 'Response', hint: 'Desired response shape.', placeholder: '5 headlines + 3 body variants' },
      { key: 'input', label: 'Input', hint: 'Provided material.', placeholder: 'product one-liner and audience' },
      { key: 'system', label: 'System', hint: 'System-level rules.', placeholder: 'stay on-brand, avoid hype' },
      { key: 'persona', label: 'Persona', hint: 'Voice and expertise.', placeholder: 'direct-response copywriter' },
      { key: 'execution', label: 'Execution', hint: 'Step-by-step plan.', placeholder: 'draft, self-critique, finalize' },
    ],
  },
  {
    id: 'STCO',
    name: 'STCO',
    summary: 'System, Task, Context, Output — clear separation of role, ask, background, and format.',
    sections: [
      { key: 'system', label: 'System', hint: 'Operating rules and role.', placeholder: 'an elite editorial strategist' },
      { key: 'task', label: 'Task', hint: 'What to produce.', placeholder: 'rewrite the draft for clarity' },
      { key: 'context', label: 'Context', hint: 'Inputs and audience.', placeholder: 'B2B audience, formal tone' },
      { key: 'output', label: 'Output', hint: 'Required output format.', placeholder: '3 variations in markdown' },
    ],
  },
  {
    id: 'TCREI',
    name: 'TCREI',
    summary: 'Task, Context, References, Evaluation, Iteration — a workflow-oriented, self-improving structure.',
    sections: [
      { key: 'task', label: 'Task', hint: 'The objective.', placeholder: 'produce a research synthesis' },
      { key: 'context', label: 'Context', hint: 'Scope and audience.', placeholder: 'technical stakeholders' },
      { key: 'references', label: 'References', hint: 'Source material to ground in.', placeholder: '[SOURCE_TEXT]' },
      { key: 'evaluation', label: 'Evaluation', hint: 'How success is judged.', placeholder: 'accuracy, coverage, brevity' },
      { key: 'iteration', label: 'Iteration', hint: 'How to refine.', placeholder: 'self-critique, then revise once' },
    ],
  },
  {
    id: 'ReAct',
    name: 'ReAct',
    summary: 'Thought -> Action -> Observation — reasoning loop for tool-using agents.',
    sections: [
      { key: 'objective', label: 'Objective', hint: 'The agent goal.', placeholder: 'resolve the support ticket' },
      { key: 'tools', label: 'Tools', hint: 'Available actions.', placeholder: 'search_docs, escalate, reply' },
      { key: 'thought', label: 'Thought', hint: 'Reasoning guidance.', placeholder: 'plan before every action' },
      { key: 'action', label: 'Action', hint: 'Action format.', placeholder: 'call one tool per step' },
      { key: 'observation', label: 'Observation', hint: 'How to read results.', placeholder: 'summarize tool output' },
      { key: 'stop', label: 'Stop condition', hint: 'When to finish.', placeholder: 'answer found or 5 steps' },
    ],
  },
  {
    id: 'ToT',
    name: 'Tree of Thoughts',
    summary: 'Multi-branch reasoning — explore several candidate paths, evaluate, then converge.',
    sections: [
      { key: 'problem', label: 'Problem', hint: 'The problem to solve.', placeholder: 'optimize the delivery route' },
      { key: 'branches', label: 'Branches', hint: 'How many candidate paths.', placeholder: '3 distinct strategies' },
      { key: 'evaluation', label: 'Evaluation', hint: 'Scoring criteria per branch.', placeholder: 'cost, time, risk' },
      { key: 'pruning', label: 'Pruning', hint: 'How to discard weak paths.', placeholder: 'drop lowest-scoring branch' },
      { key: 'synthesis', label: 'Synthesis', hint: 'How to combine winners.', placeholder: 'merge the top 2 strategies' },
    ],
  },
];

export function getFramework(id: FrameworkId): FrameworkDefinition {
  return frameworks.find((framework) => framework.id === id) ?? frameworks[0];
}

function fallbackValue(section: FrameworkSection, value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : `[${section.key.toUpperCase()}]`;
}

export function scaffoldFramework(id: FrameworkId, values: Record<string, string>): string {
  const framework = getFramework(id);

  if (id === 'ReAct') {
    const objective = fallbackValue(framework.sections[0], values.objective);
    const tools = fallbackValue(framework.sections[1], values.tools);
    return [
      `You are an autonomous agent. Objective: ${objective}.`,
      `Available tools: ${tools}.`,
      '',
      'Operate strictly in this loop until the stop condition is met:',
      `Thought: ${fallbackValue(framework.sections[2], values.thought)}`,
      `Action: ${fallbackValue(framework.sections[3], values.action)}`,
      `Observation: ${fallbackValue(framework.sections[4], values.observation)}`,
      '',
      `Stop condition: ${fallbackValue(framework.sections[5], values.stop)}.`,
    ].join('\n');
  }

  if (id === 'ToT') {
    return [
      `Problem: ${fallbackValue(framework.sections[0], values.problem)}.`,
      `Generate ${fallbackValue(framework.sections[1], values.branches)} independent candidate solution branches.`,
      `Evaluate each branch against: ${fallbackValue(framework.sections[2], values.evaluation)}.`,
      `Pruning rule: ${fallbackValue(framework.sections[3], values.pruning)}.`,
      `Synthesis: ${fallbackValue(framework.sections[4], values.synthesis)}.`,
      'Show the reasoning tree, then present the final converged answer.',
    ].join('\n');
  }

  return framework.sections
    .map((section) => `## ${section.label}\n${fallbackValue(section, values[section.key])}`)
    .join('\n\n');
}
