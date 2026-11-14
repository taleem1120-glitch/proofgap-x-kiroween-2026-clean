# ProofGap X

Explainable evidence-confidence stress testing for digital investigations (Kiroween 2026).

> **Status: prototype (analysis 0.4.0).** Not forensic software; not independently reviewed or validated; not enterprise-ready. Output describes the *structure of support under declared provenance*. It never states guilt, intent, or authenticity.

## What it does
Reads a structured JSON case and answers, per claim: *how many genuinely independent origins stand behind the support, and what exactly is missing?*
- **Independence engine** – derived copies, shared origin groups, identical artifacts and bridge sources collapse into one origin, with plain-language reasons. Independence is always labelled **declared, not verified**.
- **Proof-gap engine** – LOGICAL findings (e.g. `FALSE_CORROBORATION`, `CONFLICT_UNRESOLVED`) plus ranked HEURISTIC suggestions, each stating what it would show and what it would **not** show.
- **Local integrity (opt-in)** – `--evidence-dir` checks declared SHA-256 values against real files, returning `VERIFIED | MISMATCH | MISSING | UNSAFE_PATH | NOT_CHECKED`. Without it, declared hashes are shown as unverified.
- **Reports** – deterministic JSON (`--format json`, default), human-readable text (`--format text`) and a self-contained offline HTML viewer (`--format html [--compare other.json]`).

## 60-second demo
Open **`viewer/showcase.html`** in any browser (offline, no server). Left: "eight documents agree" collapses to **one** independent origin. Right: genuinely independent systems are supported, and one claim **abstains** because two "independent" reports look like one. Each claim has a counterfactual evidence plan. Rebuild with `rm viewer/showcase.html && npm run showcase`; CLI integrity demo: `npm run demo`. See `docs/DEMO.md`.

## What is new in 0.4.0
- **Verified byte identity:** with `--evidence-dir`, every safely readable non-empty file is hashed by the tool, also when the case declares no hash. Byte-identical files are one artifact (basis *verified*, bytes only). Without `--evidence-dir`, nothing changes. Measured effect and limits: `docs/BENCHMARK.md`.

## Introduced in 0.3.0
- **Independence graph** with four explicit relationship bases: verified (bytes checked locally), declared, suspected (heuristic), unknown (assumed, not established).
- **Corroboration-denial-resistant independence**: count = maximum set of evidence with pairwise-disjoint declared root sets, evaluated per claim. Adding evidence never lowers it; copies never raise it.
- **Abstention**: `decision` abstains when a heuristic cue links two support origins; `status` (hard classification) is reported separately.
- **Counterfactual planner**: smallest number of additional evidence outcomes that could change each verdict, with the outcome under each hypothesis computed by the same rule (tested by executing the hypotheticals).
- **Offline viewer** (`--format html`, `--compare`): CSP-locked, no network, untrusted text rendered as text only.

## Setup and commands
Node.js ≥ 20, **zero runtime dependencies**.
```sh
npm ci                                   # uses package-lock.json (empty dependency tree)
npm test                                 # all tests
npm run validate:local                   # full local validation, recorded under validation/<id>/
npm run bench                            # synthetic benchmark (writes nothing unless --out is given)
node src/cli.js case.json [--out report-file] [--evidence-dir dir] [--format json|text|html] [--compare other.json]
```
Exit codes: 0 ok, 1 invalid input/I-O failure, 2 usage. `--out` never overwrites (fails if the path exists).

## Case format (schema 1.0, `schemas/case.v1.schema.json`)
`schemaVersion: "1.0"`, `caseId`, `title`, `sources[]` (`id`, `name`, optional `derivedFrom[]`, `originGroup`), `claims[]` (`id`, `statement`), `evidence[]` (`id`, `sourceId`, `description`, optional `sha256`, optional `file` relative path used only with `--evidence-dir`, `links[]` of `{claimId, stance: supports|contradicts, strength 0..1}`). Unknown properties are rejected. IDs match `[A-Za-z0-9_.-]{1,64}`. See `examples/`.

**CI status:** GitHub Actions is `BLOCKED_BY_BILLING` (jobs never started; not a code failure and not a pass). Only local results exist; see `docs/CI_STATUS.md`.

## Security defaults
Local only (no network/spawn/eval code); 1 MB input cap and item/string/depth limits; schema + semantic validation with `$`-paths; prototype-pollution keys, control/bidi characters and lone surrogates rejected; report output escaped; file verification restricted to an explicit directory (no symlinks, no traversal, regular files only, size/count/time limits). Threat model: `docs/THREAT_MODEL.md`.

## Known limitations (read before relying on anything)
- **Declared provenance cannot be verified.** If a case author hides that two sources share an origin, the hard classification cannot know (synthetic benchmark: 88/88 such claims). The decision abstains only when a cue exists. With local files, byte-identical copies are now caught; re-encoded copies are not (file-backed heldout3: 24/47 still asserted).
- Scores are an uncalibrated heuristic (noisy-OR over independent origins; threshold of 2), not probabilities.
- A SHA-256 match proves byte equality only. Hard links inside the evidence directory are hashed; Windows/macOS and exotic filesystems are untested.
- The benchmark is synthetic and written by the tool's author; see `docs/BENCHMARK.md`. No real-world accuracy claim is made.
- No independent security review. In-repo schema validator (Ajv could not be installed in the sandbox).
- Viewer tested in headless Chromium only; no screen-reader or cross-browser testing.
- **Not publishable yet:** private repository, no OSI license chosen (owner decision). See `docs/COMPETITION.md`.

## Layout
`src/` code · `viewer/` offline viewer + committed showcase · `schemas/` JSON Schema · `test/` tests · `bench/` benchmark · `examples/` synthetic data · `docs/` threat model, benchmark, demo · `.kiro/specs/phase1/` requirements, design, tasks, acceptance (all phases) · `.kiro/KIRO_USAGE.md` factual Kiro usage log.
