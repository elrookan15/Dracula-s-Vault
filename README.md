# PromptVault Studio

PromptVault Studio is a dark, cyber-professional React SPA for managing, searching, editing, forking, and executing production-grade AI prompt templates.

## What it is

PromptVault Studio is a fully client-side single-page app (React + TypeScript + Vite + Tailwind) that acts as a **library, playground, and engineering workspace for production-grade AI prompts**. Everything runs in the browser — there is no backend — and it persists to the browser with a graceful in-memory fallback when storage is blocked. It is built for people who treat prompts as engineered artifacts: templating them, versioning them, quality-scoring them, and running them against real models with their own API keys.

## At a glance

- 14 preloaded prompt categories and production templates.
- Live multi-dimensional search, category counts, and model filtering.
- Dynamic variable engine supporting both `[VARIABLE_NAME]` and `{{variable}}`.
- Two builders: the Architecture Lab (7-pass guided builder) and the 13-tool Prompt Studio.
- Bring-Your-Own-Key live model execution with encrypted-at-rest keys.
- Local-first persistence, JSON backup/restore, and a sandbox-safe fallback.
- 62 unit tests and GitHub Actions CI.

## The core library ("Master Vault")

The app launches pre-loaded with **14 categories**, each with a production-grade template. Eleven are general-purpose (Writing, Code Review, Resume/Career, Financial Advisor, Agentic Architect, Data Analysis, Research OS, Creative/Visual, Marketing, Project Management, Game Design) and three are specialized personas: **Elite Hacker** (authorized-scope offensive security with strict jargon discipline), **Poker Pro** (risk-averse GTO strategy), and **Logic Responder** (a zero-fluff, strictly-numbered output contract).

Around that library you get:

- **Live multi-dimensional search** across titles, descriptions, tags, prompt body, model tags, category names, and variable names.
- A **category sidebar with live counts** and a **model filter** (GPT-4o, Claude 3.5, Gemini 2.5, DeepSeek, Local LLM).
- Full CRUD on custom prompts — **create, edit, delete, favorite, and fork** any template into your local library.
- **JSON import/export** for full vault backup/restore, with validation that rejects malformed payloads and re-IDs imported seed prompts to avoid collisions.

## The dynamic variable engine

Prompts use bracketed or braced tokens — both **`[VARIABLE_NAME]`** and **`{{variable}}`** are supported. The engine parses them automatically and, in the **execution drawer**, renders a form field per variable with a live interpolated preview: filled values render in green, unresolved tokens stay purple. You can copy the formatted result or export the run as JSON. This path is hardened against prototype-named variables such as `{{constructor}}`.

## Two builders

**Architecture Lab** — a guided **7-pass prompt builder** (Identity → Tone → Objective → Context → Structure → Constraints → Logic) with **branch snapshots** (V1, V2, …) so you can fork a design and refine alternate strategies without losing the original.

**Prompt Studio** — a per-prompt workspace with a **persistent Token/Cost/Context HUD** (heuristic token estimate, per-provider cost estimate, and a context-window meter that recomputes as you switch models) and **13 tools**:

| Tool | What it does |
| --- | --- |
| Framework scaffolding | Generates RTCC, CRISPE, STCO, TCREI, ReAct, and Tree-of-Thoughts structures |
| XML structure | Wraps content in Anthropic-style `<system>`/`<instructions>`/`<guardrails>` tags |
| Meta-prompt | Turns a rough idea into a self-refining meta-prompt |
| Translate | Adapts the prompt to Claude XML, OpenAI payload, Gemini, or Ollama format |
| Guardrails | Appends anti-slop filters and hallucination/citation grounding rules |
| Persona | Authority/jargon sliders + tone to generate a persona block |
| Few-shot | Builds reorderable input/output examples in JSON, YAML, or Markdown |
| Pipeline | Sequences a multi-pass workflow (e.g. audit → optimize → refactor) |
| Sandbox | Runs a chat turn — simulated, or live against a real model |
| Versions | Git-style line diff of the working canvas vs. the original |
| Evaluate | LLM-as-judge-style rubric scoring five gates into a letter grade |
| Compress | Dedupes and bulletizes to tighten context |
| Export | Copies as raw/interpolated/API-payload/markdown, or generates `.cursorrules`/`.mdc`/`CLAUDE.md` agent files |

## BYOK and live execution

A **Settings drawer** lets you bring your own keys for OpenAI, Anthropic, Google Gemini, and DeepSeek (plus a local Ollama URL). Keys are **encrypted at rest** with a Web Crypto AES-GCM device key (stored as `enc:` blobs, never plaintext), and calls go **directly from your browser to the provider**. The Studio sandbox's Live-mode toggle routes each model to its provider and surfaces auth/CORS/network errors gracefully instead of crashing.

> Security note: client-side at-rest encryption blocks casual inspection of storage but is not protection against someone with access to your device, since the decryption key also lives locally. OpenAI, Anthropic, and Gemini support direct browser calls; DeepSeek and Ollama may require CORS configuration (the UI flags this).

## Specialties

Things that make the app robust, not just featureful:

- **Sandbox-survivable**: storage access is feature-detected and falls back to an in-memory session with a clear "session-only" banner; clipboard has a selection-based fallback; saving avoids native form submission (which sandboxed frames block).
- **Security-minded client code**: prototype-safe variable lookups, YAML escaping in `.mdc`/few-shot exports, and validated JSON import.
- **Correctness guards**: a size guard on the diff algorithm, word-boundary matching in the evaluation rubric, and dynamic Markdown fence length so code-containing prompts export cleanly.
- **Quality gates**: 62 Vitest unit tests on the pure logic and a GitHub Actions CI running typecheck → test → build on every PR.

## Tech & design

React 19 + TypeScript (strict) + Vite + Tailwind CSS + lucide-react, in a high-contrast "GitHub Dark" / cyber-professional theme — charcoal/gunmetal surfaces with lime, electric-purple, and orange accents, Inter for UI and JetBrains Mono for prompt/code text, and responsive drawer-based interactions.

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint    # TypeScript typecheck
npm test        # Vitest unit tests
npm run build   # production build
```

Unit tests live next to the code as `src/**/*.test.ts` and cover the pure logic
(variable interpolation, tokenizer, diffing, evaluation rubric, YAML escaping,
exporters, translators, provider routing/calls, and encrypted key storage).
CI runs typecheck, tests, and build on every pull request via GitHub Actions.
