# ProofGap X — Evidence-Based Engineering Audit
**Date:** 2026-11-24  
**Scope:** Read-only audit of the current `main` source, tests, benchmark report and GitHub Actions history.  
**Branch:** `commercial/readiness-gate-2026-11-23`  
**Status:** Findings register; no scoring-policy or runtime-code change is made by this audit.

## 1. Verified baseline

- `main` head inspected: `20538d1b3a265d0d82ee8564f6c8217860342e45`.
- CI run 577 completed successfully on that exact head.
- GitHub Pages deployment run 32 completed successfully on that exact head.
- The commercial-readiness branch is one commit ahead of main and has no divergence from main at audit time.
- The product README explicitly describes ProofGap X as a prototype, not forensic software, not independently reviewed, and not enterprise-ready. This boundary must remain visible in sales materials.

## 2. Release-blocking evidence gaps

### P0 — Re-encoded repost false corroboration in ProofGap Cite
The committed Phase 11 held-out synthetic benchmark reports 66 false positives, all in scenario `reencoded_repost`. Saved-file byte hashing does not detect these because the copies differ by a suffix; URL and declared provenance also differ. The current benchmark therefore demonstrates a material blind spot, not general accuracy.

**Required work:** design an adversarial, multilingual partial-copy benchmark with independently specified transformations (suffix/prefix, whitespace, punctuation, encoding, OCR-like substitutions, paragraph reorder, translation boundary cases). Separate exact-byte, lexical resemblance, shared-passage and metadata signals. Never treat similarity as proof of common origin. Any mitigation must remain review-only/abstention until independently evaluated.

### P0 — Undeclared provenance is not inferable from case metadata
The product documentation correctly states that structurally indistinguishable independent and copied sources cannot be separated from declared case metadata alone. This is a fundamental information limit. Sales claims must not imply hidden-source discovery or verification of origin.

**Required work:** preserve explicit `unknown/unresolved` outcomes and show the analyst which missing provenance fact prevents a conclusion.

### P1 — Arabic normalization is not yet a validated robustness feature
The existing text-copy tests confirm Arabic tokenization and deliberately retain combining marks as distinct tokens. This is not evidence that diacritic variants, tatweel, hamza forms, OCR errors, or Arabic morphology are handled robustly.

**Required work:** create a separately labeled Arabic adversarial test corpus, with human-reviewed positive/negative pairs. Report recall and false-positive rate by transformation. Do not silently strip marks or merge variants without testing semantic false matches.

### P1 — External validity and independent review remain absent
The committed benchmark is synthetic and authored by the project. The threat model says it has not been independently reviewed. Automated CI and browser checks are useful engineering evidence, but do not establish real-world accuracy, forensic admissibility, or production readiness.

**Required work:** obtain an independently labeled, permissioned evaluation set and third-party security review before making enterprise-grade or forensic-validity claims.

## 3. Required technical acceptance evidence

| Area | Evidence required before release |
|---|---|
| Core correctness | Full tests on supported Node versions; boundary and invalid-input tests |
| Independence | Per-scenario confusion matrix, including bridges, declared copies, hidden copies and genuinely independent sources |
| Copy cues | Separate exact-byte, near-copy, shared-passage and Arabic transformation results |
| Abstention | Coverage, selective risk, and reasons for abstention; do not hide unknown labels |
| Reproducibility | Same commit + same environment yields identical accuracy fields and deterministic reports |
| Security | Dependency audit, adversarial input tests, browser CSP/escaping tests, independent review |
| Performance | Runtime and memory across small, median and maximum supported cases |
| Commercial handoff | Threat model, data-flow diagram, limitations, reproducible demo, license/IP inventory and deployment boundary |

## 4. Go / no-go decision

**Decision: NO-GO for claims of enterprise-ready forensic software or an unqualified commercial production release.**

**Permitted positioning:** prototype / analyst decision-support and evidence-independence review aid, with explicit uncertainty, local-only processing boundary, synthetic benchmark caveats and human oversight.

A limited evaluation or paid pilot may be considered only with written scope, synthetic or permissioned data, no legal/forensic admissibility promise, and a documented human review process.

## 5. Change control

This audit adds no runtime dependencies and changes no engine policy. Any future change to classification, scoring, thresholds, Unicode normalization or abstention must:
1. be isolated on a non-main branch;
2. include regression and adversarial tests;
3. be evaluated against a frozen held-out set not used for tuning;
4. report false positives and false negatives by scenario;
5. pass the repository CI and security gates;
6. be reviewed before merge.

**Important:** A successful CI run validates the code and tests at that commit; it does not erase the benchmark limitations listed above.
