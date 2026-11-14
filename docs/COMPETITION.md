# Kiroween 2026 readiness (factual; updated Phase 6)

Status labels: **VERIFIED** (observed in this repository/session), **FAILED**, **NOT TESTED / NOT VERIFIED**.

## Eligibility and publication blockers (owner action required before any submission)
| Item | Finding | Status |
|---|---|---|
| New-project rule (built 30 Oct – 4 Dec 2026) | GitHub API: repository created 2026-11-13T19:16:22Z; every commit dated 13 Nov 2026 | VERIFIED (dates); rule text taken from the [Kiroween 2026 Devpost page](https://kiroween.devpost.com/) search snippet because the page returned HTTP 403 to fetching |
| Public repository with an OSI-approved license | Repository is **private**; no `LICENSE` file; `package.json` says `UNLICENSED`. A secondary source ([dev.to summary](https://dev.to/brian_mk/decoding-kiroween-4nm)) states a public repo with a visible OSI license is required | **BLOCKER — owner must choose a license and make the repo public; not done by the agent (ownership/legal decision)** |
| Source independence | No ATHARNEX / EvidenceForge X code; zero runtime dependencies; `bench/legacy/` contains only earlier ProofGap X code from this repo's own git history | VERIFIED (repo contents) |
| Third-party content | Only synthetic, fictional example data; no real personal or case data | VERIFIED |
| Official category list and judging rules | Could not fetch official pages (HTTP 403). Categories below are from secondary search snippets only | NOT VERIFIED |
| Demo video (< 3 min per prior-year forum reference) | Outline exists (`docs/DEMO.md`); no video recorded | NOT DONE |
| Merged default branch | PRs #1–#4 open, unmerged by instruction | Owner decision |

## Category fit (Phase 6 assessment)
Source caveat: the official 2026 pages returned HTTP 403, so the **official category text is NOT VERIFIED**. The four names come from the owner's brief. Third-party 2026 project pages cite "Resurrection" and "Costume Contest" as 2026 categories. The descriptions below summarize the **Kiroween 2025** definitions as I understand them, and the owner must check them against the 2026 rules.

| Category (summary, unverified for 2026) | What ProofGap X actually has | Fit |
|---|---|---|
| Resurrection: bring dead or obsolete technology back with modern tools | Nothing revived; new code | **Poor.** Claiming it would be misleading |
| Frankenstein: stitch together incompatible technologies into one app | Zero runtime dependencies, one stack (Node + static HTML) | **Poor** |
| Skeleton Crew: a lean, reusable code skeleton, shown through two distinct applications built on it | Domain-agnostic core (sources / claims / evidence / links → independence, gaps, plans, graph, viewer), zero dependencies, schema and CLI. **Only one application exists** (investigation evidence) | **Best potential fit, currently unmet:** a second, genuinely distinct application on the same core is required |
| Costume Contest: a polished, haunting / unforgettable UI | Accessible dark viewer, verified in Chromium; **no Halloween theming** | Weak to partial; needs a theme pass, and theme must not obscure the evidence semantics |

**Recommendation: Skeleton Crew**, conditional on the owner approving a second distinct application built on the unchanged core. The cheapest honest candidate is a "citation laundering" checker for news or research claims: articles citing articles that all trace to one press release. That reuses the engine, schema and viewer with a new dataset and labels. Until it exists, no category is a strong fit, and the submission should not claim one.

## Delivery gates (Phase 6 audit)
| Gate | State | Status |
|---|---|---|
| OSI licence | None (`package.json`: `UNLICENSED`) | **BLOCKER (owner)**. Recommendation: **Apache-2.0** (OSI-approved; explicit patent grant and contribution terms suit security tooling). MIT is the simpler alternative. Not added: needs owner approval |
| Repository visibility | Private (GitHub API) | **BLOCKER (owner)**: must be public at submission. Not changed |
| Project age | Repo created 2026-11-13, inside the 30 Oct – 4 Dec window | VERIFIED |
| Third-party / proprietary code | None; `bench/legacy/` holds only earlier ProofGap X snapshots from this repo's history | VERIFIED |
| Reproducibility | `npm ci && npm test`; `npm run validate:local` reruns tests plus both benchmarks and compares them with committed records | VERIFIED locally |
| CI | GitHub Actions **BLOCKED_BY_BILLING**; workflow preserved | Not run |
| Demo | Committed `viewer/showcase.html`; export is byte-identical to CLI output | VERIFIED (headless Chromium) |
| Video (< 3 min) | Outline in `docs/DEMO.md`; not recorded | **NOT DONE** |
| Kiro usage evidence | Agent sessions and Playwright Power only (see below); no spec workflow, hooks or steering | Weak for the Kiro-usage share of the Technology criterion |
| PRs | #1–#5 stacked, open, unmerged | Owner decision |

## Judging-readiness matrix (20% each)
| Criterion | Actual evidence | Missing proof |
|---|---|---|
| Potential Impact | 0.4.0: verified byte identity under `--evidence-dir` stops undeclared byte-identical copies from posing as corroboration (file-backed heldout3: 32/43 falsely asserted before, 0/43 after; declared FPR 0/479 unchanged). Detects false corroboration (echoed / derived / byte-identical evidence) and abstains on suspected hidden dependence; synthetic benchmark: 0/485 declared false corroborations vs 63/485 for ProofGap 0.1.0 and recall 312/312 vs 263/312 for 0.2.0 (heldout2) | No real users, no real or redacted cases, benchmark is author-built; undeclared copies without cues are still missed (37/88 caught) |
| Technological Implementation / Kiro usage | 0.3.0 engine (max-disjoint-root packing, per-claim locality, artifact entanglement, abstention), counterfactual planner validated by executing hypotheticals, 12 confirmed defects with regression tests, 147 local tests, deterministic outputs, offline CSP viewer verified in headless Chromium | Remote CI BLOCKED_BY_BILLING; Node 20 NOT TESTED; Kiro usage limited to agent sessions + Playwright Power (see below) — no specs workflow, hooks or steering |
| Design | Side-by-side viewer: graph with verified/declared/suspected/unknown edges, collapse counter, plan tables, text alternative, keyboard order checked, no horizontal overflow at 320/390/768/1400 px, CSP-locked | No usability testing, no screen-reader testing, graph layout is basic for large cases (>~40 nodes) |
| Innovation | Explicit four-way relationship basis; corroboration-denial resistant independence definition (monotone under added evidence); counterfactual plans computed by the same rule as the verdict; abstention as a first-class outcome | No literature comparison or external review of novelty |
| Presentation | `docs/DEMO.md` sub-3-minute outline on working features, committed showcase, README, threat model, benchmark doc | No video, no screenshots committed, no Devpost write-up |

## Kiro usage (only what actually happened)
- **Kiro Web agent sessions (Vibe mode)** implemented Phases 1–5 from the maintainer's written briefs. Spec documents in `.kiro/specs/phase1/` were written by the agent as ordinary files during those sessions — **not** produced through Kiro's spec workflow.
- **Playwright Power** (Kiro Power backed by a Playwright MCP server) was used in the Phase 5 and Phase 6 sessions (Phase 6: end-to-end export check, label and responsive re-checks) to load the viewer in headless Chromium: rendering, console/CSP errors, network requests, an XSS payload case, keyboard focus order, responsive widths, and screenshots (saved outside the repo).
- **Not used / not claimed:** hooks, steering files, custom agents, sub-agents, Kiro spec workflow, MCP servers other than the Playwright Power.
