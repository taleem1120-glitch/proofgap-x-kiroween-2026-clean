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

---

# Phase 3 Tasks — advanced evidence intelligence

Branch: `feature/phase3-evidence-intelligence` (based on `feature/phase2-schema-security`; PRs #1 and #2 were still open/unmerged when work started).

- [x] P3-1 Independence engine (`src/independence.js`): union-find independence groups over declared roots, `originGroup` and shared artifacts; per-cluster plain-language reasons; declared vs verified kept separate (`trust` block, `corroboration.independenceBasis`).
- [x] P3-2 Proof-gap engine (`src/gaps.js`): LOGICAL findings + ranked HEURISTIC recommendations, each with *would show / would NOT show*.
- [x] P3-3 Local integrity (`src/integrity.js`): opt-in `--evidence-dir`; states VERIFIED/MISMATCH/MISSING/UNSAFE_PATH/NOT_CHECKED; path allow-list, no symlinks, regular files only, containment check, file/size/total/time limits.
- [x] P3-4 Adversarial, metamorphic and regression tests (`adversarial`, `metamorphic`, `regression`, `security` test files).
- [x] P3-5 Benchmark (`bench/`, `docs/BENCHMARK.md`): hidden-truth synthetic data, dev vs held-out, 4 baselines + ProofGap 0.1.0 + current.
- [x] P3-6 Threat model `docs/THREAT_MODEL.md`; GitHub Actions workflow `.github/workflows/ci.yml` (Node 20 + 22, `npm ci`, SHA-pinned actions) — **workflow result: see acceptance.md (not claimed until observed)**.
- [x] P3-7 Demo (`examples/demo`, `docs/DEMO.md`), text report renderer, README.

## Phase 3 confirmed defects (found by new tests; each regression test was observed FAILING before its fix)
| ID | Defect in the Phase 1/2 engine | Effect | Fix (analysis 0.2.0) | Regression test |
|---|---|---|---|---|
| D1 | A duplicate artifact was dropped wholesale | Links of the duplicate to *other claims* silently lost | Duplicate items are merged into one artifact; all links kept, counted once | `regression.test.js` D1 |
| D2 | Same, for stance | A contradicting duplicate vanished instead of creating a conflict | Merged links keep both stances | D2, `adversarial` A7 |
| D3 | Which duplicate survived depended on id sort order | Relabeling ids could manufacture a second "independent" origin | Sources that cite the same artifact are unioned into one group | D3 |
| D4 | `originGroup` made `derivedFrom` be ignored | Declared derived copy counted independent | Roots = group ∪ parents' roots | D4 |
| D5 | Independence key was the joined root string | A source derived from {r1,r2} counted independent of r1 | Union-find components: any shared root ⇒ one group | D5 |
| D6 | Same as D5 for overlapping partial derivations | r1+r2 vs r2+r3 counted independent | Union-find transitive closure | D6 |
| D7 | Origin strength = max over all evidence | A derived copy with self-assigned strength 1.0 raised the origin's strength | Strength comes from non-derived evidence when present | D7, D7b |
| D8 | Derived-only cluster strength = max | Adding another derived copy rated 1.0 raised 0.5 → 1.0 (found by metamorphic M5, seed 5009) | Derived-only clusters use the minimum | D8 (observed failing: "score rose 0.5 -> 1") |
Also: `npm test` used a quoted glob that Node 20 does not expand; changed to an unquoted glob (shell-expanded). **Node 20 behaviour NOT TESTED locally** (see CI).

### Scoring-policy changes (explicit, not silent)
D1–D8 change scores/origin counts only in the affected situations (they can only make results *more conservative* or merge origins; no case gains corroboration). `analysisVersion` is now `0.2.0` and every report carries `policy` text. The threshold (2 origins) and noisy-OR combination are unchanged. The only opt-in policy: when `--evidence-dir` is used, MISMATCH evidence is excluded from scoring.

## Phase 3 limitations / NOT TESTED
- NOT TESTED locally: Node 20 (only v22.23.4 available); CI result unknown until GitHub reports it (see acceptance.md).
- NOT TESTED: Windows/macOS; case-insensitive or Unicode-normalising filesystems; hard-link/bind-mount/namespace tricks beyond the tested hard-link behaviour (hard links ARE hashed — documented limitation).
- NOT TESTED: real investigator workflows, usability of the recommendations, any real-world case data.
- Declared provenance is still unverifiable: undeclared copies fool every detector including ProofGap (benchmark: FPR 100% on that slice).
- Benchmark is synthetic and author-built; "held-out" shares the generator. Latency/memory are single-machine single-pass numbers.
- Ajv/fast-check still not installed (registry returned 403 in Phase 2; not retried in a way that circumvents policy). In-repo validator remains less reviewed than Ajv.
- No independent security review; the threat model is self-authored.

## Next priorities
1. Independent review of `integrity.js` and the threat model; add Windows/macOS CI jobs.
2. Evaluate on a benchmark authored by someone else, including real redacted cases if available.
3. Provenance-evidence model: let cases attach verifiable provenance facts (custody records) so independence can be *verified*, not only declared.
4. Heuristic undeclared-dependence detection with measured precision/recall (currently unscored warnings only).
5. Retry Ajv/fast-check when the registry is reachable and use them as differential oracles.
6. Report signing; HTML/CSV encoders with their own tests.

## Phase 3b — local validation while CI is BLOCKED_BY_BILLING
- [x] `scripts/validate-local.js` / `npm run validate:local`: full suite + focused groups + benchmark reproducibility check; records environment, hashes and logs in `validation/<id>/`.
- [x] `docs/CI_STATUS.md`: CI marked BLOCKED_BY_BILLING; workflow preserved unchanged; no billing change, no re-run.
- Remaining: owner resolves billing and runs CI (Node 20/22); Node 20 NOT TESTED until then.

---

# Phase 5 — competition-grade differentiator (analysis 0.3.0)

Branch `feature/phase5-competition-grade` (from `feature/phase3-evidence-intelligence`; PRs #1–#3 open, unmerged).

## Initial gap assessment (before coding)
| Area | State at start of Phase 5 | Decision |
|---|---|---|
| Report viewer | **None** (text/JSON only) — biggest gap for Design and Presentation | Build (highest value) |
| Independence graph | Not exposed; relationships not labelled verified/declared/suspected/unknown | Build (small, feeds viewer) |
| Counterfactual planner | Only free-text heuristic suggestions | Build (deterministic, reuses classification rule) |
| Two contrasting demo cases | One mixed demo case | Build |
| Abstention | Warnings existed but never changed the decision; no "unknown" outcome | Build (separate `decision` from `status`) |
| 100 % FPR question | Real: undeclared-copy slice only; warnings never evaluated | Investigate + report separately |
| Licence / public repo | Missing / private | Flag only (owner decision) |
| CI | BLOCKED_BY_BILLING | Unchanged, not touched |

## Done
- [x] P5-1 Probe of 0.2.0 found **D9** (uncited bridge source merges origins); fixing it exposed **D10** (one cited derivative of two origins erased genuine corroboration: "corroboration denial"). Independence redefined as max set of pairwise-disjoint declared root sets per claim (`packOrigins`, exact for overlap components ≤ 22, flagged `approximate` otherwise — never seen in tests/benchmark).
- [x] P5-2 Metamorphic tests then exposed defects in my own intermediate redesign, fixed before freeze: M3 id-order dependence among equal-size packings (choose highest-score packing); **D11** artifact sharing not inherited by derivatives; derived-only strength rules (min over overlapping derived, cap by overlapping non-derived; non-derived supersets lend strength). A one-off stress run of 3,000 extra seeds then found a shared-artifact-across-lineages pattern → **D12** (suspected relationship → abstain). After the fixes, the stress run showed 0 violations of M1/M3/M5-monotonicity/M10 and 0 unsafe M5 cases.
- [x] P5-3 `src/graph.js` (four relationship bases), `src/classify.js` (single rule), `src/planner.js` (counterfactual plans), `decision`/`abstentionCues` in reports.
- [x] P5-4 Offline viewer (`viewer/app.js`, `viewer/style.css`, `src/html.js`), CLI `--format html` / `--compare`, committed `viewer/showcase.html`, showcase cases in `examples/showcase/`.
- [x] P5-5 Browser verification via Playwright Power; fixed glyph and overflow defects.
- [x] P5-6 Benchmark: decision vs status vs warnings reported separately; `bridge_three_roots` label corrected (documented); 2 templates added; fresh split `heldout2` evaluated once after freeze; 0.2.0 snapshot added as a detector.
- [x] P5-7 Docs: `docs/COMPETITION.md`, `docs/DEMO.md`, `docs/BENCHMARK.md`, threat model T13–T15, README, KIRO_USAGE.

## Test changes made in Phase 5 (each is a deliberate semantic change, not a hidden expectation edit)
- `adversarial.test.js` A4: expected origins 1 → **2** (D10: a bridge no longer merges independent originals); still asserts a bridge cannot make a third origin, and that bridge + r1 alone = 1.
- `metamorphic.test.js` M5: union-find assertion replaced by the 0.3.0 invariants (monotone, ≤ +1, covered copy adds nothing unless artifact entanglement applies, in which case no clean SUPPORTED) — stricter, with an independent root oracle; M10 added.
- `regression.test.js`: D9–D12 added. D9, D10, D12 were run against the unmodified 0.2.0 engine and **fail there**; D11 passes on 0.2.0 (it guards a defect of the intermediate Phase 5 design).
- `graph.test.js`: one fixture corrected (p and q hold byte-identical files, so the engine correctly does not call them declared-independent).

## Remaining (prioritised)
1. Owner: choose an OSI licence and make the repository public (submission blocker); verify official categories/rules (pages returned 403).
2. Owner: resolve GitHub billing; run CI on Node 20/22.
3. Record the < 3 min video from `docs/DEMO.md`.
4. Undeclared dependence without cues (37/88 caught on heldout2): evaluate stronger, still deterministic cues with measured precision.
5. Screen-reader and cross-browser checks of the viewer; better graph layout for large cases.
6. External review of `integrity.js`, the viewer CSP and the independence definition.

---

# Phase 6 — verified provenance signal and delivery gates (analysis 0.4.0)

Branch `feature/phase6-verified-provenance` (from `feature/phase5-competition-grade`; PRs #1–#4 open, unmerged).

- [x] P6-1 Root cause of 37/88 (heldout2): warning recall on undeclared-origin claims. 37 = all `undeclared_copy_with_cues`; 0/51 `undeclared_copy`. Those 51 are structurally identical to 78 `genuine_independent` claims, so they are undetectable from case data alone (see `docs/BENCHMARK.md`).
- [x] P6-2 One focused improvement: `integrity.js` records `observedSha256` (and `observedEmpty`) for every safely read file, including files without a declared hash (status stays NOT_CHECKED). `analyze.js` uses observed bytes as artifact identity when verification ran. `graph.js` marks `same_bytes` as verified only when the tool hashed both files, with `discoveredBy: local_hashing` when they were not both declared. Analysis version is now 0.4.0 and the policy text is updated.
- [x] P6-3 Tests: `test/observed.test.js` (12: D13 regression against the 0.3.0 snapshot, no-evidence-dir equivalence on 120 cases, re-encoded / empty / symlink / hard link / missing / limit / fake-hash manipulation, determinism).
- [x] P6-4 File-backed benchmark (`bench/files.js`, `bench/run-files.js`, `bench/legacy/v0.3.0` snapshot): dev used in development; heldout3 evaluated once after freeze.
- [x] P6-5 Showcase: A8 no longer declares a hash (the link must come from bytes). Viewer shows "HASHED LOCALLY" and "found by hashing local files" (viewer-only change, made after the engine freeze). Export bytes verified equal to CLI output.
- [x] P6-6 Delivery-gate audit and category assessment in `docs/COMPETITION.md`; licence recommendation only.

Test change in Phase 6: one expectation in my **new** `observed.test.js` was wrong. It assumed a missing file is reported MISSING even after the file-count limit; the engine (since Phase 3) touches no more files once the limit is hit. I split the test; the invariant (no observed hash means no link) is unchanged. No earlier test was modified.

## Remaining (prioritised)
1. Owner: licence (recommend Apache-2.0) and public visibility. These block submission.
2. Owner: confirm the official 2026 category text. If Skeleton Crew, approve building a second distinct application on the same core.
3. Record the video. Resolve CI billing.
4. Near-duplicate detection (re-encoded copies) only with a verifiable, measured method; not attempted.
5. Measure over-merging on real or realistic data containing shared public files.
