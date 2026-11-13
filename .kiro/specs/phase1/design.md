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
