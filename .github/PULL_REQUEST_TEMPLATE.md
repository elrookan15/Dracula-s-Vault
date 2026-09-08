## Description
[What changed and why — one paragraph, zero fluff.]

## Correction Contract (required for any code change)
- **Root Cause:** [Mechanical description of failure mode or change driver]
- **Patch:** [Diff summary / file blocks]
- **Red Test:** [Failing on old code + CLI trace]
- **Green Test:** [Passing on new code + CLI trace]
- **Regression Guard:** [Automated check preventing recurrence]
- **Residual Risk:** [Unverified parameters / out-of-scope boundaries]

## Disproof Gate
1. **Failure Vector:** Where is this most likely wrong?
2. **Verified Evidence:** Exact files/lines/CLI outputs verified.
3. **Unverified Boundaries:** Assumptions left unverified.
4. **User Decision Points:** Trade-offs requiring human authorization.

## Checklist
- [ ] Zero placeholders (`TODO`/`FIXME`/`TBD`/`any`)
- [ ] Authorization enforced server-side (never client-only)
- [ ] STRIDE / OWASP reviewed
- [ ] Audit-trail note included: date, requester, rationale
