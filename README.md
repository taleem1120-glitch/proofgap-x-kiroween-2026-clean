# ProofGap X

Explainable evidence-confidence stress testing for digital investigations (Kiroween 2026).

> **Status: Phase 1 prototype.** Not forensic software, not independently validated or security-audited, not enterprise-ready. Output describes *declared provenance and support structure*, never guilt, intent, or authenticity.

## What it does
Imports a structured JSON case, tracks which sources evidence came from, collapses duplicates and derived copies, and reports per claim whether support is missing, insufficient, conflicting, or backed by independent origins, with plain-language explanations. Reports are byte-reproducible.

## Setup
Requires Node.js >= 20. No dependencies to install.

```sh
npm test                                   # run tests
node src/cli.js examples/sample-case.json  # print report
node src/cli.js examples/sample-case.json --out report.json  # refuses to overwrite
```

## Case format (schema 1.0)
See `examples/sample-case.json` (synthetic). Top level: `schemaVersion: "1.0"`, `caseId`, `title`, `sources[]` (`id`, `name`, optional `derivedFrom[]`, `originGroup`), `claims[]` (`id`, `statement`), `evidence[]` (`id`, `sourceId`, `description`, optional `sha256`, `links[]` of `{claimId, stance: supports|contradicts, strength 0..1}`). IDs match `[A-Za-z0-9_.-]{1,64}`.

## Security defaults
Local only (no network code, no telemetry); 1 MB input cap; item/string/depth limits (`src/limits.js`); `__proto__`/`constructor`/`prototype` keys and control characters rejected; derivation cycles rejected; output escapes `< > & U+2028/9`; CLI never overwrites files. Don't commit real case data.

## Validation
Input is checked in three stages before analysis: forbidden-key scan, then the JSON Schema in `schemas/case.v1.schema.json` (strict: unsupported properties rejected), then semantic checks (unique ids, reference integrity, derivation cycles/depth). Errors are path-specific, e.g. `$.evidence[0].sourceId: unknown source "x"`. The in-repo schema validator (`src/schema.js`) supports only the keyword subset the schema uses and rejects any other keyword. Exit codes: 0 ok, 1 invalid input or I/O failure, 2 usage.

## Tests
`npm test` runs unit, schema, seeded property/fuzz and CLI tests (details and recorded results in `.kiro/specs/phase1/acceptance.md`).

## Known limitations
- Independence relies on provenance the case author declares; undeclared common origins are invisible.
- `sha256` values are not verified against actual files.
- Scores are a simple heuristic (noisy-OR over independent origins, threshold of 2), uncalibrated.
- Duplicate detection by description is exact after trim/lowercase only.
- Fuzzing is seeded and small (200 seeds per property), not coverage-guided. Ajv/fast-check could not be installed (registry 403), so a small in-repo validator and PRNG are used. No formal threat model or external review.

## Layout
`src/` code, `test/` tests (`node:test`), `examples/` synthetic data, `.kiro/specs/phase1/` requirements, design, tasks, acceptance; `.kiro/KIRO_USAGE.md` factual Kiro usage log.
