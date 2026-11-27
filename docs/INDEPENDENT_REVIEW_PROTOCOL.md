# Independent review protocol — ProofGap X / ProofGap Cite

Date: 2026-11-24  
Repository: taleem1120-glitch/proofgap-x-kiroween-2026-clean  
Review branch: release/proofgap-final-gate-2026-11-24  
Application candidate to review: 2d792f834172c50cf06d1dc384ef85df2edaa7f8  
Pull request: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/44

## 1. Purpose and independence

This document is an execution protocol for an independent reviewer, not an audit result. The reviewer must work from a clean checkout, independently select and document tools, record the exact commit tested, and report all findings—including false positives, false negatives, abstentions, failed tests and untested areas. The implementing team must not author the reviewer's conclusions or describe this protocol as certification.

## 2. Scope

Review the local/offline evidence-lineage analysis core and ProofGap Cite, including input parsing and validation; provenance declarations and independence calculations; local evidence hashing and saved-text extraction; path containment and resource limits; Markdown parsing and citation graphs; shared-passage and near-duplicate heuristics; JSON, text and HTML report generation and viewer CSP; deterministic output and CLI behavior; dependencies and release workflow integrity.

Out of scope unless separately commissioned: compromised operating system/runtime, malicious analyst with local account control, legal admissibility, truth of source content, forensic acquisition, device extraction, chain-of-custody certification and field accuracy.

## 3. Reproducible baseline

Use a clean clone and checkout the exact application candidate SHA above. Do not test a moving branch name alone.

~~~sh
git clone https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean.git
cd proofgap-x-kiroween-2026-clean
git checkout 2d792f834172c50cf06d1dc384ef85df2edaa7f8
node --version
npm --version
npm ci
npm test
npm run validate:local
npm run showcase
npm run showcase:cite
~~~

Record OS, architecture, Node/npm versions, command, exit code, elapsed time, stdout/stderr and exact SHA. Run showcase generation in a disposable working tree and inspect its diff. Do not overwrite user data.

Benchmark instructions and fixed cohorts are documented in docs/BENCHMARK.md. Run cohorts separately as documented. Do not tune against held-out cohorts and then describe those cohorts as untouched validation.

## 4. Required adversarial test matrix

For every case, record setup, input, expected property, actual result, evidence/log reference, severity and reproducibility.

### A. Input and parser hardening
- Oversized JSON/Markdown, excessive line count, claims, references, citations and nesting.
- Duplicate and forbidden identifiers/keys, malformed attributes, undefined references, invalid URL schemes and malformed DOI values.
- Fenced-code injection attempts, control characters, bidi controls, lone surrogates and hostile Unicode normalization.
- Deep/cyclic derivation graphs, duplicate evidence links and contradictory links.

### B. Filesystem boundary and race tests
- Absolute paths, traversal, empty/dot segments, backslashes, excessive depth and disallowed characters.
- Symlink files/directories, dangling links, FIFOs, sockets, devices and directories.
- Hard links inside and outside the selected evidence directory.
- Replace/rename path components between validation and open; mutate files while reading; change link counts during reads.
- Files growing after initial stat, exceeding per-file/total limits or the time budget.
- Invalid UTF-8, empty files, duplicate file references and unsupported extensions.
- Confirm no read escapes the selected directory and no input/output file is modified.

### C. Provenance and classification attacks
- Fabricated independent-looking sources; omitted derivedFrom; false originGroup; false or duplicate hashes.
- Reposts with byte-identical, re-encoded, edited, paraphrased and translated content.
- Shared generic boilerplate among genuinely independent sources.
- Common public artifacts and syndicated content; multiple references to one underlying origin.
- Add derivative evidence to test monotonicity and bridge/denial cases.
- Confirm unknown lineage remains unknown and abstention is never silently converted into a positive verdict.

### D. Cite-specific text review
- Long exact passages, short boilerplate, near-duplicates and punctuation/case/Unicode re-encoding.
- Paraphrase, translation, OCR-like corruption and non-contiguous reuse.
- Missing, unreadable, unsupported and partially scanned saved files.
- Candidate-pair comparison budget exhaustion; confirm incomplete status is surfaced.
- Confirm heuristic output is never described as proof of copying, authorship or common origin.

### E. Report/viewer and CLI security
- HTML/JSON/text injection in every free-text field, including closing script tags, SVG handlers, terminal escapes and bidi controls.
- CSP enforcement; attempted network, image, form, storage and script execution.
- Output path already exists, is a symlink, or races with another process.
- Deterministic report bytes and correct failure exit codes without sensitive path or stack-trace leakage.

### F. Dependency and supply-chain review
- Review lockfile, direct/transitive dependency tree, lifecycle scripts, provenance and known advisories.
- Verify clean install reproducibility and absence of unexpected network/runtime capabilities.
- Review GitHub Actions permissions, pinned action versions, token scopes, artifact handling and workflow triggers.
- Automated dependency audit is one signal, not a substitute for manual review.

## 5. Human usability and accessibility

Test keyboard-only navigation, visible focus, zoom/reflow, contrast, screen readers, semantic headings, labels, error announcements and report comprehension with representative researchers/editors.

Ask users to explain: what independent-origin count means; what a hash match establishes and does not establish; why a claim was abstained from; why no detected shared passage does not prove independence; and which statements remain author-declared.

Record task completion, errors, misinterpretations and false-confidence incidents. Automated axe/Playwright results are supplementary only.

## 6. Privacy and deployment review

Before hosted or organizational deployment, identify and verify data flows, whether case content leaves the local machine, hosting/CDN/analytics/telemetry/logging, access controls, encryption, retention, deletion, backups, incident response, legal basis, controller/processor roles, cross-border transfers, privacy notice, consent and named owner approval.

Do not assume a local/offline design proves every distribution or hosted wrapper is offline. Inspect the actual deployment artifact and environment.

## 7. Finding format and severity

Each finding must include unique ID and severity (Critical / High / Medium / Low / Informational); affected commit SHA, file/function and environment; preconditions and exact reproduction; observed versus expected behavior; impact and exploitability; sanitized evidence; recommended remediation; and retest status with retested SHA.

Separate confirmed vulnerabilities from hardening suggestions, product limitations and usability issues. Do not downgrade reproducible issues because the project is a prototype.

## 8. Exit criteria

Independent acceptance requires: no unresolved Critical or High findings; documented disposition and owner approval for Medium findings; all required areas tested or explicitly accepted as residual risk; fixes retested on the exact final SHA; human accessibility and privacy/deployment sign-offs; and a final report that does not claim forensic certification or real-world accuracy.

The release owner—not the implementing reviewer—makes the release decision.

## 9. Current status

Not yet independently reviewed. No auditor has been appointed or engaged by this document. Human accessibility, privacy/deployment, platform support and representative-user gates remain open. PR #44 must remain Draft until those gates and the release owner's decision are complete.
