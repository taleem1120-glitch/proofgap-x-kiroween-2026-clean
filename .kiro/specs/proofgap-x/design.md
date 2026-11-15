# Phase 1 Architecture

Zero runtime dependencies; native ES Modules; Node >= 20 (`node:test`).

| Module | Role |
|---|---|
| `src/limits.js` | Frozen default resource limits |
| `src/validate.js` | Size-limited parse, schema validation, forbidden keys, cycle/depth checks |
| `src/analyze.js` | Origin resolution, duplicate detection, per-claim classification, noisy-OR scores |
| `src/canonical.js` | Canonical (sorted-key) JSON for hashing and ordering |
| `src/report.js` | Deterministic, safely encoded report serialization |
| `src/cli.js` | `proofgap <case.json> [--out file]`; local files only |

Scoring: per claim, evidence is grouped by independence group (sorted root origins); each group contributes its max strength once; groups combine by noisy-OR. The score is a transparent heuristic over *declared* provenance; it is not a probability of truth.

Trust boundary: the case file is untrusted input; provenance declarations inside it are taken at face value (see limitations).

## Phase 3 modules
| Module | Role |
|---|---|
| `src/independence.js` | root resolution, union-find independence groups, cluster explanations |
| `src/gaps.js` | logical findings, heuristic ranked recommendations, assumptions |
| `src/integrity.js` | opt-in local SHA-256 verification with path/resource safety |
| `src/render.js` | human-readable text report |
| `src/analyze.js` | artifact merging, scoring (policy in `POLICY`), report assembly |
| `bench/` | hidden-truth synthetic dataset, detectors, metrics, runner |
Data flow: validated case → (optional) integrity results → artifact classes → independence groups → per-claim contributions → findings/recommendations → report (JSON canonical / text).

## Phase 11: core interface and applications
```
apps/proofgap-x/cli.js ──┐                       ┌─ validate / schema / limits
                         ├─> src/core.js (1.0.0) ─┼─ analyze (independence, gaps, planner, graph, abstention)
apps/proofgap-cite/ ─────┘   analyze(), readInputFile, ├─ integrity (local SHA-256, safe paths)
  parse.js  (Markdown → note)  writeNewFile, renderers └─ report / render / html + viewer/
  lineage.js (cycles → originGroup; cites → derivedFrom; refs → sources; saved copies → evidence)
  verdict.js (primary-rooted origins, URL/DOI cues → Cite verdicts + what is missing)
```
The core report is extended, never replaced: Cite adds `cite`, per-claim `line`, `missing`, `citeEvidence`, and `coreDecision`, while keeping `status`. `decision` carries the Cite verdict so the shared viewer shows it.
