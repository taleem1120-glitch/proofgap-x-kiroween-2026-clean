# Final engineering review — ProofGap X / ProofGap Cite

Date: 2026-11-24  
Review target: `release/proofgap-final-gate-2026-11-24`  
Verified candidate commit: `2d792f834172c50cf06d1dc384ef85df2edaa7f8`  
Pull request: [#44](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/44)

## Review disposition

**Automated engineering gate: PASS for the exact candidate above.**  
**Internal source review: PARTIAL; no independent security certification.**  
**Production acceptance: NOT APPROVED.**

This review is a repository-level engineering inspection by the implementation assistant. It is not a penetration test, external audit, legal opinion, privacy sign-off, or representative field evaluation.

## Exact-SHA automated evidence

- CI [#861](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45473036137): Node 20, Node 22, responsive Playwright, clean-checkout validation and byte-for-byte showcase rebuild all succeeded.
- Cross-browser/security [#212](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45473036100): Chromium, Firefox, WebKit and dependency/security regression audit all succeeded.
- The saved-text benchmark job completed its three synthetic cohorts. The GitHub job-details wrapper briefly reported an inconsistent `in_progress` status alongside completed steps and `success`; the run-level workflow conclusion is `success`. The workflow page's run-level result is authoritative for this CI gate.

## Source areas inspected

- ProofGap Cite Markdown parser and limits: `apps/proofgap-cite/src/parse.js`.
- Saved-text extraction and local file handling: `apps/proofgap-cite/src/text-evidence.js`.
- Shared-passage detector: `apps/proofgap-cite/src/shared-passage.js`.
- Cite verdict construction and report assembly: `apps/proofgap-cite/src/verdict.js`, `apps/proofgap-cite/src/index.js`.
- Core validation and bounded I/O: `src/validate.js`, `src/core.js`, `src/integrity.js`.
- Security regression coverage: `test/security.test.js`, `test/cite-text-review-adversarial.test.js`.
- Threat model and benchmark disclosures: `docs/THREAT_MODEL.md`, `docs/BENCHMARK.md`, `apps/proofgap-cite/README.md`.

## Findings and engineering interpretation

### 1. Local saved-text extraction is bounded and fail-closed

The inspected implementation limits the opt-in scan to 30 files, 256 KiB per file, 2 MiB total and five seconds; accepts only UTF-8 `.txt`, `.md`, `.csv` and `.json`; rejects traversal-like paths, symlinks, hard links and non-regular files; checks opened-file identity against the resolved path; and records missing, unsupported or unprocessed files rather than treating them as clean negatives.

**Residual risk:** path-component checks are not a formal descriptor-relative, race-free filesystem walk. The existing threat model already records this limitation for core file verification. Platform-specific behavior beyond Ubuntu CI is not established.

### 2. Shared-passage detection is a review cue, not source attribution

The detector normalizes text, uses bounded rolling-hash candidate indexing, then token-verifies candidate windows. It does not merge roots or prove copying. Incomplete scans remain explicit.

**Residual risk:** paraphrase, translation, OCR, substantial edits and other non-contiguous or semantic reuse can evade this exact-passage detector. A no-cue result cannot establish independence.

### 3. Synthetic benchmark results expose a material recall/abstention trade-off

Latest CI output (author-generated synthetic cohorts only):

- `textReviewHeldout`: saved-text mode TP 111, FP 0, TN 513, FN 54; precision 100.0%, recall 67.3%, FPR 0.0%.
- `templateHeldout`: saved-text mode TP 104, FP 0, TN 459, FN 110; precision 100.0%, recall 48.6%, FPR 0.0%. All 54 independent sources sharing a long template passage abstained as suspected shared origin.
- `shortTemplateHeldout`: saved-text mode TP 140, FP 0, TN 453, FN 92; precision 100.0%, recall 60.3%, FPR 0.0%. The separate 36/36 short-template fixture was positively classified; long shared-passage fixtures abstained.

These numbers are not estimates of field accuracy. The zero false-positive count applies only to these synthetic fixtures. Do not market 100% precision as a real-world guarantee or tune thresholds to erase the documented abstention behavior.

### 4. Provenance remains author-declared except for narrow local byte checks

The parser treats kind, URL, DOI and upstream citation declarations as untrusted author input. Local byte identity can be checked only when saved files are explicitly supplied and the local verification option is used. A matching SHA-256 establishes byte equality, not authenticity, truth, authorship, custody or source reliability.

**Residual risk:** omitted or fabricated lineage can remain unresolved or look independent. This is a fundamental input limitation, not a defect that can be solved from the note alone.

### 5. No source-level blocker established in this bounded inspection

The inspected code and tests support the stated prototype boundaries. This is not a claim that all vulnerabilities have been found or that the code is secure against a determined attacker. The full threat model retains explicit residual risks and must be reviewed by an independent party.

## Acceptance gates still OPEN

1. Independent professional security review with scope, tested commit SHA, findings, remediation and retest evidence.
2. Human accessibility testing with screen readers and keyboard-only use; automated axe/Playwright checks are not a substitute.
3. Privacy and deployment review covering hosting/CDN, endpoints, logs, backups, retention, deletion, legal basis and named owner approval.
4. Supported-platform verification before claiming Windows or macOS compatibility.
5. Representative analyst/editor usability evaluation, including false-confidence and abstention comprehension.
6. Final exact-SHA CI and cross-browser/security reruns after any code or workflow change.

## Release controls

- Keep PR #44 Draft and unmerged.
- Do not create a production tag or claim production readiness.
- Keep synthetic benchmark limitations visible in product and submission materials.
- Treat ProofGap as an evidence-lineage and confidence-stress aid, not forensic acquisition, evidence authenticity verification, chain-of-custody software, truth detection or a legal admissibility engine.
