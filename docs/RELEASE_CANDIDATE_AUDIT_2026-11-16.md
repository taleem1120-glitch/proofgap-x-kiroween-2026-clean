# ProofGap X — release candidate code review — 16 November 2026

Scope: PR #6, original engine, offline mobile authoring, reproducible browser core, workflows, sample reports and multilingual viewers. This is a technical review of repository code, CI and browser tests; **not** an independent legal, security or field accuracy certification.

## Identified defects and concrete mitigation
| Priority | Finding | Resolution |
|---|---|---|
| P0 | An analysis invoked while the browser module loads could finish *after* a user edited the case, and publish a now-stale report. | Fixed: form revision counter and snapshot, validation after async import, no publication if revision changed, duplicate launches disabled. Added slow module-loading Chromium regression. |
| P1 | Browser case authoring accepted certain unpaired surrogate code units that the canonical Node validator rejects. | Fixed: browser builder mirrors canonical Unicode check; regression includes invalid surrogate and valid Arabic/emoji. Rebuilt committed browser module and checked exact reproducibility. |
| P1 | Browser/core reproducibility workflow and mobile-browser smoke checks were restricted to a temporary feature branch, with overly narrow file-change filters. | Fixed: both cover `main` and pull requests, expanded filters include shared engine, offline viewers and authoring bundle. |
| P1 | Any runtime analysis of manually entered origins can appear to establish real source independence. | Mitigated in interface and report caveats. Still an inherent **product capability limit**: declared metadata is NOT independently verified. |
| P2 | Screens show many narrative statements in their source language even when the interface is localized. | Not solved; translated chrome / titles only. Human language QA and localized explanatory views remain necessary before marketing a fully localized suite. |
| P2 | Phone builder currently supports structured text input; not PDF/Word/phone forensic extraction, no case import/edit-after-refresh. | Not solved; useful future product work, but not a necessary Kiroween release change if presentation is truthful. |
| P2 | No blind external labeled corpus, vendor-matched baseline, independent accuracy confidence interval or third-party pentest. | No evidence to claim superiority or certification. Must be independently tested after competition prototype release. |

## Verified evidence — distinguish from sales claims
- Main Node20 and Node22 CI unit tests must PASS on **exact release commit**; prior tested full suite had 255 primary tests per runtime, plus 27+3 targeted checks. New async and Unicode changes require a fresh CI pass.
- Headless Chromium must verify: both apps at 360/411/1280px, 10 locale switches, RTL and export; phone authoring and original engine parity, invalid-cycle rejection and **stale async result nonpublication**.
- Reproducibility job must compare rebuilt `tools/browser-engine.bundle.js` byte-for-byte against the committed artifact.
- Temporary build workflow with write access must be deleted before releasing; only read-only testing workflows should remain.
- `main` public Pages deployment must be separately checked AFTER merge. Branch-only features must not be represented as published until verified.

## Final pre-publication readiness improvements (additional pass)
- Corrected judge-facing landing copy: phone case builder now **runs the same engine locally** rather than merely exporting input JSON, while clearly stating files are not authenticated. Normal JavaScript asset loading is not misleadingly described as zero network traffic; case data is not uploaded.
- Corrected judges quickstart to remove the obsolete 212-test figure, document the exact branch-local evidence, and warn that pre-merge features are not yet publicly deployed.
- Added `scripts/public-release-smoke.mjs` for a **post-deployment** exact-byte comparison of eight critical public HTML/JS assets versus the checked-out release commit. Added tests for missing or stale files and untrusted HTTP URLs. This does **not** mean the website has passed the test yet.
- Added `.github/workflows/public-release-gate.yml` as a **manual** read-only post-Pages release gate. Must run on `main` only after Pages reports the new exact SHA as deployed.
- Added `test/competition-release-copy.test.js` so inaccurate or obsolete landing/judges' claims fail the unit suite.
- The public Pages revision is *not verified* by the completion of branch-local CI or the presence of links. A current post-merge browser/device check remains required.

## Release recommendation
**Conditional go for a competition prototype**, not unconditional commercial release. Merge only after latest source, browser, and reproducibility gates succeed, visual checking on an actual Android device, and final human review of demo language and Kiro documentation. Retain the project's accurate research-prototype positioning. Do not use uncontrolled synthetic benchmark timing as a service-level guarantee.

## Highest return improvements beyond the contest
1. Formal lineage uncertainty: verify source ownership with external references rather than accepting user declarations as known truth.
2. Robust import/export workflows and user-friendly claim/source linking, preserving local confidentiality.
3. Task-matched blind adversarial dataset with independent annotators and false-positive/abstention metrics.
4. Full narrative localization, accessibility review and independent security assessment.
