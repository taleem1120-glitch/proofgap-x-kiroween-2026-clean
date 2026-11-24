# CI status — 24 November 2026

## Current ProofGap Cite hardening PR

- PR [#43](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/43) is open and not merged.
- Candidate head after generated-artifact refresh: `ae07d6271247d987309bac8c064d3736564b090f`.
- CI run [45361606235](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45361606235) failed on the earlier PR head `8cb62dc4545c39f2cdefe7de228c512c2f8a8e8d`: 347/348 tests passed on Node 20 and Node 22; the remaining failure was the committed Cite showcase not matching a fresh deterministic build. Playwright responsive checks passed.
- Showcase regeneration run [45361598539](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45361598539) succeeded, ran all 348 tests successfully, and committed the regenerated `apps/proofgap-cite/showcase.html` to the PR branch as `ae07d6271247d987309bac8c064d3736564b090f`.
- The follow-on CI run [45361669015](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45361669015) was marked `action_required` with no jobs because the push was made by `github-actions[bot]`; it is not a passing validation.
- A fresh CI run on the generated-artifact commit is still required. Do not merge PR #43 until Node 20, Node 22, Playwright and the relevant browser/security checks pass on the exact same candidate tree.

## Previously validated recovery baseline

- PR [#39](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/39) fixed overlapping shared-passage alignment and merged into the recovery branch.
- PR [#40](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/40) adjusted the WebKit CI installation budget and merged into recovery.
- PR [#41](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/41) updated local validation documentation and merged into recovery.
- PR [#42](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/42) added bounded saved-text near-duplicate review and merged into recovery as `4db1a3de26df0e437331af6996e502ae148d596e`.
- Post-merge application CI [45360717650](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45360717650) passed on PR #42 merge commit: Node 20, Node 22 and responsive Playwright.
- Post-merge Cite showcase regeneration [45360717407](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45360717407) passed.
- Cross-browser/security run [45359854130](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45359854130) passed on PR #42 head: Chromium, Firefox, WebKit and dependency/security regression audit.

## Scope and interpretation

These results concern the recovery/hardening branches. They do not mean the candidate is deployed from `main`. The `main` branch remains unchanged; no promotion or deployment is claimed.

## Remaining release gates

- Fresh CI on PR #43's generated-artifact commit.
- Rebuild both showcases and verify byte-for-byte reproducibility on the exact candidate.
- Reproduce the synthetic benchmarks on the exact candidate and preserve run records.
- Independent security and accessibility review, or explicit disclosure that none has occurred.
- Validate public demo URLs, final public video, English submission material and Kiro usage disclosure.
- Keep synthetic benchmark results separate from real-world performance claims.
- Do not describe this prototype as forensic software, enterprise-ready, or commercially validated.
