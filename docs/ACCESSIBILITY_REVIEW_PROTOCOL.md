# ProofGap X / ProofGap Cite — Accessibility Review Protocol

**Status:** automated checks are wired into CI; human assistive-technology review is NOT COMPLETED. This protocol is the required evidence record for an independent human review.

## Scope

Review these four user-facing pages from the same candidate commit:

- `index.html` — product landing and application navigation.
- `viewer/showcase.html` — ProofGap X report viewer.
- `apps/proofgap-cite/showcase.html` — ProofGap Cite report viewer.
- `tools/case-builder.html` — case creation, local analysis and JSON export.

The existing Playwright suite checks responsive layouts, graph-node pointer/keyboard selection, language/RTL switching and case-builder interactions across Chromium, Firefox and WebKit. The additional axe-core scan checks WCAG 2.0/2.1 A/AA and best-practice rules. Neither automated suite is a substitute for human testing with assistive technology.

## Automated CI gate

The cross-browser workflow runs `scripts/e2e-accessibility.cjs` against all four pages in Chromium, Firefox and WebKit. Critical/serious axe findings and structural checks fail the job. Moderate/minor findings are emitted as advisory findings and must be triaged before a public production claim. Store the JSON output with the candidate SHA.

## Human test environment

Record exact versions and settings; do not write "tested" without these details.

| Environment | Required checks |
|---|---|
| Windows + NVDA + Firefox | Full keyboard-only journey, headings/landmarks, form labels/errors, graph controls, live announcements, report export |
| Windows + NVDA + Chrome | Repeat critical flows and compare announcements |
| macOS + VoiceOver + Safari | Rotor navigation, headings/landmarks, forms, graph node names and selection, live regions |
| Android + TalkBack + Chrome | 320–430 CSS px layouts, navigation order, control names, focus visibility, language switch and RTL |
| Keyboard only (no screen reader) | No keyboard traps; visible focus; logical order; all actions available without pointer |
| Zoom/reflow | 200% and 400% zoom; text spacing; no page-level horizontal scrolling at 320 CSS px except intentionally scrollable graph/table regions |
| Preferences | Reduced motion, forced/high contrast where available, dark-mode legibility |

## Task scripts

1. Open the landing page; identify the page title, main landmark, both applications and case builder.
2. Open each report viewer. Navigate by headings and landmarks. Inspect every filter, file chooser, language selector, export control and graph node using keyboard only.
3. Select graph nodes using Enter and Space. Confirm the selected node and related edges are announced; verify the trace panel updates without losing focus.
4. Load the synthetic example report, change filters and language, and export the JSON report. Confirm status changes are announced once and are not overly verbose.
5. In the case builder, create a case with two sources, one claim and one evidence item. Add/remove rows, trigger validation errors, run analysis, export input JSON and export report JSON. Confirm labels, instructions, errors and status are announced.
6. Switch to Arabic and Persian RTL. Check reading order, punctuation, identifiers, mixed-direction values, focus order and graph labels. Confirm language metadata updates.
7. Repeat on a narrow mobile viewport, at 200%/400% zoom and with reduced motion.
8. Record every failure with page, browser/AT version, exact steps, expected result, actual result, severity, screenshot or sanitized recording, issue ID and retest result.

## Acceptance criteria

- No critical or serious WCAG 2.1 A/AA blockers remain open.
- Every control has a programmatic accessible name, role, state and value.
- All functionality is keyboard operable with visible focus and no trap.
- Focus order follows the visual/task order; focus is not lost after updates.
- Dynamic result/error/status changes are announced appropriately.
- Headings and landmarks form a usable document structure.
- Graph relationships have an equivalent text-based inspection path; colour is not the only means of communicating status.
- Text contrast, focus contrast, reflow and target size meet the selected WCAG 2.1 AA criteria.
- RTL and translated controls remain understandable and operable.
- Findings are retested and signed by the human reviewer.

## Human review record — do not pre-fill as passed

- Candidate commit SHA:
- Reviewer name / organisation:
- Date and time:
- Assistive technology and version:
- Browser / OS and version:
- Pages and tasks completed:
- Critical / serious findings:
- Moderate / minor findings:
- Issue links and dispositions:
- Retest evidence:
- Reviewer conclusion: PASS / CONDITIONAL / FAIL
- Reviewer sign-off:

**Current disposition:** NOT EVIDENCED. Automated CI and this protocol do not count as human screen-reader testing.
