# Kiroween 2026 readiness (factual; prepared 13 Nov 2026)

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

## Category fit (tentative — official list NOT VERIFIED)
Secondary sources mention themed categories (e.g. Resurrection, Frankenstein, Costume Contest) and bonus prizes (e.g. Best Startup Project, Best Demo). ProofGap X is **not** a resurrection of old technology and has no Halloween-themed UI, so fit with themed categories is weak and should not be stretched. If the official rules include a general / startup / impact-oriented track, that is the best fit (evidence: working tool, measured benchmark, security tests). **Recommendation: owner verifies the official category list first; do not pick a category on this document alone.**

## Judging-readiness matrix (20% each)
| Criterion | Actual evidence | Missing proof |
|---|---|---|
| Potential Impact | Detects false corroboration (echoed / derived / byte-identical evidence) and abstains on suspected hidden dependence; synthetic benchmark: 0/485 declared false corroborations vs 63/485 for ProofGap 0.1.0 and recall 312/312 vs 263/312 for 0.2.0 (heldout2) | No real users, no real or redacted cases, benchmark is author-built; undeclared copies without cues are still missed (37/88 caught) |
| Technological Implementation / Kiro usage | 0.3.0 engine (max-disjoint-root packing, per-claim locality, artifact entanglement, abstention), counterfactual planner validated by executing hypotheticals, 12 confirmed defects with regression tests, 147 local tests, deterministic outputs, offline CSP viewer verified in headless Chromium | Remote CI BLOCKED_BY_BILLING; Node 20 NOT TESTED; Kiro usage limited to agent sessions + Playwright Power (see below) — no specs workflow, hooks or steering |
| Design | Side-by-side viewer: graph with verified/declared/suspected/unknown edges, collapse counter, plan tables, text alternative, keyboard order checked, no horizontal overflow at 320/390/768/1400 px, CSP-locked | No usability testing, no screen-reader testing, graph layout is basic for large cases (>~40 nodes) |
| Innovation | Explicit four-way relationship basis; corroboration-denial resistant independence definition (monotone under added evidence); counterfactual plans computed by the same rule as the verdict; abstention as a first-class outcome | No literature comparison or external review of novelty |
| Presentation | `docs/DEMO.md` sub-3-minute outline on working features, committed showcase, README, threat model, benchmark doc | No video, no screenshots committed, no Devpost write-up |

## Kiro usage (only what actually happened)
- **Kiro Web agent sessions (Vibe mode)** implemented Phases 1–5 from the maintainer's written briefs. Spec documents in `.kiro/specs/phase1/` were written by the agent as ordinary files during those sessions — **not** produced through Kiro's spec workflow.
- **Playwright Power** (Kiro Power backed by a Playwright MCP server) was used in the Phase 5 session to load the viewer in headless Chromium: rendering, console/CSP errors, network requests, an XSS payload case, keyboard focus order, responsive widths, and screenshots (saved outside the repo).
- **Not used / not claimed:** hooks, steering files, custom agents, sub-agents, Kiro spec workflow, MCP servers other than the Playwright Power.
