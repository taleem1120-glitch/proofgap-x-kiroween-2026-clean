# Kiroween 2026 release-candidate readiness (factual; Phase 7)

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
| 3 | Code on the default branch | `main` holds only the initial README. The code is in 6 stacked, unmerged PRs (#1 → … → #6) | **BLOCKER · OWNER**: merge #1 to #6 in order, or retarget the stack to `main` |
| 4 | Demo video < 3 min, public | Script ready (`docs/DEMO.md`); not recorded | **BLOCKER · OWNER** (recording and publishing) |
| 5 | Category choice | No category is currently a strong fit (see below) | **BLOCKER · OWNER** decision |
| 6 | Working application URL | None. The demo is a static offline file (`viewer/showcase.html`) plus a CLI. Judges can open the file from a clone or download. Hosting it (for example on GitHub Pages) is a deployment | **WARNING · OWNER** (deployment needs approval; requirement NOT VERIFIED) |
| 7 | New-project timing | Repository created 2026-11-13T19:16:22Z; all commits dated 13–14 Nov 2026 | VERIFIED |
| 8 | `/.kiro` at root, not gitignored | `.kiro/specs/proofgap-x/`, `.kiro/steering/proofgap-x.md`, `.kiro/KIRO_USAGE.md` are tracked; `git check-ignore` reports nothing | VERIFIED |
| 9 | Repeatable install | `npm ci` succeeds on Node 20.20.2 and 22.23.4 with an empty dependency tree; fresh-clone check recorded in `.kiro/specs/proofgap-x/acceptance.md` | VERIFIED (Linux only) |
| 10 | Tests | 159/159 on Node 20.20.2, 22.23.4 and 24.22.1 | VERIFIED (local) |
| 11 | CI | GitHub Actions **BLOCKED_BY_BILLING**; jobs never started | WARNING · OWNER (billing) |
| 12 | Secrets in tree or history | 0 matches across all history for GitHub/AWS/Slack/Google/OpenAI token formats, private-key headers, and `password/secret/token/api_key = value` patterns | VERIFIED (pattern scan; not a guarantee) |
| 13 | Personal data | Example data uses only reserved `example.test` addresses and fictional entities. The **initial commit's author email is a personal address** (owner's own); it becomes public with the repository and can only be removed by rewriting history | **WARNING · OWNER** (accept, or rewrite history before going public) |
| 14 | Environment details in `validation/` records | Sandbox paths (`/projects/sandbox/...`), kernel version and CPU model; no usernames, hostnames or tokens | WARNING (low risk; also present in history) |
| 15 | ATHARNEX / EvidenceForge X material | Names appear only in the independence statements in this document and in the steering file; no code, data or assets | VERIFIED |
| 16 | Third-party code and assets | Zero runtime dependencies. No vendored code, fonts, images or icons; the viewer uses system fonts and inline SVG it draws itself. CI *references* `actions/checkout` and `actions/setup-node` (MIT) without vendoring them. `bench/legacy/` holds only this repository's own earlier code | VERIFIED |
| 17 | Viewer end-to-end | Committed showcase equals a fresh engine build (test). Export equals CLI bytes. File picker loads 1–2 reports and rejects non-reports and broken JSON with a reason. Enter activates export and disclosures. No overflow at 320–1400 px. No console errors. Only network request is the file itself. XSS payloads inert. Muted text contrast about 8:1 | VERIFIED (headless Chromium only) |
| 18 | Screen readers, Firefox/Safari, Windows/macOS | Not run | WARNING (NOT TESTED) |
| 19 | Accuracy claims | Benchmark is synthetic and author-built; no real-world claims made | WARNING (by nature) |
| 20 | Ownership of AI-generated code | Written by the Kiro agent under the owner's account. Rights depend on Kiro's terms and local law | **WARNING · OWNER** (confirm; not legal advice) |

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
