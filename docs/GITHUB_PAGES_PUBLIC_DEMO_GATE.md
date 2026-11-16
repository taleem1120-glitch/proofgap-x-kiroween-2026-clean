# Judge-facing website deployment — owner action required

Repository: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean
This guide documents verification for the **current release candidate**. Earlier GitHub Actions successfully deployed a version of the site, but the PR #6 code has **not** been confirmed deployed. Public URLs must be rechecked after merging.

## Publish without a paid service
1. Ensure the default branch `main` has the intended release-verified files. Do NOT merge PR #6 until its release gates are accepted.
2. In the repository GitHub web UI, open Settings → Pages. Under Build and deployment select **Deploy from a branch**. Choose `main`, `/(root)`, Save. This setting is controlled by the owner; it has not been changed by this document.
3. Verify that Pages reports a successful deployment for the **exact merged SHA** and that all three app URLs actually load:
   - https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/viewer/showcase.html
   - https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/apps/proofgap-cite/showcase.html
   - https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/tools/case-builder.html
4. In a fresh private-browser tab and on Android Chrome: check ProofGap X and ProofGap Cite in two languages, review graph navigation, and export both JSON files. In the phone case builder add a derived source, analyze the sample and export the full report; compare it with the same Node engine output. Change a source afterward and confirm the old report download is disabled. Confirm no API keys, proprietary source or victim data appear on the published pages.
5. Record the actual published URL, UTC time, browser/version, export checksum, and screenshots. If Pages is blocked, submit a public release ZIP and transparent instructions as a test build, subject to Devpost's requirement for an accessible link.
6. Public YouTube video (<3 minutes) must show actual running software; use docs/KIROWEEN_VIDEO_FINAL_STORYBOARD.md. Complete Devpost form and verify final submission status.

Do not declare the site live from the presence of a GitHub Pages URL alone. Public repository visibility does not itself enable GitHub Pages.

Official contest rules: https://kiroween.devpost.com/rules

## Deterministic deployed-version verification
Run `node scripts/public-release-smoke.mjs` from a clean checkout on an authorized CI runner **after** publishing, with the public Pages URL as the only input. The script compares served HTML/JS/CSS bytes against committed artifacts, checks essential case-builder links, and reports a failure if the public site is stale or inaccessible. It cannot verify visual quality or source authenticity.
