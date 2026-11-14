---
inclusion: always
---

# ProofGap X engineering rules

Provenance of this file: added in Phase 7 (14 Nov 2026). It records the rules the earlier phases actually followed, which came from the maintainer's written briefs. It did **not** exist during Phases 1–6 and did not steer them.

## Product claims
- Report the structure of support under **declared** provenance. Never state that a claim is true, that a file is authentic, or anything about intent or guilt.
- Only byte identity of local files can be **verified**. Provenance and independence are declared, suspected or unknown, never verified.
- Hashes the tool computes itself (`observedSha256`) never set an integrity status to `VERIFIED`; only a matching *declared* hash does.
- Findings are logical; recommendations and plans are heuristic and hypothetical, and must cite only identifiers that exist in the case.

## Code
- Native ES modules, Node.js >= 20, **zero runtime dependencies**. Ask before adding any dependency.
- No network, child processes, `eval`, or `process.env` in `src/` (enforced by `test/security.test.js`).
- Outputs must be deterministic: no timestamps, sorted keys, no dependence on input order or id spelling (metamorphic tests).
- Untrusted text: JSON output escapes `< > & U+2028 U+2029`; the viewer inserts text with `textContent` only and runs under a hash-locked CSP.
- The CLI never overwrites files (`wx`) and reads at most the input size limit.

## Changing behaviour
- Any scoring or classification change bumps `ANALYSIS_VERSION`, updates the `POLICY` text, and gets a regression test that fails on the previous engine.
- Never edit an existing test expectation to hide a defect. If an expectation was wrong, record why in `.kiro/specs/proofgap-x/tasks.md`.
- Benchmarks: develop on `dev` only; a held-out split is evaluated once, after the engine freeze, and its result is committed under `bench/results/` (never overwritten).

## Verify before reporting
```sh
npm test                    # full suite
npm run validate:local      # suite + focused groups + benchmark reproducibility, recorded in validation/<id>/
```
GitHub Actions is BLOCKED_BY_BILLING: never report CI as passed until a run has actually executed.

## Independence
ProofGap X is a standalone project. Do not import, copy or reference code from ATHARNEX or EvidenceForge X.
