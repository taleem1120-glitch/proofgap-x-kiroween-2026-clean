# Cross-device test matrix

This checklist is for validating the judge-facing ProofGap X pages before release. CSS contract tests are necessary but do not replace real browser testing.

## Pages in scope

- `/` — project landing page and application navigation
- `/viewer/showcase.html` — ProofGap X investigation
- `/apps/proofgap-cite/showcase.html` — ProofGap Cite
- `/tools/case-builder.html` — local case builder

## Viewport matrix

Test each page at these CSS viewport widths:

| Class | Width | Height | Expected layout |
|---|---:|---:|---|
| Narrow phone | 320 | 700 | Single column; no page-level horizontal overflow |
| Phone | 360 | 800 | Single column; controls wrap or stack |
| Large phone | 430 | 900 | Single column; readable cards and forms |
| Tablet portrait | 768 | 1024 | Flexible columns where space permits |
| Small laptop | 1024 | 768 | No clipped navigation or controls |
| Desktop | 1440 | 900 | Balanced multi-column layout |
| Presentation display | 1920 | 1080 | Content remains centered and readable; no excessive line length |
| High-resolution display | 2560 | 1440 | Content max-width remains controlled |

Also test landscape orientation on a phone and tablet, browser zoom at 200%, and text-only zoom where supported.

## Functional checks at each representative size

### Landing page
- Language selector remains visible and usable.
- Both application links and the case-builder link remain reachable.
- Cards do not overlap, clip, or force page-level horizontal scrolling.
- Keyboard focus is visible on links and selector.

### ProofGap X and ProofGap Cite
- All top controls remain reachable and wrap cleanly.
- Evidence cards and findings remain readable.
- Wide provenance diagrams scroll within their own container; they do not widen the entire page.
- Wide tables scroll within their own container and retain headers and cell content.
- Graph nodes remain keyboard reachable; Enter and Space selection works.
- Selecting a node highlights its direct relationships and exposes the relationship trace.
- Language direction changes correctly between LTR and RTL.
- Export and disclosure controls remain visible and operable.

### Case builder
- Navigation links wrap instead of overlapping.
- Inputs, selects, and text areas fit their fieldsets.
- Add-source, add-claim, add-evidence, analyze, and export controls remain reachable.
- Generated output wraps long identifiers and does not create page-level overflow.
- Arabic layout uses RTL while machine identifiers remain legible.

## Pass/fail rules

A viewport passes only when:
1. No required content or control is clipped or hidden.
2. No page-level horizontal scrolling is needed for ordinary text or controls.
3. Intentional horizontal scrolling is confined to wide diagrams or tables.
4. Keyboard focus and activation remain usable.
5. The page remains understandable in both Arabic RTL and English LTR.

## Evidence to retain

For every failure, record the page, viewport width and height, browser/version, language/direction, steps to reproduce, and a screenshot. Do not mark a browser/device combination as passed based only on source inspection or a screenshot from another viewport.

## Current validation status

The automated responsive contract test checks source-level viewport declarations, breakpoints, shrinkable layouts, and local overflow containers. It is not a Playwright or real-device end-to-end test. The matrix above remains open until actual browser runs and screenshots are recorded.
