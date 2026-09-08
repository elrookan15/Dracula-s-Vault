# PromptVault Studio (Dracula-s-Vault) - Mistake Ledger

This ledger tracks triggers, bad assumptions, corrective rules, and regression tests for errors caught during development, reviews, and CI. Loaded at session start per `.agents/rules/federov_ultimate_edition.md` §4. Append entries using the schema below.

## Entry Template

## [ML-001] YYYY-MM-DD - Short Title

- **Trigger:** Specific function call, error payload, or scenario that revealed the defect.
- **Bad Assumption:** Flawed premise or hallucinated state assumed during initial execution.
- **Corrective Rule:** Strict engineering rule created to prevent recurrence.
- **Regression Test:** File path and test name verifying the corrective rule.
- **Classification:** Security | Logic | Data | Performance | Compliance | Workflow

> No entries yet — the ledger initializes empty. First discovered failure mode gets [ML-001].
