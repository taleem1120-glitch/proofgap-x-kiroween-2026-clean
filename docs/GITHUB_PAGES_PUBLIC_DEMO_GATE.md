# Judge-facing website deployment — owner action required

Repository: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean
This guide describes a future deployment only. Neither URL has been verified as live.

## Publish without a paid service
1. Ensure the default branch `main` has the intended release-verified files. Do NOT merge draft PR #4 until its review and final CI pass are accepted.
2. In the repository GitHub web UI, open Settings → Pages. Under Build and deployment select **Deploy from a branch**. Choose `main`, `/(root)`, Save. This setting is controlled by the owner; it has not been changed by this document.
3. Verify that Pages reports a published site and that both URLs actually load:
   - https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/viewer/showcase.html
   - https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/apps/proofgap-cite/showcase.html
4. In a fresh private-browser tab and on Android Chrome: visually check five ProofGap X findings and the six Cite claim rows; export both JSON files and compare with CLI output. Confirm no API keys, proprietary source or victim data appear on the published pages.
5. Record the actual published URL, UTC time, browser/version, export checksum, and screenshots. If Pages is blocked, submit a public release ZIP and transparent instructions as a test build, subject to Devpost's requirement for an accessible link.
6. Public YouTube video (<3 minutes) must show actual running software; use docs/KIROWEEN_VIDEO_FINAL_STORYBOARD.md. Complete Devpost form and verify final submission status.

Do not declare the site live from the presence of a GitHub Pages URL alone. Public repository visibility does not itself enable GitHub Pages.

Official contest rules: https://kiroween.devpost.com/rules
