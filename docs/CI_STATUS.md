# CI status — 24 November 2026

## Release candidate validation — 24 November 2026

The current Draft PR #44 candidate is `0c456334445cf96e12e6fa598d83d1ae2eecab69` on `release/proofgap-final-gate-2026-11-24`.

- [Candidate CI run 45416856842](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45416856842) completed successfully on the exact candidate SHA. Node 20 and Node 22 test jobs passed, responsive Chromium checks passed, the fresh Cite synthetic benchmark passed, and the clean-checkout validation plus both showcase rebuilds passed byte-for-byte determinism.
- [Candidate cross-browser/accessibility/security run 45416867898](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45416867898) completed successfully on the exact candidate SHA. Chromium, Firefox and WebKit responsive checks passed; automated axe-core WCAG 2.0/2.1 A/AA and structural checks reported **0 blockers and 0 advisory findings on each browser**; dependency audit and security regression tests passed.
- These are automated checks only. They do not establish independent security assurance, human screen-reader conformance, legal/privacy-owner approval, Windows/macOS support or real-world forensic accuracy.

PR #44 remains Draft, unmerged and based on the recovery branch. `main` is unchanged; no production tag or deployment was created.

## Current recovery-branch validation

The current recovery candidate is `recovery/proofgap-cite-integrate-2026-11-19`, updated through PR #40.

- **Application CI:** run [45345550936](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45345550936) completed successfully on recovery commit `78e2cb3ba24b04861ef6cab3262b2f3c913ea266`. Node 20, Node 22 and responsive Chromium checks passed.
- **Cross-browser and security audit:** run [45354084582](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45354084582) completed successfully on workflow-only commit `c756cbcaf0342f132840625a8bf4fca013b7ef0c`. Chromium, Firefox, WebKit and the dependency/security regression audit all passed.
- PR [#39](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/39) merged the shared-passage alignment regression fix into the recovery branch.
- PR [#40](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/40) merged the WebKit CI runtime adjustment into the recovery branch. It changes the workflow budget and install-step separation, not application logic or test assertions.
- Resulting recovery head after PR #40: `6804a15edc8bf0dee7d677f43a3c32e167502908`.

## Scope and interpretation

The cross-browser run passed after the browser-matrix job timeout was raised from 20 to 40 minutes and dependency installation was separated from browser binary installation. The previous run had been terminated during installation; that was a timeout, not a WebKit test assertion failure.

These are CI results for the recovery branch. They do **not** mean the candidate is deployed from `main`. The `main` branch remains unchanged, and no promotion or deployment is claimed here.

## Local validation

Run locally:

```sh
npm ci --ignore-scripts
npm test
npm run validate:local
npm run bench
```

`scripts/validate-local.js` records local test and benchmark results only. It does not query GitHub Actions and must report remote CI as **NOT_QUERIED**, not as a billing failure or a pass.

## Remaining release gates

- Re-run local validation and all benchmark reproductions on the exact release candidate and retain the generated `validation/<id>/` record.
- Rebuild both showcases and verify byte-for-byte determinism.
- Complete independent security and accessibility review, or explicitly disclose that no independent review has occurred.
- Verify the public demo URLs and final public video before competition submission.
- Keep synthetic benchmark findings clearly distinguished from real-world performance.
