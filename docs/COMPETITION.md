# Kiroween 2026 release-candidate readiness (factual; Phase 7, updated Phases 8–9)

**Owner actions are listed one by one, each separately authorized, in [`docs/APPROVALS.md`](APPROVALS.md)**, covering licensing, history, merging, visibility, Pages, category and video.

Labels: **BLOCKER** (submission impossible until resolved) · **WARNING** (risk or weakness; submission possible) · **VERIFIED** (observed in this repository or session). Items marked **OWNER** need explicit owner approval; the agent has not done them.

## Official requirements: sources and confidence
The official pages (`kiroween.devpost.com`, rules) returned **HTTP 403** to the agent in every phase, so no requirement below is copied from the official rules.
- From the official Devpost page's search snippet: only **new projects** built during the submission period, **30 Oct – 4 Dec 2026**, are eligible.
- From a secondary summary ([dev.to](https://dev.to/brian_mk/decoding-kiroween-4nm)), believed to describe the 2025 rules: a public repository with a visible **OSI-approved licence**; a **demo video under 3 minutes** (judges need not watch beyond 3:00).
- Also from Kiroween 2025 rules as recalled, **NOT VERIFIED** for 2026: a `/.kiro` directory at the repository root that is not gitignored, a URL to a working application or testing instructions, and a write-up of Kiro usage.

**The owner must read the official 2026 rules before submitting.** Everything below is checked against the list above.

## Release checklist
| # | Gate | Current state | Status |
|---|---|---|---|
| 1 | OSI licence | None; `package.json` says `UNLICENSED` | **BLOCKER · OWNER** (see licence section) |
| 2 | Public repository | Private (GitHub API) | **BLOCKER · OWNER** |
| 3 | Code on the default branch | `main` holds only the initial README; the code is in 6 stacked, unmerged PRs. Phase 8: all 6 report `mergeable=clean`; each head descends from its base; a local simulation merged all six into `main` with `--no-ff` without conflicts, ending at a tree identical to PR #6's head | **BLOCKER · OWNER**: follow the merge plan below |
| 4 | Demo video < 3 min, public | Script ready (`docs/DEMO.md`); not recorded | **BLOCKER · OWNER** (recording and publishing) |
| 5 | Category choice | No category is currently a strong fit (see below) | **BLOCKER · OWNER** decision |
| 6 | Working application URL | None. The demo is a static, self-contained file (`viewer/showcase.html`) plus a CLI. Phase 8: the unchanged file served from a simulated GitHub Pages HTTPS origin rendered both panels, all 5 verdicts, both graphs and export, with no console or CSP errors and no request beyond itself. Real Pages hosting is NOT TESTED; see "Working-app evidence" | **WARNING · OWNER** (deployment needs approval; requirement NOT VERIFIED) |
| 7 | New-project timing | Repository created 2026-11-13T19:16:22Z; all commits dated 13–14 Nov 2026 | VERIFIED |
| 8 | `/.kiro` at root, not gitignored | `.kiro/specs/proofgap-x/`, `.kiro/steering/proofgap-x.md`, `.kiro/KIRO_USAGE.md` are tracked; `git check-ignore` reports nothing | VERIFIED |
| 9 | Repeatable install | `npm ci` succeeds on Node 20.20.2 and 22.23.4 with an empty dependency tree; fresh-clone check recorded in `.kiro/specs/proofgap-x/acceptance.md` | VERIFIED (Linux only) |
| 10 | Tests | 159/159 on Node 20.20.2, 22.23.4 and 24.22.1 | VERIFIED (local) |
| 11 | CI | GitHub Actions **BLOCKED_BY_BILLING**; jobs never started | WARNING · OWNER (billing) |
| 12 | Secrets in tree or history | 0 matches across all history for GitHub/AWS/Slack/Google/OpenAI token formats, private-key headers, and `password/secret/token/api_key = value` patterns | VERIFIED (pattern scan; not a guarantee) |
| 13 | Personal data | Example data uses only reserved `example.test` addresses and fictional entities. Exactly **one** commit (`4a45e30`, the GitHub-created root commit) carries a personal author email; all 11 later commits use a `users.noreply.github.com` address. No email appears in any file content in any revision | **WARNING · OWNER** (see history remediation below) |
| 14 | Environment details in `validation/` records | Sandbox paths (`/projects/sandbox/...`), kernel version and CPU model. Phase 8 re-check: 0 tracked files contain `/root/` or `/home/` paths. The Phase 7 check for this had a flawed pattern (an empty hostname made it match every file), so only today's result counts | WARNING (low risk) |
| 15 | ATHARNEX / EvidenceForge X material | Names appear only in the independence statements in this document and in the steering file; no code, data or assets | VERIFIED |
| 16 | Third-party code and assets | Zero runtime dependencies. No vendored code, fonts, images or icons; the viewer uses system fonts and inline SVG it draws itself. CI *references* `actions/checkout` and `actions/setup-node` (MIT) without vendoring them. `bench/legacy/` holds only this repository's own earlier code | VERIFIED |
| 17 | Viewer end-to-end | Committed showcase equals a fresh engine build (test). Export equals CLI bytes. File picker loads 1–2 reports and rejects non-reports and broken JSON with a reason. Enter activates export and disclosures. No overflow at 320–1400 px. No console errors. Only network request is the file itself. XSS payloads inert. Muted text contrast about 8:1 | VERIFIED (headless Chromium only) |
| 18 | Screen readers, Firefox/Safari, Windows/macOS | Not run | WARNING (NOT TESTED) |
| 19 | Accuracy claims | Benchmark is synthetic and author-built; no real-world claims made | WARNING (by nature) |
| 20 | Ownership of AI-generated code | Written by the Kiro agent under the owner's account. Rights depend on Kiro's terms and local law | **WARNING · OWNER** (confirm; not legal advice) |

## Merge plan (Phase 8; owner executes)
The PRs form one linear stack: main ← #1 (phase1) ← #2 (phase2) ← #3 (phase3) ← #4 (phase5) ← #5 (phase6) ← #6 (phase7). There is no "phase4" branch; #4 sits directly on #3. Dependency order and number order coincide.

**Recommended (safest): one merge of the whole stack.**
1. Apply the licence first if approved: commit it on `feature/phase7-release-candidate`, so the code never reaches `main` unlicensed.
2. Retarget PR #6 to `main` (Edit → base: `main`). It then contains all 12 commits.
3. Merge #6 with **"Create a merge commit"**, not squash and not rebase. #1–#5 then show as merged automatically, because their commits are in `main`.
4. Only afterwards delete the feature branches, if wanted.

**Alternative, preserving per-phase review:** merge #1, #2, #3, #4, #5, #6 strictly in that order, each with **"Create a merge commit"**. After each merge, retarget the next PR to `main` (`delete_branch_on_merge` is off, so GitHub will not do it automatically).

**Do not use squash or rebase merges anywhere in the stack.** Each would rewrite commits, so every later PR would show duplicated diffs or conflicts.

## Git history remediation (owner decision; nothing rewritten)
- **Secrets:** none found, so no secret remediation is needed. 10 credential patterns were scanned across all history (12 commits, every branch), with 0 matches.
- **Personal email in root commit `4a45e30`:** visible to anyone once the repository is public (for example via `.patch` URLs). It is not a credential. Options:
  - (a) **Accept.** It is the owner's own address on the commit GitHub created with the repository. **Recommended**, unless the owner wants that address private.
  - (b) **Rewrite only the root commit's author** to the noreply address, then force-push all 7 branches. Every SHA changes, all 6 PRs must be recreated, and the SHAs cited in `.kiro/specs/`, `docs/` and `validation/` records stop matching. It must happen **before** the repository goes public, because public clones cannot be recalled.
  - The GitHub setting "Keep my email addresses private" does **not** change existing commits.

## Working-app evidence (what is actually needed)
- **What exists:** `viewer/showcase.html` runs offline and needs no server. That is the working app. The CLI reproduces it from source.
- **If the rules require a URL:** the lowest-effort option is GitHub Pages, "Deploy from a branch", on `main`, root folder, giving `https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026/viewer/showcase.html`. Before enabling it, add an empty `.nojekyll` file so Jekyll does not process the repository.
- **Risks, NOT TESTED:**
  - Branch-based Pages builds run as a GitHub Actions workflow, so the current billing lock may block them as well.
  - Pages on a private repository requires a paid plan, so do this after the repository is public.
- **Fallback if Pages is blocked:** the video plus the README "For judges" steps (download, open the file).
- **Evidence to collect after deploying:** load the public URL, confirm the five verdicts shown in `docs/DEMO.md`, and record the URL and date here.

## Licence recommendation (proposal only; nothing committed)
| | Apache-2.0 | MIT | GPL-3.0 |
|---|---|---|---|
| OSI-approved | yes | yes | yes |
| Patent grant | **explicit**, with termination on patent suits | none | yes |
| Contribution terms | Section 5: contributions under the same licence by default | none | via licence |
| Reuse by others, including closed products | yes | yes | only as copyleft |
| Burden on users | keep LICENSE and NOTICE, state changes | keep notice | publish derivative source |
| Compatibility with this repo | no dependencies, so no conflicts | same | same |

**Recommendation: Apache-2.0.** ProofGap X is security and evidence tooling that others may embed, and the explicit patent grant and contribution clause give users and contributors clearer terms than MIT at almost no cost. Choose MIT if the shortest possible licence matters more. Avoid GPL-3.0 unless copyleft is the intent.

Prepared files (Phase 8), deliberately **outside** the repository: `/projects/sandbox/license-proposal/` contains `LICENSE`, `NOTICE`, `package.json.patch` and `PROPOSAL.md`. `LICENSE` is the GitHub licence API text and is word-for-word identical (1,581 words) to the SPDX text; apache.org returned HTTP 403. Licence compatibility: zero runtime or dev dependencies; referenced CI actions `actions/checkout` and `actions/setup-node` are MIT (GitHub API) and are not vendored; no third-party assets, so there is no conflict with Apache-2.0.

If the owner approves Apache-2.0, the agent will:
1. Add `LICENSE` containing the unmodified official text from <https://www.apache.org/licenses/LICENSE-2.0.txt>.
2. Add a `NOTICE` file:
   ```
   ProofGap X
   Copyright 2026 <owner's legal name or GitHub handle>
   ```
3. Set `"license": "Apache-2.0"` in `package.json` and refresh `package-lock.json`.
4. Add a licence section to the README.

The owner must supply the copyright holder name. No licence file is in the repository until then, on purpose: GitHub's licence detector would read even a draft as the project's licence.

## Category fit
Source caveat: the official 2026 pages returned HTTP 403, so the **official category text is NOT VERIFIED**. The four names come from the owner's brief. Third-party 2026 project pages cite "Resurrection" and "Costume Contest" as 2026 categories. The descriptions below summarize the **Kiroween 2025** definitions as I understand them, and the owner must check them against the 2026 rules.

| Category (summary, unverified for 2026) | What ProofGap X actually has | Fit |
|---|---|---|
| Resurrection: bring dead or obsolete technology back with modern tools | Nothing revived; new code | **Poor.** Claiming it would be misleading |
| Frankenstein: stitch together incompatible technologies into one app | Zero runtime dependencies, one stack (Node + static HTML) | **Poor** |
| Skeleton Crew: a lean, reusable code skeleton, shown through two distinct applications built on it | Domain-agnostic core (sources / claims / evidence / links → independence, gaps, plans, graph, viewer), zero dependencies, schema and CLI. **Only one application exists** (investigation evidence) | **Best potential fit, currently unmet:** a second, genuinely distinct application on the same core is required |
| Costume Contest: a polished, haunting / unforgettable UI | Accessible dark viewer, verified in Chromium; **no Halloween theming** | Weak to partial; needs a theme pass, and theme must not obscure the evidence semantics |

**Recommendation: Skeleton Crew**, conditional on the owner approving a second distinct application built on the unchanged core. The cheapest honest candidate is a "citation laundering" checker for news or research claims: articles citing articles that all trace to one press release. That reuses the engine, schema and viewer with a new dataset and labels. Until it exists, no category is a strong fit, and the submission should not claim one.


**Phase 9 reassessment:** a concrete second application ("ProofGap Cite", a Markdown citation-laundering checker) and its cost and value comparison are in `docs/APPROVALS.md` §F; building it needs approval.

**Phase 7 re-check:** nothing changed in the product's shape, so the assessment stands. With the current product, **Skeleton Crew is the strongest achievable category and is not yet met**, because it needs a second, distinct application on the same core. Resurrection and Frankenstein would be misleading claims. Costume Contest would need a Halloween design pass. If the owner does not approve a second application, the honest options are to enter Costume Contest after a themed redesign, or to enter Skeleton Crew without a second app, knowing it does not meet that category's description.

## Judging-readiness matrix (20% each)
| Criterion | Actual evidence | Missing proof |
|---|---|---|
| Potential Impact | Catches false corroboration (echoed, derived and byte-identical evidence) and abstains on suspected hidden dependence. File-backed heldout3: undeclared byte-identical copies falsely asserted 32/43 before 0.4.0, 0/43 after; declared FPR 0/479 | No real users or cases; synthetic, author-built benchmark; re-encoded copies still missed (24/47) |
| Technological Implementation / Kiro usage | Per-claim, monotone independence; artifact entanglement; abstention; planner checked by executing its hypotheticals; locally verified byte identity; 13 confirmed defects with regression tests; 159 tests on Node 20, 22 and 24; deterministic outputs; zero dependencies | Remote CI blocked; Kiro usage is agent sessions, spec files and the Playwright Power only (`.kiro/KIRO_USAGE.md`); no spec workflow, hooks or Crew |
| Design | Side-by-side viewer; graph with four relationship bases; text alternative; keyboard and responsive checks; CSP-locked | No usability or screen-reader testing; basic graph layout for large cases |
| Innovation | Four-way relationship basis; corroboration-denial-resistant independence; counterfactual plans from the verdict rule; abstention as an outcome | No external review of novelty |
| Presentation | Timed 180-second script, committed showcase, judges' instructions in the README | No video, no Devpost write-up, no public URL |

## Kiro usage
See `.kiro/KIRO_USAGE.md`. It is the single source and lists what was and was not used.
