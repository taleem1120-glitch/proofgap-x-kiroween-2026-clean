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
| T4 | Resource exhaustion via large input | 1 MB input cap; item/string/links caps; issue-list cap; `readInputFile` validates a positive safe byte limit (≤64 MiB) before opening, reads fixed 64 KiB chunks and observes at most `maxBytes + 1`; output writer checks UTF-8 byte length before exclusive creation | `fuzz.test.js` limits, `security.test.js` T4, `core.test.js` bounded I/O tests | No wall-clock limit in the general input reader; it is byte-bounded. Windows and macOS behavior are not established by the Ubuntu CI matrix. |
| T5 | Algorithmic blow-up (deep/wide derivation DAG) | Depth limit 50; memoised traversals; union-find | `fuzz.test.js` depth/diamond, `security.test.js` T5 | Large-but-legal inputs take ~0.3 s at max limits on the dev machine; not hardened for far weaker devices. |
| T6 | Fake "verified" status | Status derives only from `integrity.js` results; `integrity` is rejected as an input property; unverified hashes labelled `verified:false` | `security.test.js` T6, `integrity.test.js` | A hash match proves byte equality only. |
| T7 | Report tampering / irreproducibility | Canonical, timestamp-free output; `inputSha256` | `metamorphic.test.js` M2, M9; `security.test.js` T7 | Reports are not signed; anyone can edit a report file. |
| T8 | Path traversal / symlink / hard-link escape when verifying files | Explicit directory only; relative-path allow-list (`[A-Za-z0-9_.-]` segments, no `.`/`..`/empty/backslash/absolute, ≤8 deep, ≤255 chars); `lstat` walk refusing symlinks; regular files only; `O_NOFOLLOW`+`O_NONBLOCK`; post-open `realpath` containment check plus `stat(realpath)` vs `fstat(fd)` device/inode identity match; reject files with `nlink > 1` before hashing and re-check after reading; evidence-dir path never echoed | `integrity.test.js` (traversal, absolute, symlink file/dir/dangling/intermediate, directory, FIFO, escape, hard links); `observed.test.js` | Hard links are conservatively rejected, including links whose names are both inside the evidence directory. Intermediate-component swaps are checked by comparing the opened descriptor's device/inode with the resolved path's device/inode; this narrows the lstat/open race but is not a descriptor-relative `openat` walk and is not a formal race-free guarantee. A hard link created and removed entirely between link-count checks remains a filesystem race. Case-insensitive/Unicode-normalising filesystems NOT TESTED. Windows NOT TESTED. |
| T9 | Resource exhaustion during hashing | Limits: 200 files, 50 MB/file, 256 MB total, 30 s; each file read once; chunked reads; NOT_CHECKED (never VERIFIED) when a limit is hit | `integrity.test.js` limits tests | Time limit uses wall clock, so results near the limit can vary between runs. |
| T10 | Output overwrite / symlink clobber | `writeNewFile` validates path/text/positive safe byte limit (≤64 MiB), measures UTF-8 bytes, then uses exclusive `wx` creation and mode 0600; `wx` refuses existing files and symlinks | `cli.test.js`, `core.test.js` (existing output and symlink target unchanged) | Exclusive creation prevents replacement at creation time; concurrent stress testing and non-POSIX permission semantics are not established. |
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

## Phase 6 addition
| ID | Threat | Mitigation | Tests | Residual risk |
|---|---|---|---|---|
| T16 | Hiding a copy by omitting or faking its hash; fabricating a link | Under `--evidence-dir` every safely readable non-empty regular file is hashed by the tool. Identical observed bytes are one artifact whatever the declaration says. A fake distinct hash on a copy gives MISMATCH and exclusion; the same declared hash on different bytes gives MISMATCH and no merge. Symlinks, hard links, missing or limit-skipped files, and empty files never create links. Observed hashes never set status VERIFIED | `observed.test.js`, `integrity.test.js` | Re-encoded or edited copies are not detected. Byte-identical common files from genuinely independent sources (templates, public documents) are over-merged, lowering recall. Hard-linked files are rejected conservatively, even when all names are inside the evidence directory |

## Phase 11 addition: ProofGap Cite inputs
| ID | Threat | Mitigation | Tests | Residual risk |
|---|---|---|---|---|
| T17 | A hostile Markdown note (oversize, control or bidi characters, prototype keys, injected claims in code blocks, malformed attributes, `javascript:` URLs, saved paths escaping the folder, very deep citation chains) | Byte, line, claim, reference and citation limits; ids restricted; `__proto__`-style ids rejected; fenced code ignored; attribute allow-list; http(s)-only URLs, **never fetched**; saved files only through the core's verified, symlink-free, contained path checks; lineage depth passes core limits and is reported as a note issue; HTML via the escaped JSON block and CSP; lint output neutralises control characters | `cite.test.js`, `security.test.js` T1b | A note author can still declare false lineage or kinds. Cite verdicts are only as good as the declarations, except for byte identity |


## Phase 12 addition: shared core file I/O hardening

The shared core's public file helpers are now explicitly bounded. `readInputFile` rejects invalid limits before opening a path, opens without following a final-component symlink where the platform supports `O_NOFOLLOW`, requires a regular file, reads in fixed 64 KiB chunks, and stops after observing at most one byte beyond the caller's limit. `writeNewFile` checks the UTF-8 byte count before creating a new file with exclusive-create semantics (`wx`) and requests owner-only mode (`0600`).

Regression coverage includes multi-chunk UTF-8 input, exact and exceeded byte boundaries, empty input, invalid limits before filesystem access, invalid writer arguments, UTF-8 output byte accounting, no-overwrite behavior, and refusal to replace a symlink target.

**Platform scope:** the active CI matrix runs Node 20 and Node 22 on Ubuntu 24.04. The POSIX-specific symlink/FIFO tests are skipped on Windows where applicable; this project does not claim Windows or macOS compatibility based on this CI. Mode `0600`, `O_NOFOLLOW`, `O_NONBLOCK`, device/inode identity and filesystem race behavior must be evaluated on each supported platform before making cross-platform security claims.


## Phase 13 addition: near-duplicate text review cues

In ProofGap Cite, long reference labels are compared using NFKC/case/punctuation/whitespace folding and character-shingle Jaccard similarity. The scan is bounded to 25,000 candidate comparisons and 100 emitted pairs per case. A high-similarity pair across disjoint declared roots emits a heuristic warning and may cause the existing decision layer to abstain; it never merges artifacts, roots, or scores.

**Residual risk:** similarity is not proof of copying or common authorship. The cue can miss paraphrases, translations, OCR/re-encoding changes, short text, and pairs beyond the deterministic comparison budget. It can also flag independently written text using standard language. Review the original sources and publication history; do not treat the cue as an attribution finding. Tests cover a controlled near-duplicate, unrelated text, bounded execution, and the invariant that origin counts and scores do not change.
