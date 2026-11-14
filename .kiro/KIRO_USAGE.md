# Kiro usage log (factual)

- Phases 1–3 were implemented by the AI agent in Kiro Web (Vibe mode) sessions, working from the maintainer's written briefs. Spec files in `.kiro/specs/phase1/` were written during those sessions, together with (not before) the code.
- No Kiro hooks, steering files or MCP servers have been configured or exercised. No Kiro spec-workflow UI execution is claimed.
- Phase 3: the agent invoked no sub-agents. Defects D1–D8 were found by tests the agent wrote, not by any Kiro-specific feature.

- Phase 5: the agent used the **Playwright Power** (a Kiro Power backed by a Playwright MCP server) to load `viewer/showcase.html` and an XSS test page in headless Chromium, read console/CSP messages and network requests, test keyboard order and responsive widths, and take screenshots (saved under the session artifacts folder, not committed). This found two real viewer defects (missing glyphs rendering as boxes; 28 px horizontal overflow on a 390 px screen) that were then fixed and re-checked.
- Phase 5: no sub-agents, hooks, steering, custom agents or Kiro spec workflow were used.
- Phase 6: the agent used the Playwright Power again to click "Export report JSON" in both showcase panels; the downloaded files were byte-identical to CLI output. It also re-checked graph labels and responsive widths. No sub-agents, hooks, steering, custom agents or spec workflow were used.

Update this file only with things that actually happened.
