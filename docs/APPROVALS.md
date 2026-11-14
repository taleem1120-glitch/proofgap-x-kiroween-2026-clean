# ProofGap X: owner approval checklist (Phase 9)

Each action below is **separately authorized**. The agent has done none of them. Approving one does not approve any other. Order matters where a precondition is listed.

State when this was written: code at PR #6 head; repository **private**; **no licence**; `main` holds only the initial README; GitHub Actions **BLOCKED_BY_BILLING**; Pages **off**.

---

## A. Licensing: Apache-2.0
**Proposal (not in the repository):** `/projects/sandbox/license-proposal/`
- `LICENSE`: unmodified Apache-2.0 text, 202 lines. Word-for-word identical (1,581 words) to the SPDX licence-list copy.
- `NOTICE`: `Copyright 2026 taleem1120-glitch`, the **PROPOSED** holder.
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
- [ ] A2. Confirm `taleem1120-glitch` as the copyright holder, or give a legal name or entity.
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
- [ ] C1. **Recommended:** retarget PR #6 to `main` and merge it once with **"Create a merge commit"**. PRs #1–#5 then show as merged.
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

## F. Category: Skeleton Crew second application (needs approval to build)
**Reassessment:**
- **Core:** reusable at the data-model level. Sources, claims, evidence, `derivedFrom` and stance carry no domain meaning; independence, gaps, planner, graph, integrity and viewer work on any case JSON.
- **Domain wording:** investigation-specific text exists in 4 strings only: the disclaimer and an explanation suffix in `src/analyze.js`, and the header and footer in `src/html.js`.
- **Structure:** this repository is one application, not a skeleton template. The category asks for two distinct applications on the shared code.

| Candidate second application | What is genuinely distinct | Expected judging value | Estimated cost | Risks |
|---|---|---|---|---|
| **ProofGap Cite**: "citation laundering" checker for research or news notes written in Markdown | New user (writer or researcher). New input: a Markdown note with claims and footnote citations, plus a folder of saved source copies, converted into case JSON by an adapter. New output: lint-style terminal annotations and exit code. Reuses verified byte identity, catching saved copies of the same press release under different outlets | Makes the category **met** instead of unmet. Strongest story ("10 articles, 1 press release") and directly reuses the strongest feature | **One focused session:** about 300–450 lines (adapter, profile wording, CLI), 15–20 tests, one synthetic dataset, a second showcase, `docs/SKELETON.md` | Judges may see it as the same engine with a new dataset; mitigated by the distinct input pipeline, UX and user. Parsing scope must stay small |
| Security-advisory corroboration (mirrored advisories for one vulnerability) | Security analysts; advisory records as input | High relevance for security-minded judges | Higher: realistic records need an advisory format, and real data brings licence and network questions | Synthetic advisories look artificial; real data needs licence checks |
| Product-review independence | Consumers or marketplaces | Low: reads as the same idea | Similar to Cite | Weak distinctness |

**Required core change for any candidate:** an optional "profile" for the 4 domain strings. The default must leave app 1's output byte-identical, which is checked by the existing showcase and benchmark byte-equality tests, so it needs no scoring change and no version bump.

- [ ] F1. Approve building **ProofGap Cite** as application 2 and entering **Skeleton Crew**. Recommended if credits allow one more session.
- [ ] F2. Or decline; then enter Skeleton Crew without a second app (does not meet the category) or choose another category. No category is currently a strong fit.

---

## G. Other owner-only items
- [ ] G1. Record and publish the < 3-minute video using `docs/DEMO.md`. Say "open source" only after A and D.
- [ ] G2. Read the official 2026 rules and category text; the agent could not (HTTP 403).
- [ ] G3. Resolve the GitHub billing lock to unblock CI, and possibly Pages. CI stays **BLOCKED_BY_BILLING** until a run executes.
- [ ] G4. Submit on Devpost.

## Recommended order
**A → B (B1) → C1 → D → E (optional) → G1 → G4.** F, if approved, goes before C so application 2 is merged with the rest. G2 should come first of all.
