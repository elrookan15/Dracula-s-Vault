import {
  ArrowDown,
  ArrowUp,
  Boxes,
  Code2,
  Coins,
  Copy,
  Download,
  Gauge,
  GitCompare,
  Languages,
  ListOrdered,
  Minimize2,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCog,
  Wand2,
  Workflow,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ModelTag, PromptTemplate } from '../types';
import { diffLines, diffStats } from '../utils/diffing';
import { evaluatePrompt } from '../utils/evaluation';
import { createExemplar, type Exemplar, type FewShotFormat, formatExemplars } from '../utils/fewShot';
import { type FrameworkId, frameworks, getFramework, scaffoldFramework } from '../utils/frameworks';
import { buildAgentFile, type AgentFileFormat, buildCopyPayload, type CopyFormat } from '../utils/exporters';
import {
  authorityLabel,
  buildPersonaBlock,
  jargonLabel,
  type PersonaConfig,
  type Tone,
  toneOptions,
} from '../utils/persona';
import {
  buildAntiSlopBlock,
  buildHallucinationBlock,
  buildMetaPrompt,
  compressPrompt,
  scaffoldXmlStructure,
  wrapInXmlTag,
  XML_TAGS,
  type XmlTag,
} from '../utils/promptTransforms';
import {
  type ApiSettings,
  type ChatMessage,
  hasCredential,
  providerForModel,
  providerMeta,
  runChat,
} from '../utils/providers';
import { createId, extractVariables, interpolatePrompt } from '../utils/promptUtils';
import { translatePrompt, translationTargets, type TargetFormat } from '../utils/translators';
import { TokenHud } from './studio/TokenHud';

type StudioTab =
  | 'frameworks'
  | 'structure'
  | 'meta'
  | 'translate'
  | 'guardrails'
  | 'persona'
  | 'fewshot'
  | 'pipeline'
  | 'sandbox'
  | 'versions'
  | 'evaluate'
  | 'compress'
  | 'export';

interface TabDefinition {
  id: StudioTab;
  label: string;
  icon: typeof Boxes;
}

const tabs: TabDefinition[] = [
  { id: 'frameworks', label: 'Frameworks', icon: Boxes },
  { id: 'structure', label: 'XML Structure', icon: Code2 },
  { id: 'meta', label: 'Meta-Prompt', icon: Sparkles },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'guardrails', label: 'Guardrails', icon: ShieldAlert },
  { id: 'persona', label: 'Persona', icon: UserCog },
  { id: 'fewshot', label: 'Few-Shot', icon: ListOrdered },
  { id: 'pipeline', label: 'Pipeline', icon: Workflow },
  { id: 'sandbox', label: 'Sandbox', icon: Wand2 },
  { id: 'versions', label: 'Versions', icon: GitCompare },
  { id: 'evaluate', label: 'Evaluate', icon: Gauge },
  { id: 'compress', label: 'Compress', icon: Minimize2 },
  { id: 'export', label: 'Export', icon: Download },
];

interface PromptStudioProps {
  prompt: PromptTemplate | null;
  isOpen: boolean;
  apiSettings: ApiSettings;
  onClose: () => void;
  onCopy: (text: string) => void;
  onSaveFork: (title: string, promptText: string, model: ModelTag) => void;
  onOpenSettings: () => void;
}

const actionButton =
  'inline-flex items-center gap-2 rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-vault-purple hover:text-vault-purple-soft';
const primaryButton =
  'inline-flex items-center gap-2 rounded-xl bg-vault-orange px-3 py-2 text-sm font-black text-white shadow-orange transition hover:bg-vault-orange-soft';
const limeButton =
  'inline-flex items-center gap-2 rounded-xl bg-vault-lime px-3 py-2 text-sm font-black text-vault-base shadow-lime transition hover:bg-vault-lime-soft';

export function PromptStudio({ prompt, isOpen, apiSettings, onClose, onCopy, onSaveFork, onOpenSettings }: PromptStudioProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('frameworks');
  const [workingText, setWorkingText] = useState('');
  const [model, setModel] = useState<ModelTag>('GPT-4o');

  useEffect(() => {
    if (prompt) {
      setWorkingText(prompt.prompt);
      setModel(prompt.model);
      setActiveTab('frameworks');
    }
  }, [prompt?.id]);

  const variables = useMemo(() => extractVariables(workingText), [workingText]);

  if (!isOpen || !prompt) {
    return null;
  }

  const activePrompt = prompt;

  function append(text: string) {
    if (!text.trim()) {
      return;
    }
    setWorkingText((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text));
  }

  function saveFork() {
    onSaveFork(`${activePrompt.title} (Studio)`, workingText, model);
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close studio" onClick={onClose} />

      <section className="relative m-auto flex h-[94vh] w-[min(1200px,96vw)] flex-col overflow-hidden rounded-3xl border border-vault-border bg-vault-base shadow-2xl">
        <header className="flex flex-col gap-3 border-b border-vault-border bg-vault-surface/90 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-vault-purple-soft">Prompt Studio</p>
            <h2 className="truncate text-xl font-black text-white">{prompt.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={limeButton} onClick={() => onCopy(workingText)}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy Working Text
            </button>
            <button type="button" className={primaryButton} onClick={saveFork}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save as Fork
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-vault-border p-2 text-slate-400 transition hover:border-vault-orange hover:text-vault-orange"
              aria-label="Close studio"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <TokenHud text={workingText} model={model} onModelChange={setModel} />

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)_minmax(0,1fr)]">
          <nav className="flex gap-1 overflow-x-auto border-b border-vault-border p-2 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-vault-purple/15 text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 overflow-y-auto border-b border-vault-border p-4 lg:border-b-0 lg:border-r">
            {activeTab === 'frameworks' && <FrameworkTab onGenerate={append} />}
            {activeTab === 'structure' && <StructureTab workingText={workingText} onApply={setWorkingText} onAppend={append} />}
            {activeTab === 'meta' && <MetaTab onGenerate={setWorkingText} />}
            {activeTab === 'translate' && <TranslateTab prompt={{ ...prompt, prompt: workingText }} onCopy={onCopy} />}
            {activeTab === 'guardrails' && <GuardrailTab onAppend={append} />}
            {activeTab === 'persona' && <PersonaTab onAppend={append} />}
            {activeTab === 'fewshot' && <FewShotTab onAppend={append} />}
            {activeTab === 'pipeline' && <PipelineTab onGenerate={setWorkingText} subject={prompt.title} />}
            {activeTab === 'sandbox' && (
              <SandboxTab
                workingText={workingText}
                variables={variables}
                model={model}
                settings={apiSettings}
                onOpenSettings={onOpenSettings}
              />
            )}
            {activeTab === 'versions' && <VersionsTab original={prompt.prompt} workingText={workingText} />}
            {activeTab === 'evaluate' && <EvaluateTab workingText={workingText} />}
            {activeTab === 'compress' && <CompressTab workingText={workingText} onApply={setWorkingText} />}
            {activeTab === 'export' && <ExportTab prompt={{ ...prompt, prompt: workingText }} onCopy={onCopy} />}
          </div>

          <div className="flex min-h-0 flex-col p-4">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="studio-working" className="text-xs font-black uppercase tracking-[0.24em] text-vault-lime">
                Working Canvas
              </label>
              <span className="rounded-full bg-vault-purple/10 px-2 py-1 text-xs font-black text-vault-purple-soft">
                {variables.length} variables
              </span>
            </div>
            <textarea
              id="studio-working"
              value={workingText}
              onChange={(event) => setWorkingText(event.target.value)}
              className="min-h-0 flex-1 resize-none rounded-2xl border border-vault-border bg-vault-surface p-4 font-mono text-sm leading-6 text-slate-100 focus:border-vault-purple"
              spellCheck={false}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FrameworkTab({ onGenerate }: { onGenerate: (text: string) => void }) {
  const [frameworkId, setFrameworkId] = useState<FrameworkId>('RTCC');
  const [values, setValues] = useState<Record<string, string>>({});
  const framework = getFramework(frameworkId);
  const preview = useMemo(() => scaffoldFramework(frameworkId, values), [frameworkId, values]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">Framework Scaffolding</h3>
        <p className="text-sm text-slate-400">{framework.summary}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {frameworks.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setFrameworkId(option.id);
              setValues({});
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
              frameworkId === option.id
                ? 'border-vault-purple bg-vault-purple/15 text-vault-purple-soft'
                : 'border-vault-border text-slate-300 hover:border-vault-purple'
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {framework.sections.map((section) => (
          <label key={section.key} className="block">
            <span className="mb-1 block text-sm font-bold text-slate-200">{section.label}</span>
            <span className="mb-1 block text-xs text-slate-500">{section.hint}</span>
            <input
              value={values[section.key] ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, [section.key]: event.target.value }))}
              placeholder={section.placeholder}
              className="w-full rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
            />
          </label>
        ))}
      </div>

      <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-vault-border bg-black/20 p-3 font-mono text-xs leading-6 text-slate-300">
        {preview}
      </pre>

      <button type="button" className={primaryButton} onClick={() => onGenerate(preview)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add scaffold to canvas
      </button>
    </div>
  );
}

function StructureTab({
  workingText,
  onApply,
  onAppend,
}: {
  workingText: string;
  onApply: (text: string) => void;
  onAppend: (text: string) => void;
}) {
  const [tag, setTag] = useState<XmlTag>('instructions');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">XML Metaprompting</h3>
        <p className="text-sm text-slate-400">
          Wrap content in Anthropic-recommended tags to sharpen attention on frontier models.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {XML_TAGS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTag(option)}
            className={`rounded-full border px-3 py-1.5 font-mono text-xs font-bold transition ${
              tag === option ? 'border-vault-lime bg-vault-lime/15 text-vault-lime' : 'border-vault-border text-slate-300'
            }`}
          >
            &lt;{option}&gt;
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={actionButton} onClick={() => onApply(wrapInXmlTag(workingText, tag))}>
          Wrap canvas in &lt;{tag}&gt;
        </button>
        <button type="button" className={actionButton} onClick={() => onAppend(wrapInXmlTag('[CONTENT]', tag))}>
          Insert empty &lt;{tag}&gt;
        </button>
      </div>

      <button type="button" className={primaryButton} onClick={() => onApply(scaffoldXmlStructure(workingText))}>
        <Code2 className="h-4 w-4" aria-hidden="true" />
        Scaffold full XML structure
      </button>
    </div>
  );
}

function MetaTab({ onGenerate }: { onGenerate: (text: string) => void }) {
  const [idea, setIdea] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">Meta-Prompt Studio</h3>
        <p className="text-sm text-slate-400">
          Turn a rough idea into a self-refining meta-prompt that instructs a model to produce a production-grade system
          prompt.
        </p>
      </div>

      <textarea
        value={idea}
        onChange={(event) => setIdea(event.target.value)}
        rows={4}
        placeholder="e.g. a bot that writes cold outreach emails for B2B sales"
        className="w-full resize-y rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
      />

      <button type="button" className={primaryButton} onClick={() => onGenerate(buildMetaPrompt(idea))}>
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Generate meta-prompt into canvas
      </button>
    </div>
  );
}

function TranslateTab({ prompt, onCopy }: { prompt: PromptTemplate; onCopy: (text: string) => void }) {
  const [target, setTarget] = useState<TargetFormat>('claude');
  const output = useMemo(() => translatePrompt(prompt, target), [prompt, target]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">Multi-Model Translator</h3>
        <p className="text-sm text-slate-400">Adapt the canvas into a target model's request format.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {translationTargets.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTarget(option.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
              target === option.id ? 'border-vault-orange bg-vault-orange/15 text-vault-orange-soft' : 'border-vault-border text-slate-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-vault-border bg-black/20 p-3 font-mono text-xs leading-6 text-slate-300">
        {output}
      </pre>

      <button type="button" className={limeButton} onClick={() => onCopy(output)}>
        <Copy className="h-4 w-4" aria-hidden="true" />
        Copy translated payload
      </button>
    </div>
  );
}

function GuardrailTab({ onAppend }: { onAppend: (text: string) => void }) {
  const [slop, setSlop] = useState({ banFiller: true, banBuzzwords: true, banApologies: true, banComments: false });
  const [ground, setGround] = useState({ requireCitations: true, restrictToContext: true, allowUncertainty: true });

  const slopBlock = useMemo(() => buildAntiSlopBlock(slop), [slop]);
  const groundBlock = useMemo(() => buildHallucinationBlock(ground), [ground]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black text-white">Guardrail Generator</h3>
        <p className="text-sm text-slate-400">Append anti-slop filters and grounding rules to the canvas.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-black text-vault-orange-soft">Anti-Slop Filter</legend>
        {(
          [
            ['banFiller', 'Ban conversational filler'],
            ['banBuzzwords', 'Ban buzzwords (delve, tapestry…)'],
            ['banApologies', 'Ban apologies and hedging'],
            ['banComments', 'Ban unrequested code comments'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={slop[key]}
              onChange={(event) => setSlop((current) => ({ ...current, [key]: event.target.checked }))}
              className="h-4 w-4 accent-vault-orange"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-black text-vault-lime">Hallucination Guardrails</legend>
        {(
          [
            ['restrictToContext', 'Restrict answers to provided context'],
            ['requireCitations', 'Require citations for factual claims'],
            ['allowUncertainty', 'Allow "I don\'t have enough information"'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={ground[key]}
              onChange={(event) => setGround((current) => ({ ...current, [key]: event.target.checked }))}
              className="h-4 w-4 accent-vault-lime"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={actionButton} onClick={() => onAppend(slopBlock)} disabled={!slopBlock}>
          Append anti-slop block
        </button>
        <button type="button" className={actionButton} onClick={() => onAppend(groundBlock)} disabled={!groundBlock}>
          Append grounding block
        </button>
      </div>
    </div>
  );
}

function PersonaTab({ onAppend }: { onAppend: (text: string) => void }) {
  const [config, setConfig] = useState<PersonaConfig>({ authority: 60, jargonDensity: 50, tone: 'Direct', domain: '' });
  const block = useMemo(() => buildPersonaBlock(config), [config]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black text-white">Persona Calibration</h3>
        <p className="text-sm text-slate-400">Tune authority, tone, and jargon density, then append the persona block.</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-bold text-slate-200">Domain</span>
        <input
          value={config.domain}
          onChange={(event) => setConfig((current) => ({ ...current, domain: event.target.value }))}
          placeholder="quantum computing"
          className="w-full rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
        />
      </label>

      <label className="block">
        <span className="mb-1 flex items-center justify-between text-sm font-bold text-slate-200">
          Authority / Experience <span className="text-xs text-vault-purple-soft">{authorityLabel(config.authority)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={config.authority}
          onChange={(event) => setConfig((current) => ({ ...current, authority: Number(event.target.value) }))}
          className="w-full accent-vault-purple"
        />
      </label>

      <label className="block">
        <span className="mb-1 flex items-center justify-between text-sm font-bold text-slate-200">
          Jargon Density <span className="text-xs text-vault-lime">{jargonLabel(config.jargonDensity)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={config.jargonDensity}
          onChange={(event) => setConfig((current) => ({ ...current, jargonDensity: Number(event.target.value) }))}
          className="w-full accent-vault-lime"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-bold text-slate-200">Tone</span>
        <select
          value={config.tone}
          onChange={(event) => setConfig((current) => ({ ...current, tone: event.target.value as Tone }))}
          className="w-full rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm text-slate-100 focus:border-vault-orange"
        >
          {toneOptions.map((tone) => (
            <option key={tone} value={tone}>
              {tone}
            </option>
          ))}
        </select>
      </label>

      <pre className="whitespace-pre-wrap rounded-2xl border border-vault-border bg-black/20 p-3 font-mono text-xs leading-6 text-slate-300">
        {block}
      </pre>

      <button type="button" className={primaryButton} onClick={() => onAppend(block)}>
        <UserCog className="h-4 w-4" aria-hidden="true" />
        Append persona block
      </button>
    </div>
  );
}

function FewShotTab({ onAppend }: { onAppend: (text: string) => void }) {
  const [exemplars, setExemplars] = useState<Exemplar[]>([createExemplar()]);
  const [format, setFormat] = useState<FewShotFormat>('json');
  const output = useMemo(() => formatExemplars(exemplars, format), [exemplars, format]);

  function updateExemplar(id: string, field: 'input' | 'output', value: string) {
    setExemplars((current) => current.map((example) => (example.id === id ? { ...example, [field]: value } : example)));
  }

  function move(id: string, direction: -1 | 1) {
    setExemplars((current) => {
      const index = current.findIndex((example) => example.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">Few-Shot Exemplar Builder</h3>
        <p className="text-sm text-slate-400">Construct input/output pairs, reorder them, and export in JSON, YAML, or Markdown.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['json', 'yaml', 'markdown'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFormat(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase transition ${
              format === option ? 'border-vault-purple bg-vault-purple/15 text-vault-purple-soft' : 'border-vault-border text-slate-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {exemplars.map((example, index) => (
          <div key={example.id} className="rounded-2xl border border-vault-border bg-vault-surface/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400">Example {index + 1}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(example.id, -1)} className="rounded-lg border border-vault-border p-1 text-slate-400 hover:text-white" aria-label="Move up">
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(example.id, 1)} className="rounded-lg border border-vault-border p-1 text-slate-400 hover:text-white" aria-label="Move down">
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setExemplars((current) => (current.length > 1 ? current.filter((item) => item.id !== example.id) : current))}
                  className="rounded-lg border border-vault-border p-1 text-slate-400 hover:text-red-300"
                  aria-label="Delete example"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <textarea
              value={example.input}
              onChange={(event) => updateExemplar(example.id, 'input', event.target.value)}
              rows={2}
              placeholder="Input"
              className="mb-2 w-full resize-y rounded-lg border border-vault-border bg-vault-base px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
            />
            <textarea
              value={example.output}
              onChange={(event) => updateExemplar(example.id, 'output', event.target.value)}
              rows={2}
              placeholder="Output"
              className="w-full resize-y rounded-lg border border-vault-border bg-vault-base px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-lime"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={actionButton} onClick={() => setExemplars((current) => [...current, createExemplar()])}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add example
        </button>
        <button type="button" className={primaryButton} onClick={() => onAppend(output)} disabled={!output}>
          Append examples to canvas
        </button>
      </div>
    </div>
  );
}

interface PipelineStep {
  id: string;
  title: string;
  instruction: string;
}

function PipelineTab({ onGenerate, subject }: { onGenerate: (text: string) => void; subject: string }) {
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: createId('pass'), title: 'Security Audit', instruction: 'Identify vulnerabilities and edge-case failures.' },
    { id: createId('pass'), title: 'Performance Optimization', instruction: 'Suggest optimizations with minimal diffs.' },
    { id: createId('pass'), title: 'Refactor', instruction: 'Refactor for readability without changing behavior.' },
  ]);

  function updateStep(id: string, field: 'title' | 'instruction', value: string) {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, [field]: value } : step)));
  }

  function move(id: string, direction: -1 | 1) {
    setSteps((current) => {
      const index = current.findIndex((step) => step.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const composed = useMemo(() => {
    const body = steps
      .map((step, index) => `Pass ${index + 1} — ${step.title || 'Untitled'}: ${step.instruction || '[INSTRUCTION]'}`)
      .join('\n');
    return [
      `Execute the following multi-pass workflow on: ${subject}.`,
      '',
      body,
      '',
      'Complete each pass in order. Do not begin a pass until the previous one is finished. Present each pass under its own heading.',
    ].join('\n');
  }, [steps, subject]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">Multi-Pass Pipeline</h3>
        <p className="text-sm text-slate-400">Sequence prompts into an ordered reasoning workflow.</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="rounded-2xl border border-vault-border bg-vault-surface/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black text-vault-purple-soft">Pass {index + 1}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(step.id, -1)} className="rounded-lg border border-vault-border p-1 text-slate-400 hover:text-white" aria-label="Move up">
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(step.id, 1)} className="rounded-lg border border-vault-border p-1 text-slate-400 hover:text-white" aria-label="Move down">
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setSteps((current) => (current.length > 1 ? current.filter((item) => item.id !== step.id) : current))}
                  className="rounded-lg border border-vault-border p-1 text-slate-400 hover:text-red-300"
                  aria-label="Delete pass"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <input
              value={step.title}
              onChange={(event) => updateStep(step.id, 'title', event.target.value)}
              placeholder="Pass title"
              className="mb-2 w-full rounded-lg border border-vault-border bg-vault-base px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
            />
            <textarea
              value={step.instruction}
              onChange={(event) => updateStep(step.id, 'instruction', event.target.value)}
              rows={2}
              placeholder="Instruction for this pass"
              className="w-full resize-y rounded-lg border border-vault-border bg-vault-base px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-lime"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={actionButton}
          onClick={() => setSteps((current) => [...current, { id: createId('pass'), title: '', instruction: '' }])}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add pass
        </button>
        <button type="button" className={primaryButton} onClick={() => onGenerate(composed)}>
          <Workflow className="h-4 w-4" aria-hidden="true" />
          Generate pipeline into canvas
        </button>
      </div>
    </div>
  );
}

interface ChatTurn {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

function SandboxTab({
  workingText,
  variables,
  model,
  settings,
  onOpenSettings,
}: {
  workingText: string;
  variables: string[];
  model: ModelTag;
  settings: ApiSettings;
  onOpenSettings: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [userMessage, setUserMessage] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [liveMode, setLiveMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const systemPrompt = useMemo(() => interpolatePrompt(workingText, values), [workingText, values]);
  const provider = providerForModel(model);
  const keyReady = hasCredential(model, settings);

  function simulate(message: string): string {
    return [
      '[Simulated response — enable Live mode with a saved API key to call a real model]',
      '',
      `System instructions: ${systemPrompt.length} chars. Your message: "${message}".`,
      `Variables in play: ${variables.length ? variables.join(', ') : 'none'}.`,
    ].join('\n');
  }

  async function send() {
    const message = userMessage.trim();
    if (!message || isRunning) {
      return;
    }
    setUserMessage('');

    const history: ChatMessage[] = turns
      .filter((turn): turn is ChatTurn & { role: 'user' | 'assistant' } => turn.role !== 'error')
      .map((turn) => ({ role: turn.role, content: turn.content }));

    setTurns((current) => [...current, { role: 'user', content: message }]);

    if (!liveMode) {
      setTurns((current) => [...current, { role: 'assistant', content: simulate(message) }]);
      return;
    }

    setIsRunning(true);
    try {
      const reply = await runChat({
        model,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: message }],
        settings,
      });
      setTurns((current) => [...current, { role: 'assistant', content: reply }]);
    } catch (error) {
      setTurns((current) => [
        ...current,
        { role: 'error', content: error instanceof Error ? error.message : 'Request failed.' },
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">Test Sandbox</h3>
        <p className="text-sm text-slate-400">
          Send a chat turn against the canvas system prompt. Simulated by default; enable Live mode to call the real
          provider with your saved key.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-vault-border bg-vault-surface/70 p-3">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <input
            type="checkbox"
            checked={liveMode}
            onChange={(event) => setLiveMode(event.target.checked)}
            className="h-4 w-4 accent-vault-lime"
          />
          Live mode
        </label>
        <span className="text-xs text-slate-500">
          Routes to <span className="font-black text-vault-purple-soft">{providerMeta[provider].label}</span> ({model})
        </span>
        {liveMode &&
          (keyReady ? (
            <span className="rounded-full bg-vault-lime/10 px-2 py-0.5 text-xs font-black text-vault-lime">key ready</span>
          ) : (
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-full bg-vault-orange/10 px-2 py-0.5 text-xs font-black text-vault-orange-soft underline decoration-dotted"
            >
              add key in Settings
            </button>
          ))}
      </div>

      {variables.length > 0 && (
        <div className="space-y-2">
          {variables.map((variable) => (
            <label key={variable} className="block">
              <span className="mb-1 block font-mono text-xs font-black text-vault-purple-soft">{variable}</span>
              <input
                value={values[variable] ?? ''}
                onChange={(event) => setValues((current) => ({ ...current, [variable]: event.target.value }))}
                className="w-full rounded-lg border border-vault-border bg-vault-surface px-2 py-1.5 text-sm text-slate-100 focus:border-vault-purple"
              />
            </label>
          ))}
        </div>
      )}

      <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-vault-border bg-black/20 p-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">System</p>
        <p className="mb-2 whitespace-pre-wrap font-mono text-xs text-slate-400">{systemPrompt || '[empty]'}</p>
        {turns.map((turn, index) => (
          <div
            key={index}
            className={`rounded-xl px-3 py-2 text-sm ${
              turn.role === 'user'
                ? 'bg-vault-orange/10 text-vault-orange-soft'
                : turn.role === 'error'
                  ? 'bg-red-500/10 text-red-300'
                  : 'bg-vault-lime/10 text-slate-200'
            }`}
          >
            <span className="mr-2 text-xs font-black uppercase">{turn.role}</span>
            <span className="whitespace-pre-wrap">{turn.content}</span>
          </div>
        ))}
        {isRunning && <p className="px-3 text-sm text-slate-500">Calling {providerMeta[provider].label}…</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={userMessage}
          onChange={(event) => setUserMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              send();
            }
          }}
          placeholder="Type a user message…"
          className="flex-1 rounded-xl border border-vault-border bg-vault-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-orange"
        />
        <button type="button" className={primaryButton} onClick={send} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function VersionsTab({ original, workingText }: { original: string; workingText: string }) {
  const lines = useMemo(() => diffLines(original, workingText), [original, workingText]);
  const stats = useMemo(() => diffStats(lines), [lines]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">Version Diff</h3>
        <p className="text-sm text-slate-400">Compare the original template (A) against your working canvas (B).</p>
      </div>

      <div className="flex gap-2 text-xs font-black">
        <span className="rounded-full bg-vault-lime/10 px-2 py-1 text-vault-lime">+{stats.added} added</span>
        <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-300">-{stats.removed} removed</span>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-2xl border border-vault-border bg-black/20 p-3 font-mono text-xs leading-6">
        {lines.map((line, index) => (
          <div
            key={index}
            className={
              line.kind === 'added'
                ? 'bg-vault-lime/10 text-vault-lime'
                : line.kind === 'removed'
                  ? 'bg-red-500/10 text-red-300'
                  : 'text-slate-400'
            }
          >
            <span className="mr-2 select-none opacity-60">{line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' '}</span>
            {line.text || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
}

function EvaluateTab({ workingText }: { workingText: string }) {
  const result = useMemo(() => evaluatePrompt(workingText), [workingText]);
  const gradeColor =
    result.grade === 'A' ? 'text-vault-lime' : result.grade === 'B' ? 'text-vault-lime-soft' : result.grade === 'C' ? 'text-vault-orange-soft' : 'text-red-300';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white">Quality Benchmark</h3>
          <p className="text-sm text-slate-400">LLM-as-a-judge style rubric across five gates.</p>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-black ${gradeColor}`}>{result.grade}</p>
          <p className="text-xs text-slate-400">{result.total}/{result.max}</p>
        </div>
      </div>

      <div className="space-y-3">
        {result.gates.map((gate) => (
          <div key={gate.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-200">{gate.label}</span>
              <span className="font-black text-slate-400">{gate.score}/{gate.max}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-vault-border">
              <div className="h-full rounded-full bg-vault-purple" style={{ width: `${(gate.score / gate.max) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{gate.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompressTab({ workingText, onApply }: { workingText: string; onApply: (text: string) => void }) {
  const compressed = useMemo(() => compressPrompt(workingText), [workingText]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-white">Context Compression</h3>
        <p className="text-sm text-slate-400">Dedupe lines, strip filler, and bulletize for tighter KV-cache alignment.</p>
      </div>

      <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-vault-border bg-black/20 p-3 font-mono text-xs leading-6 text-slate-300">
        {compressed || '[nothing to compress]'}
      </pre>

      <button type="button" className={primaryButton} onClick={() => onApply(compressed)} disabled={!compressed}>
        <Minimize2 className="h-4 w-4" aria-hidden="true" />
        Apply compression to canvas
      </button>
    </div>
  );
}

function ExportTab({ prompt, onCopy }: { prompt: PromptTemplate; onCopy: (text: string) => void }) {
  const [agentFormat, setAgentFormat] = useState<AgentFileFormat>('cursorrules');
  const [config, setConfig] = useState({ projectName: '', standards: 'Use TypeScript strict mode\nWrite tests for new logic', globs: 'src/**/*.ts' });

  const copyFormats: Array<{ id: CopyFormat; label: string }> = [
    { id: 'raw', label: 'Raw Text' },
    { id: 'interpolated', label: 'Interpolated' },
    { id: 'apiPayload', label: 'API Payload JSON' },
    { id: 'markdown', label: 'Markdown Doc' },
  ];

  const agentFile = useMemo(
    () => buildAgentFile(agentFormat, { ...config, body: prompt.prompt }),
    [agentFormat, config, prompt.prompt],
  );

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black text-white">Multi-Format Export</h3>
        <p className="text-sm text-slate-400">Copy the canvas in several formats or generate an IDE agent rules file.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {copyFormats.map((format) => (
          <button
            key={format.id}
            type="button"
            className={actionButton}
            onClick={() => onCopy(buildCopyPayload(prompt, format.id, prompt.prompt))}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            {format.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-vault-border bg-vault-surface/70 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-vault-orange" aria-hidden="true" />
          <h4 className="font-black text-white">IDE Agent Rules</h4>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ['cursorrules', '.cursorrules'],
              ['mdc', '.mdc'],
              ['claude-md', 'CLAUDE.md'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAgentFormat(id)}
              className={`rounded-full border px-3 py-1.5 font-mono text-xs font-bold transition ${
                agentFormat === id ? 'border-vault-purple bg-vault-purple/15 text-vault-purple-soft' : 'border-vault-border text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={config.projectName}
          onChange={(event) => setConfig((current) => ({ ...current, projectName: event.target.value }))}
          placeholder="Project name"
          className="mb-2 w-full rounded-lg border border-vault-border bg-vault-base px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
        />
        <input
          value={config.globs}
          onChange={(event) => setConfig((current) => ({ ...current, globs: event.target.value }))}
          placeholder="Globs (comma separated)"
          className="mb-2 w-full rounded-lg border border-vault-border bg-vault-base px-2 py-1.5 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-lime"
        />
        <textarea
          value={config.standards}
          onChange={(event) => setConfig((current) => ({ ...current, standards: event.target.value }))}
          rows={3}
          placeholder="One standing order per line"
          className="mb-3 w-full resize-y rounded-lg border border-vault-border bg-vault-base px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-vault-purple"
        />

        <pre className="mb-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-vault-border bg-black/20 p-3 font-mono text-xs leading-6 text-slate-300">
          {agentFile.content}
        </pre>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={actionButton} onClick={() => onCopy(agentFile.content)}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy {agentFile.filename}
          </button>
          <button type="button" className={primaryButton} onClick={() => download(agentFile.filename, agentFile.content)}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download {agentFile.filename}
          </button>
        </div>
      </div>
    </div>
  );
}
