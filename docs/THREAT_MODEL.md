# ProofGap X — Threat Model (Phase 3)

Status: written by the implementing engineer, **not independently reviewed**. Prototype; not forensic software.

## Assets
- A1 Integrity of conclusions: a report must not overstate corroboration or verification.
- A2 Confidentiality of case data and of files outside the evidence directory.
- A3 Availability of the analyst's machine (no hangs, no memory blow-ups).
- A4 Integrity of the analyst's existing files (no overwrites).

## Actors and trust
- **Case author / case file: UNTRUSTED** (may be adversarial, may be mistaken).
- **Evidence directory contents: UNTRUSTED** (files, symlinks, names).
- **Analyst running the CLI: TRUSTED**, runs locally, chooses `--evidence-dir` and `--out`.
- No network peers exist; the tool has no network code.

## Trust boundaries
case JSON → `validate.js` (size, forbidden keys, schema, semantics) → `analyze.js`;
evidence directory → `integrity.js` (path checks, symlink refusal, limits) → `analyze.js`;
report → JSON (escaped) / text (sanitised) → file or stdout.

## Threats, mitigations, tests, residual risk

| ID | Threat | Mitigation | Regression tests | Residual risk |
|---|---|---|---|---|
| T1 | Data exfiltration / remote code | No network, spawn, eval, `process.env` in `src/`; zero runtime dependencies | `security.test.js` T1 (static grep) | Grep is not proof; Node itself, OS and npm tooling are trusted. |
| T2 | Injection via free text in reports (HTML/JS/terminal) | JSON output escapes `< > & U+2028/9`; text renderer replaces control/bidi chars; validation rejects controls, bidi, lone surrogates | `security.test.js` T2, `gaps.test.js` rendering tests | Other consumers (HTML, CSV, spreadsheets) need their own encoding. NOT TESTED in any consumer. |
| T3 | Prototype pollution / key confusion | `__proto__`, `constructor`, `prototype` keys rejected at any depth; ids treated as plain Map keys | `fuzz.test.js`, `security.test.js` T3 | None known. |
| T4 | Resource exhaustion via large input | 1 MB input cap; item/string/links caps; issue-list cap; bounded read from fd | `fuzz.test.js` limits, `security.test.js` T4 | No wall-clock limit in the library; bounded by caps only. |
| T5 | Algorithmic blow-up (deep/wide derivation DAG) | Depth limit 50; memoised traversals; union-find | `fuzz.test.js` depth/diamond, `security.test.js` T5 | Large-but-legal inputs take ~0.3 s at max limits on the dev machine; not hardened for far weaker devices. |
| T6 | Fake "verified" status | Status derives only from `integrity.js` results; `integrity` is rejected as an input property; unverified hashes labelled `verified:false` | `security.test.js` T6, `integrity.test.js` | A hash match proves byte equality only. |
| T7 | Report tampering / irreproducibility | Canonical, timestamp-free output; `inputSha256` | `metamorphic.test.js` M2, M9; `security.test.js` T7 | Reports are not signed; anyone can edit a report file. |
| T8 | Path traversal / symlink escape when verifying files | Explicit directory only; relative-path allow-list (`[A-Za-z0-9_.-]` segments, no `.`/`..`/empty/backslash/absolute, ≤8 deep, ≤255 chars); `lstat` walk refusing symlinks; regular files only; `O_NOFOLLOW`+`O_NONBLOCK`; post-open `realpath` containment check; evidence-dir path never echoed | `integrity.test.js` (traversal, absolute, symlink file/dir/dangling/intermediate, directory, FIFO, escape) | **Hard links** inside the directory are regular files and WILL be hashed (tested, documented). A TOCTOU swap of an intermediate directory between lstat and open is narrowed by the realpath check but not eliminated. Case-insensitive/Unicode-normalising filesystems NOT TESTED. Windows NOT TESTED. |
| T9 | Resource exhaustion during hashing | Limits: 200 files, 50 MB/file, 256 MB total, 30 s; each file read once; chunked reads; NOT_CHECKED (never VERIFIED) when a limit is hit | `integrity.test.js` limits tests | Time limit uses wall clock, so results near the limit can vary between runs. |
| T10 | Output overwrite / symlink clobber | `wx` open (fails on existing files and symlinks), mode 0600, report built before file creation | `cli.test.js` | Race between check and create is handled by `O_EXCL`; not stress-tested. |
| T11 | **Score manipulation by the case author** | Origins are merged by shared roots, groups, artifacts; derived copies can't raise strength; duplicates merge; contradictions are never dropped | `regression.test.js` D1–D8, `adversarial.test.js`, `metamorphic.test.js` | **UNMITIGATED by design:** an author can omit `derivedFrom` or invent independent-looking sources. The tool sees only declared provenance. Heuristic warnings (same name / identical description) are weak signals and are not scored. Many declared-independent origins can accumulate score. |
| T12 | Misleading explanations | Findings (logical) vs recommendations (heuristic) are labelled; every recommendation states what it would NOT show; no fabricated ids (tested) | `gaps.test.js` | Wording may still be over-read by users; no usability study done. |

## Out of scope (not defended)
Compromised host/Node runtime/npm registry; malicious analyst; side channels; multi-tenant use; signing or chain of custody; authenticity of evidence content.

## Phase 5 additions
| ID | Threat | Mitigation | Tests | Residual risk |
|---|---|---|---|---|
| T13 | Script injection / exfiltration via the HTML viewer | Self-contained page; CSP `default-src 'none'`, script/style only by SHA-256 hash, `connect-src`/`img-src`/`form-action` none; reports embedded as JSON data blocks with `< > &` escaped (re-checked by `renderHtml`); all DOM via `textContent`; no HTML-string APIs, eval, storage or network APIs | `viewer.test.js`; Playwright session: 6 payloads, `window.__pwned` unset, 0 dialogs, 1 request (the file itself) | Only headless Chromium tested. User-loaded files are parsed with `JSON.parse` and rendered by the same code. A malicious *viewer file* (not a report) is out of scope. |
| T14 | Corroboration denial: adding a derivative that "bridges" genuine origins to make a supported claim look unsupported | Independence = maximum set of pairwise-disjoint root sets (monotone: adding evidence never lowers it); per-claim locality | `regression.test.js` D9, D10; metamorphic M10; benchmark `denial_bridge` | An author can still declare false shared origins (`originGroup`, equal hashes) to merge genuine origins. |
| T15 | Laundering via shared artifacts and derived copies | Holders of the same artifact share all roots (fixpoint) inherited by derivatives; derived-only strength = min, capped by non-derived; shared artifacts across lineages → suspected → abstain | D11, D12, M5 | Abstention depends on cues; undeclared dependence without cues is undetectable. |
