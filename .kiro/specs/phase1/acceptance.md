# Phase 1 Acceptance Criteria

Each is checked by `npm test` unless noted.

| Req | Criterion | Test |
|---|---|---|
| R1 | Malformed JSON, non-objects, bad fields rejected with paths | "malformed inputs are rejected", "duplicate ids, bad ids..." |
| R3 | Derived/transitive/shared-group sources collapse to one origin | "derived source...", "transitive derivation..." |
| R4 | Duplicate hash or source+description flagged and excluded | "duplicate evidence by hash...", "duplicate by source+description..." |
| R5 | All five statuses reachable | single/two-source, conflict, contradicted/no-evidence tests |
| R6 | Disclaimer present; no verdict words | "explanations avoid guilt..." |
| R7 | Identical bytes for repeat runs and reordered keys | "report is deterministic..." |
| R8 | Byte, count, string, depth, cycle, issue-cap, `__proto__` limits | limit/forbidden/cycle tests |
| R9 | No network APIs imported | manual: `grep -rnE "node:(http|https|net|dns|tls|dgram)|fetch\(" src` returns nothing |
| R10 | Markup chars escaped, round-trips | "output encoding..." |

---

# Phase 2 Acceptance Criteria and Evidence

Environment of the recorded run: Node v22.23.4, npm 11.4.2, Linux sandbox. Command: `npm test` (= `node --test "test/*.test.js"`).
Single-file runs: `node --test test/<file>.test.js`.

## Recorded results (actual output counts)
| File | Tests | Pass | Fail |
|---|---|---|---|
| `test/proofgap.test.js` (Phase 1, unchanged) | 19 | 19 | 0 |
| `test/schema.test.js` | 9 | 9 | 0 |
| `test/fuzz.test.js` | 15 | 15 | 0 |
| `test/cli.test.js` | 10 | 10 | 0 |
| **Total (`npm test`)** | **53** | **53** | **0** |

The Phase 1 tests were not modified in Phase 2. Run time was about 1.2 s.

During development one failure occurred (every test failed because I used a `WeakMap` with string keys in `src/schema.js`). I fixed the code, not the tests. A second small failure (missing exports in `src/index.js`) was also a code fix.

## Criteria
| ID | Criterion | Evidence |
|---|---|---|
| P2-A1 | Schema is versioned, strict, and consistent with code limits | `schema.test.js`: "schema file is versioned and consistent with DEFAULT_LIMITS", "every object ... rejects unsupported properties" |
| P2-A2 | Schema validation runs before analysis; errors have `$`-paths and messages | `schema.test.js` path/message tests; `analyzeText` → `parseCaseText` → `validateCase` |
| P2-A3 | Unsupported schema keywords cannot be silently ignored | "validateSchema refuses schemas using unsupported keywords" |
| P2-A4 | Malformed JSON, garbage, truncation, deep nesting (to 400,000 levels) yield only `CaseValidationError` | `fuzz.test.js`: garbage, truncation, deep nesting tests |
| P2-A5 | Limits enforced at boundary (at-limit accepted, limit+1 rejected) for strings, sources, claims, evidence, links, bytes | "oversized values..." |
| P2-A6 | Prototype pollution keys rejected at any depth; `Object.prototype` unchanged; ids like `toString` are handled as plain data | "prototype pollution..." |
| P2-A7 | Cycles/self-reference rejected; accepted iff acyclic per an independent oracle (200 random graphs, both outcomes seen); depth limit boundary; diamond ladder is not exponential | cycle property, depth, fan-in tests |
| P2-A8 | Duplicate ids and dangling references rejected at exact paths | "duplicate identifiers", "invalid provenance references" |
| P2-A9 | Unicode: emoji/ZWJ/RTL/CJK accepted; NUL, DEL, bidi controls, lone surrogates, homoglyph/non-ASCII ids, BOM rejected; U+2028/9 escaped in output | "Unicode edge cases" |
| P2-A10 | CLI: bad input exits 1/2 with no stack trace and creates no output; never overwrites existing files, including input path, symlink, dangling symlink, directory; reads at most maxBytes+1; refuses non-regular files | `cli.test.js` |
| P2-A11 | Generated valid cases are deterministic, order-independent in conclusions, score-bounded | property test (200 seeds) |

## Mutation spot-check (tests can actually fail)
I manually disabled single behaviours and re-ran `npm test`. Failures observed: no forbidden-key scan → 2; no schema step → 3; no cycle check → 5; `additionalProperties` ignored → 3; CLI `wx`→`w` → 2; duplicate detection off → 3; derived-as-independent → 3; schema `pattern` ignored → 2; no byte limit → 2; no lone-surrogate check → 1. The bidi-check-only mutation produced 0 failures (redundant with schema; see tasks.md). All mutations were reverted; the final suite is 53/53.

## How to reproduce
```sh
node --version        # v22.x used
npm test
node --test test/fuzz.test.js
```
Fuzz failures print `seed <n>`; re-run by editing `SEEDS` in `test/prng.js`.

---

# Phase 3 Acceptance Criteria and Evidence

Classification: **VERIFIED** = observed by running the command in this sandbox; **FAILED** = observed failing; **NOT TESTED** = not run.
Environment: Node v22.23.4, npm 11.4.2, Linux sandbox. Commands: `npm ci`, `npm test`, `node --expose-gc bench/run.js both --out ...`.

## Test results (`npm test`, observed)
| File | Tests | Pass | Fail |
|---|---|---|---|
| proofgap.test.js (Phase 1, unmodified) | 19 | 19 | 0 |
| schema.test.js (Phase 2, unmodified) | 9 | 9 | 0 |
| fuzz.test.js (Phase 2, unmodified) | 15 | 15 | 0 |
| cli.test.js (Phase 2, unmodified) | 10 | 10 | 0 |
| regression.test.js (D1–D8) | 9 | 9 | 0 |
| adversarial.test.js | 13 | 13 | 0 |
| metamorphic.test.js | 9 | 9 | 0 |
| gaps.test.js | 13 | 13 | 0 |
| integrity.test.js | 14 | 14 | 0 |
| security.test.js | 7 | 7 | 0 |
| demo.test.js | 3 | 3 | 0 |
| benchmark.test.js | 7 | 7 | 0 |
| **Total** | **128** | **128** | **0** |

Phase 1 and Phase 2 test files were not edited in Phase 3, and all 53 of their tests still pass (VERIFIED). Failures observed during development, all fixed in code, not by editing expectations: the six D1–D6 and D7/D8 regression tests failed first against the old engine (VERIFIED, 6/6 then 1/1 then 1/1); metamorphic M5 failed on seed 5009 and exposed D8; one `gaps` wording test failed ("confirm") and the engine text was reworded; one integrity test of mine compared against a hash the test itself declared (test bug, replaced by a stricter "no file opened" assertion); my own early M5 assertion was convoluted and was rewritten (documented here because it was a test change).

## Criteria
| ID | Criterion | Status | Evidence |
|---|---|---|---|
| P3-A1 | Derived copies, shared groups, bridges, shared artifacts never create extra independent origins | VERIFIED | regression D3–D6, adversarial A1–A5, metamorphic M3/M5/M8 |
| P3-A2 | Duplicates never hide contradictions or links to other claims | VERIFIED | regression D1–D2, adversarial A7 |
| P3-A3 | Results independent of id order, array order and JSON formatting | VERIFIED | metamorphic M1–M3, M9 (150 seeds each; seeded, not exhaustive) |
| P3-A4 | Self-assigned strength of derived evidence cannot inflate scores | VERIFIED | regression D7/D8, metamorphic M5 |
| P3-A5 | Declared provenance separated from verified facts; independence never "verified" | VERIFIED | `trust` block test, gaps tests, security T6 |
| P3-A6 | Findings are logical, recommendations heuristic, ranked 1..n, each with would-NOT-show; no fabricated identifiers | VERIFIED | gaps.test.js (100 + 100 random cases) |
| P3-A7 | Integrity: five distinct states; traversal/absolute/symlink/dir/FIFO rejected; limits give NOT_CHECKED; MISMATCH excluded from scoring; absolute dir never echoed | VERIFIED (Linux) | integrity.test.js |
| P3-A8 | Hard links are a limitation, not prevented | VERIFIED (documented, tested as limitation) | integrity.test.js |
| P3-A9 | Demo shows 4 items → 1 origin, plus MISMATCH/MISSING states | VERIFIED | demo.test.js, `npm run demo` |
| P3-A10 | Benchmark: hidden truth, disjoint dev/held-out, detectors blind to truth, metrics hand-checked | VERIFIED | benchmark.test.js |
| P3-A11 | `npm ci` works with the committed lockfile | VERIFIED locally (0 deps) | observed "found 0 vulnerabilities" |
| P3-A12 | CI passes on Node 20 and 22 | **NOT RUN (infrastructure: GitHub billing)** | see CI evidence below; no CI pass is claimed |
| P3-A13 | Works on Node 20 | NOT TESTED locally | CI only |
| P3-A14 | Works on Windows/macOS | NOT TESTED | — |
| P3-A15 | Detects undeclared copies | **FAILED (by design/limitation)** | benchmark: 100% FPR on undeclared slice for every detector |

## Benchmark (observed, `bench/results/phase3-run1.json`; full tables in `docs/BENCHMARK.md`)
Held-out, declared-provenance scenarios, 535 uncorroborated + 263 corroborated claims: ProofGap 0.2.0 FPR 0/535, recall 263/263; 0.1.0 FPR 71/535; B3_originals_only FPR 28/535 with recall 207/263; item-count FPR 423/535. Undeclared-copy scenarios (89 claims): every detector FPR 89/89. This is a synthetic, author-built benchmark; it is **not** evidence of real-world accuracy or superiority.
Scaling (one run, 1000 sources / 5000 evidence / 500 claims): ~251 ms wall, +32.7 MB heap, 137 MB RSS, 5.2 MB report.

## CI evidence
Observed on commit `356953f` (GitHub API): run 43509421759 (push) and run 43509432406 (pull_request), workflow `CI`, both `completed` with conclusion `failure`. Both matrix jobs (Node 20, Node 22) show **zero steps executed and no runner assigned**; the job annotation states: "The job was not started because recent account payments have failed or your spending limit needs to be increased." Therefore **no test ran in CI**: the result is NOT RUN, neither pass nor a test failure. Action required from the repository owner: resolve GitHub Actions billing/spending limit, then re-run the workflow and record the result here. Node 20 compatibility therefore remains **NOT TESTED**.
A follow-up commit pins `runs-on: ubuntu-24.04` (the log announces `ubuntu-latest` migrating to Ubuntu 26 on 2026-10-19) so future runs are reproducible; that run's outcome was not observed when this section was written.
