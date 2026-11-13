# Phase 1 Tasks

- [x] T1 Inspect repo (contained only README + .gitignore)
- [x] T2 Project scaffold (package.json, ESM, `node:test`)
- [x] T3 Validation + limits (R1, R8)
- [x] T4 Provenance/independence + duplicates (R2-R4)
- [x] T5 Claim classification + explanations (R5, R6)
- [x] T6 Deterministic export + safe encoding (R7, R10)
- [x] T7 CLI (R9)
- [x] T8 Tests for duplicates, derived sources, conflicts, malformed input, limits
- [x] T9 Docs, feature branch, PR (not merged)

## Next (not started)
- N1 JSON Schema file + fuzz/property tests
- N2 Verify declared sha256 against actual files (opt-in, local)
- N3 Configurable independence policy and score calibration review
- N4 Streaming/size-bounded file reading, report signing
- N5 Independent security review

---

# Phase 2 Tasks — strict schema validation and security testing

Branch: `feature/phase2-schema-security` (based on `feature/phase1-baseline`; PR #1 was still open and unmerged).

- [x] P2-1 Versioned JSON Schema `schemas/case.v1.schema.json` (`$id` `urn:proofgap-x:schema:case:1.0`): required fields, types, size limits, ASCII-safe ids, text pattern (no controls/bidi), `additionalProperties:false` on every object.
- [x] P2-2 `src/schema.js` validator, integrated in `validateCase` BEFORE analysis: key scan → schema → semantic checks; issues merged, one per path, capped at `maxIssues`.
- [x] P2-3 Seeded property/fuzz tests (`test/fuzz.test.js`, `test/prng.js`): malformed JSON, oversize values, prototype pollution, cycles/excessive depth, duplicate ids, invalid references, Unicode.
- [x] P2-4 CLI hardening: bounded read from an open fd, regular files only, strict arg parsing, no stack traces, output created only after full success with `wx` and mode 0600 (`test/cli.test.js`).
- [x] P2-5 Run everything; fix failures; mutation spot-check of the tests.
- [x] P2-6 Document assumptions, limitations, commands, results (this file, `acceptance.md`, README).

## Deviation from the plan (honest note)
The brief preferred well-reviewed dependencies (e.g. Ajv, fast-check). `npm install ajv fast-check` returned **HTTP 403 Forbidden** from the registry in this sandbox (also for `npm view`), so neither could be installed. I did not work around the policy. Instead:
- the schema is standard JSON Schema 2020-12 restricted to a documented keyword subset, validated by a small in-repo validator that **throws on any schema keyword it does not implement**; Ajv can replace it later without schema changes;
- property tests use an in-repo deterministic PRNG (mulberry32) with 200 fixed seeds instead of fast-check. There is no shrinking; a failure message prints the seed.
`package.json` therefore still has **zero dependencies**. The in-repo validator is less reviewed than Ajv: treat that as a risk.

## Security assumptions
- The case file is untrusted; the analyst running the tool is trusted and runs it locally.
- Declared provenance is taken at face value; the tool cannot detect undeclared common origins or forged `derivedFrom`.
- The tool is single-process, synchronous and offline: no network code (grep in Phase 1 acceptance) and no telemetry.
- Node's `JSON.parse` and RegExp engine are assumed correct. Schema patterns are simple and anchored, with no nested quantifiers.
- Limits are availability controls, not confidentiality controls. Reports contain case text verbatim; protect them like the input.

## Limitations / NOT TESTED
- NOT TESTED: Ajv or any third-party validator; fast-check; shrinking.
- NOT TESTED: Windows/macOS (file-permission and symlink behaviour tested on Linux only); Node 20 (tests ran on the Node version below only).
- NOT TESTED: memory exhaustion or wall-clock limits beyond the bounded cases in the suite (1 MB input, 400k-deep nesting, 5000 evidence items). No timeouts are enforced in library code.
- NOT TESTED: concurrent/race conditions between the existence check and write (mitigated by `O_EXCL` via `wx`, but not stress-tested).
- Custom `limits` passed programmatically are enforced by the semantic layer only; the schema file always carries the *default* limits (consistency test: `schema.test.js`).
- Raising limits above the schema defaults is therefore impossible without changing the schema.
- The fuzz corpus is small (200 seeds per property), not coverage-guided, and has not been run for long durations.
- Two rules exist in both schema and semantic layer (control chars, bidi), so they are redundant by design. A mutation that removed only the bidi check in `validate.js` was NOT caught, because the schema also rejects it. This is intentional defense in depth.
- No independent security review has been performed.

## Remaining risks
1. Custom validator is unreviewed relative to Ajv (mitigated by strict keyword rejection and tests).
2. Declared-provenance trust model (see above).
3. Reports echo untrusted text; `serializeReport` escapes `< > &` and U+2028/9, but any other consumer (HTML, CSV, terminal) needs its own encoding. NOT TESTED in any consumer.
4. No rate/time limits; a pathological but in-limit case is bounded only by the item caps.

## Next
- N1 Try Ajv + fast-check again once the registry is reachable; keep this suite as a differential oracle.
- N2 Opt-in local sha256 verification of real files.
- N3 CI workflow on Node 20 and 22.
- N4 Threat model document and independent review.
