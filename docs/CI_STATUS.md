# CI status — 24 November 2026

## Current PR #43 candidate

- PR [#43](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/43) is open, ready for review, and not merged.
- Current documentation head: `f4edd90cc2d1db7d180b972e659f36df086b02f7`.
- The current head differs from the fully tested application candidate only in documentation files. The GitHub compare view confirms no application source, test, benchmark, workflow, or generated-showcase changes between `2cf2a048f3f713e61e8138c3a11e78505f2f69d8` and this head.
- Application CI run [45378656295](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45378656295) passed on the current head: Node 20, Node 22 and responsive Playwright.
- Application CI run [45378648876](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45378648876) also passed on the current head.
- Cite showcase regeneration [45378648907](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45378648907) passed on the current head.
- Reproducible validation gate [45378642152](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45378642152) passed on code-identical candidate `9927b61621ea4774402d50225388f44021877cad`; the later changes through current head were documentation-only. The earlier complete gate [45372767092](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45372767092) on `2cf2a048f3f713e61e8138c3a11e78505f2f69d8` recorded 348/348 tests; security 71/71; provenance 70/70; file integrity 29/29; viewer/planner 17/17; core/Cite 42/42; benchmark/demo 12/12. All three benchmark comparisons matched and both showcases rebuilt byte-for-byte identically.
- Cross-browser and security audit [45378642197](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45378642197) passed on code-identical candidate `9927b61621ea4774402d50225388f44021877cad`: Chromium, Firefox, WebKit and dependency/security regression audit.
- Validation artifact: [download from run 45372767092](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45372767092/artifacts/14909178249).

## Scope and interpretation

These results concern the audit branch and PR candidate. They do not mean the candidate is deployed from `main`. The PR remains unmerged; no promotion or deployment is claimed.

The local validation used Ubuntu 24.04, Node 22.23.5 and npm 10.9.9. The validation script explicitly marks as NOT TESTED: Windows, macOS, case-insensitive filesystems, real-world case data and screen-reader testing. Node 20 is covered by remote CI, not by the local validation runner. Automated cross-browser checks are not a human accessibility audit.

## Remaining release gates

- Independent blind evaluation by a reviewer who did not implement the product.
- Independent security and human accessibility reviews, or explicit disclosure that they remain unavailable.
- Buyer interviews, paid pilots or other verifiable customer intent for commercial validation.
- Verify public demo URLs, final public video, English submission material and factual Kiro usage disclosure.
- Decide package distribution/licensing and deployment/support model before any commercial distribution.
- Keep synthetic benchmark results separate from real-world performance claims.
- Do not describe this prototype as forensic software, enterprise-ready, certified, or commercially validated.
