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
