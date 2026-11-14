# ProofGap X: owner approval checklist (Phase 9)

Each action below is **separately authorized**. The agent has done none of them. Approving one does not approve any other. Order matters where a precondition is listed.

State when this was written: code at PR #6 head; repository **private**; **no licence**; `main` holds only the initial README; GitHub Actions **BLOCKED_BY_BILLING**; Pages **off**.

---

## A. Licensing: Apache-2.0
**Proposal (not in the repository):** `/projects/sandbox/license-proposal/`
- `LICENSE`: unmodified Apache-2.0 text, 202 lines. Word-for-word identical (1,581 words) to the SPDX licence-list copy.
- `NOTICE`: `Copyright 2026` followed by the owner's full legal name, supplied in Phase 11. It is kept **only in the proposal folder**, not in the repository, until A1 is approved.
- `package.json.patch`: `"license": "UNLICENSED"` → `"Apache-2.0"`.

**Compatibility review (technical, not legal):**
| Item | Finding |
|---|---|
| Runtime / dev dependencies | none (`package.json`, `package-lock.json`) |
| Vendored third-party code | none; no file contains third-party copyright, licence or SPDX markers |
| Assets | none third-party: system fonts, inline SVG drawn by the viewer, synthetic example data written for this project |
| `bench/legacy/` | this project's own earlier code (git snapshots), same owner |
| CI references | `actions/checkout`, `actions/setup-node`: MIT (GitHub API), referenced, not distributed |
| Conflict with Apache-2.0 | none found |

**Not verified:** legal ownership of the code. It was written by the Kiro agent under the owner's account, and the rights depend on Kiro's terms and local law. No legal review has been done.

**Owner decides:**
- [ ] A1. Approve Apache-2.0, or name another OSI licence.
- [x] A2. Copyright holder supplied by the owner (Phase 11): full legal name, year 2026. The owner confirms, to the best of his knowledge, his right to license the code. No legal verification has been done.
- [ ] A3. Confirm there are no other contributors or rights holders.

**Then the agent will:** copy `LICENSE` and `NOTICE` to the repository root, apply the `package.json` change, regenerate `package-lock.json`, add a README licence section, run `npm test`, and commit to the PR #6 branch so the licence lands together with the code. **Rollback:** revert that commit.

---

## B. Git history cleanup (personal email)
**Finding:** exactly one commit, `4a45e30` (the "Initial commit" GitHub created), has a personal author email. Every later commit uses a `users.noreply.github.com` address. No email appears in any file content in any revision. **No credentials** were found in any commit: 10 token and key patterns, 0 matches, across all history including the Phase 8 commit.

**Options (choose one):**
- [ ] B1. **Accept, no change.** Recommended unless the address must stay private. Nothing breaks.
- [ ] B2. **Rewrite the root commit's author** to the noreply address. This must happen **before** the repository goes public, because public clones can't be recalled. The agent would do it only on explicit approval:
  1. Back up: `git clone --mirror` to a safe location.
  2. Rewrite only commit `4a45e30`'s author, using `git filter-repo --mailmap` or `git rebase --root` with `--exec 'git commit --amend --reset-author --no-edit'`, restricted to the root commit.
  3. Force-push all 7 branches.
  4. Recreate PRs #1–#6, since every SHA changes.
  5. Update the SHAs cited in `.kiro/specs/`, `docs/` and the `validation/` summaries, or note that they refer to pre-rewrite history.

  **Rollback:** push the mirror backup. The cost is high, so prefer B1 unless privacy requires B2.

The GitHub setting "Keep my email addresses private" does not change existing commits.

---

## C. Merging the PR stack
**Facts (Phase 9 check):**
- All six PRs are open and `mergeable=clean`.
- The stack is linear: main ← #1 (phase1) ← #2 (phase2) ← #3 (phase3) ← #4 (phase5) ← #5 (phase6) ← #6 (phase7). There is no phase4 branch.
- Each head descends from its base, and `main` has 0 commits outside the stack.
- A local `--no-ff` simulation of all six merges had no conflicts and ended at a tree identical to PR #6's head (Phase 8; PR #6 changed since then only by docs commits).

**Preconditions:** A done, or explicitly waived. B decided, because B2 must happen before merging.

Choose one:
- [ ] C1. **Recommended:** retarget the **top** PR of the stack (PR #7, Phase 11, if accepted; otherwise #6) to `main` and merge it once with **"Create a merge commit"**. All lower PRs then show as merged.
- [ ] C2. Merge #1 → #6 strictly in order, each with **"Create a merge commit"**, retargeting the next PR to `main` after each merge. Auto-delete of branches is off, so GitHub won't retarget them.
- **Never** squash or rebase any PR in this stack.

**Verify afterwards:** `git clone` `main`, then `npm ci && npm test` (expect 159/159).

---

## D. Repository visibility
**Preconditions:** A committed; B decided (B2 is impossible afterwards); C done, so `main` shows the code.
- [ ] D1. Settings → General → Danger zone → Change visibility → **Public**.

**Check before flipping:** no secrets (none found); you accept the one personal email (if B1); `validation/` records show sandbox paths, the kernel version and CPU model (low risk). **Rollback:** switch back to private. Anything already cloned or cached stays public.

---

## E. GitHub Pages deployment (optional working-app URL)
**Preconditions:** D done (Pages on a private repository needs a paid plan) and C done.

Steps:
- [ ] E1. Approve adding an empty `.nojekyll` file at the repository root, so Jekyll does not process the repository. This is a one-file commit to `main` via a PR; the agent prepares it on approval.
- [ ] E2. Settings → Pages → Source **"Deploy from a branch"** → Branch `main`, folder `/ (root)` → Save. Keep "Enforce HTTPS" on.
- [ ] E3. Wait for the "pages build and deployment" run. **Risk, NOT TESTED:** branch-based Pages builds run as a GitHub Actions job, and the account's billing lock may block them. If the run shows the same billing annotation, stop and use the fallback.
- [ ] E4. Verify at `https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026/viewer/showcase.html`:
  - the five verdicts listed in `docs/DEMO.md`;
  - the browser network tab shows only the page itself;
  - "Export report JSON" downloads files whose SHA-256 starts with `c1c272a7…` (A) and `cfaecdd6…` (B), the same as `node src/cli.js … --evidence-dir examples/showcase/evidence`.
- [ ] E5. Record the URL and date in `docs/COMPETITION.md`.

**Already verified without deploying:**
- The unchanged file served from a simulated `https://…github.io` origin renders correctly (Phase 8).
- Opened from `file://` with the browser's network emulation set to **offline** (Phase 9), it renders all 5 verdicts. Both exports are byte-identical to current CLI output. The evidence is the request log (only the `file://` page) plus the CSP `default-src 'none'`; `navigator.onLine` still read `true` under emulation for a `file://` page, so it is not used as evidence.

**Note:** "Deploy from a branch" serves every file on `main` as a static site, not just the viewer. Those files are public in the repository anyway.

**Rollback:** Settings → Pages → Unpublish.

**Fallback if Pages is blocked:** the video plus the README "For judges" steps (download the repository, open `viewer/showcase.html`).

---

## F. Category: Skeleton Crew second application
**Done in Phase 11, on branch `feature/phase11-dual-application`, not merged.**
- ProofGap Cite is in `apps/proofgap-cite/`.
- The core has a versioned interface, `src/core.js`; ProofGap X moved to `apps/proofgap-x/`, with `src/cli.js` kept as a shim.
- Evidence is listed in `docs/COMPETITION.md` (category section) and `apps/proofgap-cite/README.md`.
- The decision left to the owner is G2: read the official 2026 category text before entering Skeleton Crew.

## G. Other owner-only items
- [ ] G1. Record and publish the < 3-minute video using `docs/DEMO.md`. Say "open source" only after A and D.
- [ ] G2. Read the official 2026 rules and category text; the agent could not (HTTP 403).
- [ ] G3. Resolve the GitHub billing lock to unblock CI, and possibly Pages. CI stays **BLOCKED_BY_BILLING** until a run executes.
- [ ] G4. Submit on Devpost.

## Recommended order
**G2 → A → B (B1) → C1 (the Phase 11 PR is now the top of the stack) → D → E (optional) → G1 → G4.**
