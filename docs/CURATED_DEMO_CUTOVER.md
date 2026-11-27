# Curated competition demo cutover

Current public site: https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/

The curated package is a synthetic-data demonstration, not production approval.
The existing branch-root deployment must not be used to publish the expanded release tree.

## Owner-controlled cutover

1. Review the allow-list in scripts/build-public-demo.mjs and successful exact-head CI and curated artifact. Check that public documents and demo fixtures are suitable for public release. The public repository itself remains public; this procedure does not make its files or history confidential.
2. In Settings > Pages, change Source from Deploy from a branch to GitHub Actions. Preserve the site URL and HTTPS; do not create a new site. The previous version may remain visible or temporarily be unavailable during cutover.
3. Confirm the source setting before merging the integration PR into main. Keep the independent-review release PR separate and in Draft.
4. After merge, require successful exact-main CI, then manually run **Publish curated competition demo** on main. Check the confirmation input only after the owner approves synthetic-only public hosting. The workflow runs tests and local validation, builds the exact allow-list, deploys with narrowly scoped Pages/OIDC permissions, and checks all 15 public file hashes and four excluded-path probes.
5. A green deploy job alone is insufficient: require the final verify job to succeed. Open the three app paths on a real phone and desktop, run a synthetic case, and export both application reports. Verify the Devpost links and video correspond to the published functionality.
6. If verification fails, do not claim the candidate is live or switch back to publishing the entire expanded root. Diagnose the failing path; revert or fix the workflow in a reviewed commit and re-run with owner approval.

No live case data or credentials should be entered in the public demo. Hosting access logs and retention are external to application controls. Independent security, human accessibility and deployment-specific privacy approvals remain open for production.
