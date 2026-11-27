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


## Exact candidate-head validation — 24 November 2026

Candidate head: b30c873fdda4cac66b46fa8103679e4541be6eec.

- [CI run 45466498604 (#790)](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45466498604) — **5/5 jobs successful**: Node 20, Node 22, responsive Playwright, clean-checkout full validation/showcase determinism, and Cite saved-text review. The saved-text job also ran the new templateHeldout cohort (seeds 900001–900150); see Phase 13 in docs/BENCHMARK.md.
- [PR CI run 45466511951 (#791)](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45466511951) — **success** on the same SHA.
- [Cross-browser/security run 45466511958 (#160)](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45466511958) — **4/4 jobs successful**: Chromium, Firefox, WebKit, and dependency/security regression audit.
- The exact-SHA run results above supersede earlier historical run references for this branch head. They are automated checks, not an independent security audit or human accessibility/privacy approval.

The shared-template result is deliberately not represented as a perfect detection result: all 54 truly corroborated claims in that scenario abstained as abstain_suspected_shared_origin. This is documented as a conservative recall limitation in docs/BENCHMARK.md.

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

## Latest exact-SHA validation — 2026-11-24

Validated release-branch head: `1da61539a07d661329b93f34f0165a900e880240`.

- [CI #833](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45470968204) — **SUCCESS**, all five jobs passed: Node 20, Node 22, responsive Playwright checks, clean-checkout validation/showcase determinism, and Cite saved-text review benchmark (including both `templateHeldout` and `shortTemplateHeldout` cohorts).
- [Cross-browser/security #190](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45470968328) — **SUCCESS**, all four jobs passed: Chromium, Firefox, WebKit, and dependency/security regression audit.
- The benchmark results and scenario-level outcomes are recorded in `docs/BENCHMARK.md`. The long-template case remains a conservative abstention; the short-template fixture is positively classified in 36/36 synthetic cases. These are author-generated synthetic results, not estimates of field accuracy.
- The earlier statement in this file that the documentation-only head had not received complete exact-SHA validation is historical and is superseded for this exact release-branch head by the two runs above. Do not generalize these passes to later commits.
- PR #44 remains Draft and unmerged; `main` is unchanged.

**Disposition:** automated checks pass for this exact SHA. Independent professional security review, human accessibility testing, privacy-owner/legal approval, supported-platform verification and representative user evaluation remain open. No production approval or independent certification is claimed.


## Showcase regeneration race — 2026-11-24 19:39 UTC

- CI #858 ran against `2570be0964b0ee4e17d96a991bc8a9b20a2fb0d5`, before the showcase regeneration workflow committed its output. Node 20 and Node 22 each failed the deterministic committed-showcase comparison; the full test suite reported 352 passing and 1 failing test. Responsive Playwright and the Cite saved-text benchmark passed.
- Clean-checkout validation independently checked out the same pre-regeneration SHA and reported the same single failing test. This is a sequencing/stale-artifact failure, not evidence of a Node-version-specific defect.
- Regeneration workflow #64 then completed successfully: it rebuilt `apps/proofgap-cite/showcase.html`, ran the full test suite and `git diff --check`, and committed the generated artifact as `c2c0adb6fdc3bf217fae0da267fb12d9fd86cfdb`.
- PR-triggered CI #859 and cross-browser/security #210 for that generated-artifact commit were returned as `action_required` before job execution. They are not passing results. A new push-triggered exact-SHA run is required to close this race.
- PR #44 remains Draft and unmerged. No change to `main` is authorized by this validation note.

## Final engineering review record — 2026-11-24

- Exact application candidate `2d792f834172c50cf06d1dc384ef85df2edaa7f8` passed CI #861 and Cross-browser/security #212 (see links above).
- Internal source-level review and residual-risk assessment are recorded in `docs/FINAL_ENGINEERING_REVIEW.md`; saved-text extraction and shared-passage risks are added as T18/T19 in `docs/THREAT_MODEL.md`.
- These are documentation-only commits after the validated application candidate. They do not change runtime code and do not supersede the exact-SHA application test results.
- No new workflow run was returned for the documentation-only threat-model commit `156efe65d9ee8554713a9bcc49f3184f6f6122fe`; do not claim that this documentation commit has a fresh CI result.
- Production disposition remains **NOT APPROVED**. Independent security review, human accessibility, privacy-owner/legal approval, supported-platform verification and representative-user evaluation remain open. PR #44 remains Draft and unmerged.

## Independent review preparation — 24 November 2026

The reproducible external-review packet is now documented:
- `docs/INDEPENDENT_REVIEW_PROTOCOL.md`: clean-checkout commands, adversarial test matrix, human accessibility and privacy/deployment review, finding format and exit criteria.
- `docs/REVIEW_EVIDENCE_INDEX.md`: exact application candidate, CI evidence, code map, known limitations and open sign-offs.
- `docs/FINAL_ENGINEERING_REVIEW.md`: internal review disposition.
- `docs/THREAT_MODEL.md`: threat model and residual risks, including T18/T19.

Authoritative tested application SHA remains `2d792f834172c50cf06d1dc384ef85df2edaa7f8`, with CI #861 and cross-browser/security #212 both successful. The subsequent commits in this review-preparation sequence change documentation only. No new CI result is claimed for the documentation-only head. Independent review and human/privacy/platform sign-offs remain open; PR #44 remains Draft and unmerged.


## Latest review-packet head validation — 2026-11-24 20:22 UTC

Validated branch head before this ledger update: `49fd3fb5c7ffcff1f8d21ea8a9cc3c2b27084007`.

- [CI #873](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45479380855) — **SUCCESS**. Node 20 and Node 22; full test and adversarial suites; ProofGap X and Cite smoke tests; synthetic held-out Cite cohorts; clean-checkout validation; showcase rebuild and byte-for-byte determinism; responsive Playwright.
- [Cross-browser/security #224](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/45479380796) — **SUCCESS**. Dependency/security regression audit plus Chromium, Firefox and WebKit responsive, keyboard, RTL and automated accessibility checks.
- The above runs are associated with the exact branch head `49fd3fb5c7ffcff1f8d21ea8a9cc3c2b27084007`. They supersede the earlier statement in this file that the documentation-only review-preparation head had no fresh CI result.
- This is still automated validation. It is not an independent security audit, human accessibility sign-off, privacy/legal approval, cross-platform certification or field-accuracy evidence.
- PR #44 remains Draft and unmerged. `main` is unchanged.

**Disposition:** the review-preparation branch head passed both automated workflows. Production approval remains **NOT APPROVED** until the independent and human acceptance gates above are closed. This ledger update itself is a documentation-only commit and must not be described as tested until its own exact-SHA workflows complete.
