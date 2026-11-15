# ProofGap X: owner approval checklist (Phase 9)

Each action below is **separately authorized**. The agent has done none of them. Approving one does not approve any other. Order matters where a precondition is listed.

State when this was written: code at PR #6 head; repository **private**; **no licence**; `main` holds only the initial README; GitHub Actions **BLOCKED_BY_BILLING**; Pages **off**.

---

## A. Licensing: Apache-2.0
**Final reviewed change (Phase 12; not in the repository):** `/projects/sandbox/license-proposal/apache-2.0.patch`, 267 lines, SHA-256 prefix `4a381f26`. It applies to PR #7's head and changes 5 files:
- `LICENSE`: unmodified Apache-2.0 text, 202 lines, appendix included. Word-for-word identical (1,581 words) to the SPDX licence-list copy, re-checked in Phase 12.
- `NOTICE`: two lines, `ProofGap X` and `Copyright 2026` followed by the owner's full legal name. Phase 12 dropped a redundant third sentence.
- `package.json`: `"license": "Apache-2.0"`, and `NOTICE` added to `files`. npm packs `LICENSE` automatically but not `NOTICE`, and Apache-2.0 §4(d) requires `NOTICE` to be redistributed.
- `package-lock.json`: root `license` field regenerated.
- `README.md`: a "Licence" section; the "no OSI licence chosen" limitation removed.

**Verified with the patch applied** (throwaway worktree of PR #7 head `de01ebf`, Phase 12):
- 195/195 tests on Node 20.20.2, 22.23.4 and 24.22.1.
- `npm pack --dry-run` includes `LICENSE` and `NOTICE`.
- Both applications' exports are unchanged: ProofGap X showcase report `c1c272a7…`, ProofGap Cite report `da3cccb0…`.

**Privacy note:** once the repository is public, the owner's full legal name will be public in `NOTICE`, `README.md` and the git history. That is normal for a copyright notice, but it cannot be withdrawn later without rewriting history.

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

**Exact approval needed:** *"Approve commit of apache-2.0.patch (SHA-256 4a381f26…) to feature/phase11-dual-application"*, together with A1 and A3. **Then the agent will:** `git apply` the patch on PR #7's branch, run the full suite, and commit and push with `[skip ci]`. The licence then lands with the code when the stack is merged. **Rollback:** revert that commit; the licence is not active on GitHub until it reaches `main`.

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
**Facts (Phase 12 check):**
- All **seven** PRs are open and `mergeable=clean`.
- The stack is linear: main ← #1 (phase1) ← #2 (phase2) ← #3 (phase3) ← #4 (phase5) ← #5 (phase6) ← #6 (phase7) ← **#7 (phase11, top)**. There is no phase4 or phase10 branch.
- Each head descends from its base, and `main` has 0 commits outside the stack.
- **Simulations (local, nothing pushed):** both (a) seven sequential `--no-ff` merges and (b) one merge of #7 into `main` had **no conflicts**, and both ended at a tree **identical** to PR #7's head. 195/195 tests passed on the simulated merged `main`.
- **What enters `main`:** 15 commits, all with `users.noreply.github.com` author emails. The personal email is only on `4a45e30`, which is already on `main`.
- **Combined diff `main..#7`:** 223 files, +68,578 / −2 lines (1 modified file, `README.md`; 222 added). By volume:

  | Area | Lines | Files |
  |---|---|---|
  | `validation/` records | 45,300 | 85 |
  | `bench/results` | 8,156 | 8 |
  | `apps/` | 3,261 | 15 |
  | `bench/legacy` snapshots | 2,923 | 32 |
  | `viewer/` | 2,723 | 3 |
  | `test/` | 2,176 | 21 |
  | `src/` | 1,427 | 17 |

  Code and tests are about 9,600 lines; the rest is evidence, snapshots and generated showcases.

**Preconditions:** A done, or explicitly waived. B decided, because B2 must happen before merging.

Choose one:
- [ ] C1. **Recommended:** retarget the **top** PR of the stack (PR #7, Phase 11, if accepted; otherwise #6) to `main` and merge it once with **"Create a merge commit"**. All lower PRs then show as merged.
- [ ] C2. Merge #1 → #7 strictly in order, each with **"Create a merge commit"**, retargeting the next PR to `main` after each merge. Auto-delete of branches is off, so GitHub won't retarget them.
- **Never** squash or rebase any PR in this stack.

**Merge risks:**
- **Squash or rebase** of any PR rewrites commits and breaks the rest of the stack. Use "Create a merge commit" only.
- **Merging only part of the stack** (for example #1 alone) leaves `main` without the licence and without app 2. Prefer C1.
- **The PR #7 diff is large mostly because of `validation/` records.** Review `src/`, `apps/`, `test/` and `viewer/` first. The records are reproducible with `npm run validate:local`, but keeping them is the owner's choice; removing them later only changes future history.
- **CI will not run on merge** while billing is blocked. The local suite is the only check.
- **No branch protection** is configured that could be checked (the API returned 403); merging needs no other approval.

**Verify afterwards:**
1. `git clone` `main`, then `npm ci && npm test`: expect **195/195**.
2. `rm viewer/showcase.html apps/proofgap-cite/showcase.html && npm run showcase && npm run showcase:cite && git status --porcelain`: expect no changes, which proves the showcases still match the engine.
3. Confirm GitHub shows `LICENSE` as Apache-2.0 (only if A was applied before the merge).

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
