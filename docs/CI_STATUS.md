# CI status — 24 November 2026

## Release candidate validation

**Last application-code candidate validated:** `d09ac993aeb232b79726eb482af077bdcd19a358`  
**Branch:** `release/proofgap-final-gate-2026-11-24`  
**PR:** [#44 — Release gate](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/44)

- [CI run 45417571033](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45417571033) passed on application candidate `d09ac993aeb232b79726eb482af077bdcd19a358`: Node 20 and Node 22 tests, responsive Chromium checks, fresh ProofGap Cite synthetic benchmark, clean-checkout validation, and byte-for-byte deterministic rebuilds of both showcases.
- [Cross-browser/accessibility/security run 45417571196](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45417571196) passed on the same application candidate: Chromium, Firefox and WebKit responsive checks; automated axe-core WCAG 2.0/2.1 A/AA and structural checks; dependency audit and security regression checks. Each of the three browser scans reported **0 blockers and 0 advisory findings**.
- These are automated checks only. They do not establish an independent security audit, human screen-reader conformance, legal/privacy-owner approval, Windows/macOS support, or real-world forensic accuracy.

## Latest documentation-head CI validation (24 November 2026)

The documentation and review-packet head `717bfe370f4a4221dfe6c2983295bbee826ad598` passed both workflows:

- [CI run 45460984419 (#776)](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45460984419): Node 20, Node 22, responsive Playwright checks, clean-checkout validation/showcase determinism, and the fresh synthetic Cite saved-text review benchmark — **all 5 jobs successful**.
- [Cross-browser/security run 45460984626 (#149)](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45460984626): Chromium, Firefox, WebKit, and dependency/security regression audit — **all 4 jobs successful**.

These runs validate the exact documentation-head SHA above, including the unchanged application candidate. They do not replace or extend the scope of the independent security, human accessibility, privacy-owner, or real-world evaluation gates. Any later commit must be checked separately; the current documentation update itself is a follow-on documentation-only change.

## Documentation-only changes after the validated code candidate

The following commits add review/outreach and competition-submission documentation; they do not change application runtime code or generated showcase files:

- `4a2bc4c224d8eacb7e48bdc492f58952f630aa65` — external review outreach pack.
- `75044d18c473153c931c7db237578f032ef420d3` — Kiroween submission refresh pack.
- `4f43371e7b94fda34c3d1a45acdd8ffe2820f7f8` — field-by-field Devpost refresh pack.

The documentation-only branch head has not itself been rerun through the complete CI matrix. Any future application-code change requires fresh exact-SHA validation. Do not cite the application-candidate runs as if they ran on a later documentation head.

## Branch and release state

- PR #44 remains **Draft**, unmerged, and based on `recovery/proofgap-cite-integrate-2026-11-19`.
- `main` remains unchanged.
- No production tag, production approval, or deployment of the Draft PR candidate is claimed.
- The public GitHub Pages demo is a separate deployment and must not be assumed to serve the Draft PR branch.

## Current recovery-branch validation

- [Application CI run 45345550936](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45345550936) passed on recovery commit `78e2cb3ba24b04861ef6cab3262b2f3c913ea266` (Node 20, Node 22 and responsive Chromium).
- [Cross-browser/security run 45354084582](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45354084582) passed on workflow-only commit `c756cbcaf0342f132840625a8bf4fca013b7ef0c` (Chromium, Firefox, WebKit and dependency/security regression audit).
- PR [#39](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/39) merged the shared-passage alignment regression fix into recovery.
- PR [#40](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/40) merged the WebKit CI runtime adjustment into recovery. It changes workflow runtime budgets and install-step separation, not application logic or test assertions.
- Recovery head after PR #40: `6804a15edc8bf0dee7d677f43a3c32e167502908`.

## Interpretation

The browser matrix passed after increasing the browser job timeout from 20 to 40 minutes and separating dependency installation from browser binary installation. A prior termination during installation was a timeout, not a WebKit assertion failure.

These recovery-branch runs are historical evidence. They do not mean the candidate is deployed from `main`.

## Local validation commands

Run from a clean checkout of the exact candidate:

```sh
node --version
npm ci --ignore-scripts
npm test
npm run validate:local
npm run bench
npm run cite
```

The local validator records local tests and benchmark reproductions only. It does not query GitHub Actions and must report remote CI as `NOT_QUERIED`, not as a billing failure or a pass.

## Remaining release and evaluation gates

1. Independent professional security review with findings, scope, exact SHA and retest evidence — **OPEN**.
2. Human accessibility testing with screen readers and keyboard-only workflows — **OPEN**. Automated axe scans are not human testing.
3. Deployment-specific privacy review (hosting/CDN, endpoints, logs, backups, retention, deletion, legal basis and responsible owner sign-off) — **OPEN**.
4. Supported-platform verification for any claimed Windows/macOS compatibility — **NOT ESTABLISHED**.
5. Representative analyst/writer usability evaluation — **OPEN**.
6. Keep synthetic benchmark results and their false positives/false negatives visible; they are not real-world accuracy evidence.

**Disposition:** the automated engineering candidate has substantial passing evidence, but ProofGap remains a research prototype and is not approved for production or independently certified. Keep PR #44 Draft until external review, human testing, privacy approval, remediation and exact-SHA retests are complete.

## Next engineering experiment: independent sources with shared boilerplate

A fresh held-out cohort is being added at seeds 900001–900150. It contains independent primary sources that share a short public boilerplate passage but have distinct substantive content. The purpose is to test the opposite failure mode from repost detection: false merging of genuinely independent sources. This is a synthetic stress test, not external validation. Its measured false-positive and false-negative results must be recorded before any threshold or product claim changes.
