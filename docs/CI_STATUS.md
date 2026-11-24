# CI status — 24 November 2026

## Current PR #43 candidate

- PR [#43](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/43) is open, ready for review, and not merged.
- Exact candidate head: `2cf2a048f3f713e61e8138c3a11e78505f2f69d8`.
- All 12 PR checks are passing on this candidate (as displayed by GitHub).
- Application CI run [45372767170](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45372767170): Node 20, Node 22 and responsive Playwright all passed.
- Re-run application CI [45372773781](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45372773781): Node 20, Node 22 and responsive Playwright all passed.
- Reproducible validation gate [45372767092](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45372767092): passed on this exact SHA. It reports 348/348 tests; security 71/71; provenance 70/70; file integrity 29/29; viewer/planner 17/17; core/Cite 42/42; benchmark/demo 12/12. All three committed benchmark comparisons matched, and both showcase files rebuilt byte-for-byte identically.
- Cross-browser and security audit [45372767218](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45372767218): dependency/security regression audit and Chromium, Firefox and WebKit compatibility all passed on this exact SHA.
- ProofGap Cite showcase regeneration [45372767066](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45372767066): passed.
- Validation artifact: [download from run 45372767092](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45372767092/artifacts/14909178249).

## Scope and interpretation

These results concern the audit branch and PR candidate. They do not mean the candidate is deployed from `main`. The PR remains unmerged; no promotion or deployment is claimed.

The local validation used Ubuntu 24.04, Node 22.23.5 and npm 10.9.9. The committed validation script explicitly marks as NOT TESTED: Windows, macOS, case-insensitive filesystems, real-world case data and screen-reader testing. Node 20 is covered by remote CI, not by the local validation runner. Automated cross-browser checks are not a human accessibility audit.

## Remaining release gates

- Independent blind evaluation by a reviewer who did not implement the product.
- Independent security and human accessibility reviews, or explicit disclosure that they remain unavailable.
- Buyer interviews, paid pilots or other verifiable customer intent for commercial validation.
- Verify public demo URLs, final public video, English submission material and factual Kiro usage disclosure.
- Decide package distribution/licensing and deployment/support model before any commercial distribution.
- Keep synthetic benchmark results separate from real-world performance claims.
- Do not describe this prototype as forensic software, enterprise-ready, certified, or commercially validated.
