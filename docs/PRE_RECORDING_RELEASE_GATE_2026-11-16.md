# ProofGap X — pre-recording release gate (16 Nov 2026)

**Status: CONDITIONAL / NOT PUBLISHED.** This gate records evidence gathered on the separate feature branch. It does not mean the deployed GitHub Pages app contains those changes. The PR remains a draft.

## Reproduced checks on the candidate branch (16 Nov 2026; latest CI evidence below)

| Gate | Result | Evidence / limitation |
|---|---|---|
| Node 20 unit suite | PASS: 255/255 | [CI run](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43825937243) |
| Node 22 unit suite | PASS: 255/255 | Same run |
| Additional targeted checks | PASS: 27 + 3 per runtime | Same run; some tests repeat the primary suite |
| Both offline apps | PASS in headless Chromium | [Browser run](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43825931102) |
| 360, 411, 1280px | PASS for both apps: 6 app/viewport combinations | Not physical Android/iOS evidence |
| Ten locale switches per combination | PASS: 60 code/viewport/app checks | Labels and direction only; not human linguistic validation |
| RTL | PASS for Arabic and Persian (DOM `dir`) | Full typography and accessibility still require human review |
| JSON export integrity | PASS: strict textual equality to embedded report source (after documented trailing whitespace normalization) | Does not prove original source authenticity |
| Browser script errors | PASS: none reported | Headless Chromium environment only |\n| Phone case creation and analysis | PASS: original core in Chromium, byte-identical JSON to Node.js for synthetic test, stale export blocked, cycles rejected | [Browser run](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43825931102) |\n| Reproducible browser-core build | PASS: pinned esbuild/@noble/hashes, byte-identical committed bundle and Node policy parity | [Build verification](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43825254756) |
| Visual review captures | Artifact saved: `mobile-visual-review` (nine PNG files including end-to-end analysis, 7-day retention) | [Artifact-producing run](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43825931102). Automated images do not replace real phone review |
| Real-world accuracy / vendor superiority | NOT TESTED | Evaluation harness exists, but independently labeled holdout data has not been supplied |
| Third-party security review | NOT TESTED | In-repo CI security checks are not independent certification |
| Published main with these changes | NOT DEPLOYED | PR #6 is still Draft |
| YouTube video and Devpost | NOT SUBMITTED | Requires actual public video and completed form |

## Visual review before recording
A human reviewer must open all nine artifact PNGs from the GitHub Actions run (for both applications at 360 and 411 pixels in Arabic and English), and check:
- Page header, language picker, case number, warning about original-language narratives.
- No important text clipped or overprinted in Arabic or English.
- The first report card, badge and source-origin counts are understandable.
- Graph remains horizontally scrollable without shifting the entire page.
- Font legibility for narration and screen recording.
- Confirm the same basic checks in the actual target browser on an Android phone, not just a headless simulation.
- Audit ten languages for accuracy; locale switches are not proof of full translation.

## Release decision
This candidate has passed the automated checks above, but is not a fully validated international product. **Do not show branch-only features as deployed in the competition video.** After a human review of the captures and actual mobile page, approve an explicit merge to main, verify the public deployment on the exact revision, re-run CI and browser smoke against the actual public URLs, then record the demo described in [FINAL_VIDEO_RECORDING_AR.md](FINAL_VIDEO_RECORDING_AR.md).

Submission must be in English or accompanied by English translations; source repo must include the root `/.kiro` directory and separate folders for the two apps. Official rules: https://kiroween.devpost.com/rules .
