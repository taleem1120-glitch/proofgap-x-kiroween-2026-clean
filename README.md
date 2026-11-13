# ProofGap X

Explainable evidence-confidence stress testing for digital investigations (Kiroween 2026).

> **Status: prototype (analysis 0.2.0).** Not forensic software; not independently reviewed or validated; not enterprise-ready. Output describes the *structure of support under declared provenance*. It never states guilt, intent, or authenticity.

## What it does
Reads a structured JSON case and answers, per claim: *how many genuinely independent origins stand behind the support, and what exactly is missing?*
- **Independence engine** – derived copies, shared origin groups, identical artifacts and bridge sources collapse into one origin, with plain-language reasons. Independence is always labelled **declared, not verified**.
- **Proof-gap engine** – LOGICAL findings (e.g. `FALSE_CORROBORATION`, `CONFLICT_UNRESOLVED`) plus ranked HEURISTIC suggestions, each stating what it would show and what it would **not** show.
- **Local integrity (opt-in)** – `--evidence-dir` checks declared SHA-256 values against real files, returning `VERIFIED | MISMATCH | MISSING | UNSAFE_PATH | NOT_CHECKED`. Without it, declared hashes are shown as unverified.
- **Reports** – deterministic JSON (`--format json`, default) and human-readable text (`--format text`).

## 60-second demo
```sh
npm run demo
```
Four items seem to corroborate one claim; ProofGap shows they are one email in three disguises, flags a tampered file and a missing one. See `docs/DEMO.md`.

## Setup and commands
Node.js ≥ 20, **zero runtime dependencies**.
```sh
npm ci                                   # uses package-lock.json (empty dependency tree)
npm test                                 # all tests
npm run validate:local                   # full local validation, recorded under validation/<id>/
npm run bench                            # synthetic benchmark (writes nothing unless --out is given)
node src/cli.js case.json [--out report-file] [--evidence-dir dir] [--format json|text]
```
Exit codes: 0 ok, 1 invalid input/I-O failure, 2 usage. `--out` never overwrites (fails if the path exists).

## Case format (schema 1.0, `schemas/case.v1.schema.json`)
`schemaVersion: "1.0"`, `caseId`, `title`, `sources[]` (`id`, `name`, optional `derivedFrom[]`, `originGroup`), `claims[]` (`id`, `statement`), `evidence[]` (`id`, `sourceId`, `description`, optional `sha256`, optional `file` relative path used only with `--evidence-dir`, `links[]` of `{claimId, stance: supports|contradicts, strength 0..1}`). Unknown properties are rejected. IDs match `[A-Za-z0-9_.-]{1,64}`. See `examples/`.

**CI status:** GitHub Actions is `BLOCKED_BY_BILLING` (jobs never started; not a code failure and not a pass). Only local results exist; see `docs/CI_STATUS.md`.

## Security defaults
Local only (no network/spawn/eval code); 1 MB input cap and item/string/depth limits; schema + semantic validation with `$`-paths; prototype-pollution keys, control/bidi characters and lone surrogates rejected; report output escaped; file verification restricted to an explicit directory (no symlinks, no traversal, regular files only, size/count/time limits). Threat model: `docs/THREAT_MODEL.md`.

## Known limitations (read before relying on anything)
- **Declared provenance cannot be verified.** If a case author hides that two sources share an origin, ProofGap cannot know. In the synthetic benchmark every detector, including this one, fails on such "undeclared copies".
- Scores are an uncalibrated heuristic (noisy-OR over independent origins; threshold of 2), not probabilities.
- A SHA-256 match proves byte equality only. Hard links inside the evidence directory are hashed; Windows/macOS and exotic filesystems are untested.
- The benchmark is synthetic and written by the tool's author; see `docs/BENCHMARK.md`. No real-world accuracy claim is made.
- No independent security review. In-repo schema validator (Ajv could not be installed in the sandbox).

## Layout
`src/` code · `schemas/` JSON Schema · `test/` tests · `bench/` benchmark · `examples/` synthetic data · `docs/` threat model, benchmark, demo · `.kiro/specs/phase1/` requirements, design, tasks, acceptance (all phases) · `.kiro/KIRO_USAGE.md` factual Kiro usage log.
