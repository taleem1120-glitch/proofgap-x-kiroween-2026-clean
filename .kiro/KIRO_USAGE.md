# Kiro usage log (factual)

Every entry below happened. Nothing here is claimed that is not listed. Update this file only with things that actually happened.

## How ProofGap X was built
All code, tests, docs and benchmarks were written by the Kiro agent in **Kiro Web, Vibe mode** sessions (13–14 Nov 2026), working from the maintainer's written phase briefs. The agent ran the tests and benchmarks in the Kiro sandbox and pushed branches and pull requests through the sandbox's `git`/`gh` tooling.

| Kiro capability | Used? | Evidence |
|---|---|---|
| Agent sessions (Vibe mode) | **Yes**, Phases 1–9 and 11. There was no Phase 10 session | git history (`feature/phase*` branches, PRs #1–#7) |
| Specs (`.kiro/specs/proofgap-x/`) | **Yes, as files.** The agent wrote and updated `requirements.md`, `design.md`, `tasks.md`, `acceptance.md` alongside the code in every phase | the files and their git history |
| Kiro spec workflow (requirements → design → tasks UI, task execution) | **No** | — |
| Steering (`.kiro/steering/proofgap-x.md`) | **Added in Phase 7.** Records the rules earlier phases followed; it did not guide Phases 1–6. Its two-application section was added in Phase 11. It is **not** claimed that the Kiro sessions loaded it: they ran with the workspace root one folder above this repository, so the agent followed the same rules from the written briefs | file header |
| Powers | **Yes:** the **Playwright Power** (headless Chromium via its Playwright MCP server) in Phases 5–9 and 11 | see below |
| MCP servers other than the Playwright Power's | **No** | — |
| Hooks | **No** | — |
| Sub-agents / custom agents / Kiro Crew | **No** | — |

## What the Playwright Power was used for
- **Phase 5:** loaded `viewer/showcase.html` and an XSS test page. It read console/CSP messages and network requests, checked keyboard order and responsive widths, and took screenshots (stored in session artifacts, not committed). It found two real viewer defects, both fixed and re-checked: glyphs rendering as boxes, and a 28 px horizontal overflow at 390 px.
- **Phase 6:** clicked "Export report JSON" in both panels; the downloads were byte-identical to CLI output. Re-checked graph labels and widths, and found one truncated label, which was fixed.
- **Phase 7:** loaded reports through the file picker (two valid; one non-report and one broken file, both rejected with a reason). Checked Enter on the export button and on disclosure widgets, and checked 320 px width. No defect found.

- **Phases 8–9:** served the showcase from a simulated GitHub Pages origin (route interception); offline-mode load and export checks.
- **Phase 11:** loaded the new ProofGap Cite showcase offline: verdict badges, "What is missing" lists, graph, and export (byte-identical to CLI JSON). Ran a hostile-note XSS page (no script ran, no element injected). Checked widths 320–1400 px for both showcases. This found one real defect, a 43 px horizontal overflow at 320 px caused by non-wrapping badges; it was fixed and re-checked.

## What was not done by Kiro features
Defects D1–D13 were found by tests and probes the agent wrote, not by any dedicated Kiro feature. Node 20, 22 and 24 were run from versions already installed in the sandbox (Phase 7), not through Kiro.
