# PromptVault Studio

PromptVault Studio is a dark, cyber-professional React SPA for managing, searching, editing, forking, and executing production-grade AI prompt templates.

## Features

- 14 preloaded prompt categories and production templates, including Elite Hacker (offensive security), Poker Pro (GTO strategy), and Logic Responder (zero-fluff numbered output).
- Live search across titles, tags, prompt text, model tags, categories, and variable names.
- Model filtering for GPT-4o, Claude 3.5, Gemini 2.5, DeepSeek, and Local LLM.
- Dynamic variable engine for `[VARIABLE_NAME]` tokens with real-time interpolation.
- Copy, fork, favorite, create, edit, delete, JSON import, and JSON export workflows.
- Architecture Lab with a guided 7-pass prompt engineering builder and branch snapshots.
- Prompt Studio workspace with 13 tools: framework scaffolding (RTCC/CRISPE/STCO/TCREI/ReAct/ToT), XML structural tagging, meta-prompt self-refinement, multi-model translation (Claude/OpenAI/Gemini/Ollama), anti-slop and hallucination guardrails, persona calibration, few-shot builder, multi-pass pipeline, a mock test sandbox, version diffing, an LLM-as-judge quality rubric, context compression, and multi-format/agent-file export.
- Token counter + cost/context-window HUD with per-model estimates.
- Bring-Your-Own-Key (BYOK) settings drawer: store OpenAI, Anthropic, Google Gemini, and DeepSeek keys (plus a local Ollama URL) encrypted at rest in the browser, and run the Studio test sandbox live directly against the selected provider.
- Variable engine supporting both `[VARIABLE_NAME]` and `{{variable}}` syntaxes.
- LocalStorage persistence with guarded JSON import validation, falling back to in-memory session state when a sandboxed origin blocks storage.
- Responsive dark UI using Vite, React, TypeScript, Tailwind CSS, and lucide-react.

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```
