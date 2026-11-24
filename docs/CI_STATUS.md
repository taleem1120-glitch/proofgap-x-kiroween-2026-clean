# CI and release status — 24 November 2026

## Validated audit candidate

- PR [#43](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/43) remains open against the recovery branch; it has not been merged or deployed.
- Current audit-branch head: `66c45c25065950cd4b85975e7ed11168e09970bd`. The application candidate validated by the full gate is `5bfecf075df332a034876ab99f0b89144d16fd79`; the later commit to the current head changes only this status document.
- Repository visibility: public; default branch: `main`. The audit candidate is not the default branch.
- Reproducible validation gate [45384579928](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45384579928): PASS on application candidate `5bfecf0`. It ran `npm ci --ignore-scripts`, `npm run validate:local`, 348/348 tests, three benchmark comparisons (all identical to committed references), the source/license/package-safety gate (all eight checks passed), and both showcase rebuilds with byte-identical comparisons.
- ProofGap Cite showcase regeneration [45384587078](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45384587078): PASS on current head `66c45c25065950cd4b85975e7ed11168e09970bd`.
- Application CI [45384586859](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45384586859): Node 20, Node 22 and responsive Playwright all PASS on current head.
- Follow-up application CI [45384592006](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45384592006): PASS on current head.
- Cross-browser/security audit [45384574947](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45384574947), on application-code-identical candidate `1e059333ab673d5155b7b332cfeb03cfc0b3e9ba`: Chromium PASS, Firefox PASS, dependency/security regression audit PASS; WebKit was still running at the time of this status update. Do not report the complete matrix as passed until WebKit completes.
- Validation artifact [14915781943](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45384579928/artifacts/14915781943) contains the full reproducibility/source-gate evidence.

## Scope and limitations

- Local validation ran on Ubuntu 24.04, Node 22.23.5 and npm 10.9.9. Node 20 is covered by remote CI.
- Windows, macOS, case-insensitive filesystems, real-world case data and screen-reader testing remain NOT TESTED.
- Automated browser tests do not constitute human accessibility testing.
- The synthetic benchmarks are author-created and do not establish real-world accuracy or legal admissibility.
- No independent blind evaluation, third-party security assessment, human accessibility audit, paid pilot or signed buyer intent has been obtained.
- Public GitHub Pages deployment is NOT VERIFIED from this candidate. The repository being public does not mean the audit branch is deployed.

## Release gates still open

1. Obtain independent blind evaluation and preserve the evaluator's unedited report.
2. Complete independent security review and human accessibility review.
3. Confirm public demo availability and byte identity for the deployed commit.
4. Confirm the public video is under three minutes and shows both applications.
5. Verify all official Kiroween 2026 submission requirements and submit through Devpost.
6. Decide package distribution. Root `package.json` is `private: true`; npm publishing remains deliberately disabled.
7. Define deployment, support, privacy and customer data-handling terms before commercial pilots.
8. Complete the WebKit run and document its final result.

Do not describe this candidate as certified forensic software, enterprise-ready, independently validated, or commercially proven. No merge to `main` or release deployment has occurred.
