# CI and release status — 24 November 2026

## Validated audit candidate

- PR [#43](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/43) is open against the recovery branch; it has not been merged or deployed.
- Validated candidate: `74d7559796c987e892819edfe34b4f432725249f` on `audit/arabic-and-bounded-review-coverage-2026-11-24`.
- Repository visibility: public; default branch: `main`. The audit candidate is not the default branch.
- Reproducible validation gate [45381011237](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45381011237): PASS. It ran `npm ci --ignore-scripts`, `npm run validate:local`, all 348 tests, and all committed benchmark comparisons. Three benchmark outputs matched their committed references. Both showcase outputs rebuilt to temporary paths and matched committed files byte-for-byte.
- ProofGap Cite showcase regeneration [45381011424](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45381011424): PASS.
- Application CI [45381011072](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45381011072): Node 20, Node 22 and responsive Playwright all PASS.
- Follow-up application CI [45381021664](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45381021664): Node 20, Node 22 and responsive Playwright all PASS.
- Cross-browser Chromium/Firefox/WebKit and dependency/security regression audit passed on code-identical application candidate `9927b61621ea4774402d50225388f44021877cad`. The compare from that candidate to `74d7559796c987e892819edfe34b4f432725249f` contains only documentation and one test-file addition; no application source, workflows, benchmark data or generated showcases changed. Therefore cross-browser evidence covers the same application source, but not the newly added test assertion itself.
- Validation artifact [14914671233](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45381011237/artifacts/14914671233) contains the reproducibility evidence for this candidate.

## Scope and limitations

- Local validation ran on Ubuntu 24.04, Node 22.23.5 and npm 10.9.9. Node 20 is covered by remote CI.
- Windows, macOS, case-insensitive filesystems, real-world case data and screen-reader testing remain NOT TESTED.
- Automated browser tests do not constitute human accessibility testing.
- The synthetic benchmarks are author-created and do not establish real-world accuracy or legal admissibility.
- No independent blind evaluation, third-party security assessment, human accessibility audit, paid pilot or signed buyer intent has been obtained.
- Public GitHub Pages deployment is NOT VERIFIED from this candidate. The repository being public does not mean the audit branch is deployed. A public URL must be checked against the exact deployed commit before it is offered as a working demo.

## Release gates still open

1. Obtain independent blind evaluation and preserve the evaluator's unedited report.
2. Complete independent security review and human accessibility review.
3. Confirm public demo availability and byte identity for the deployed commit.
4. Confirm the public video is under three minutes and shows both applications.
5. Verify all official Kiroween 2026 submission requirements and submit through Devpost.
6. Decide package distribution. Root `package.json` is `private: true`, so this package is intentionally not npm-publishable in its current state.
7. Define deployment, support, privacy and customer data-handling terms before commercial pilots.

Do not describe this candidate as certified forensic software, enterprise-ready, independently validated, or commercially proven. No merge to `main` or release deployment has occurred.
