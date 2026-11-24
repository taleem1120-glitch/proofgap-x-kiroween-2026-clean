# External Review Outreach Pack — ProofGap X / ProofGap Cite

**Prepared:** 2026-11-24  
**Review target:** PR #44, branch `release/proofgap-final-gate-2026-11-24`  
**Exact candidate at preparation:** `d09ac993aeb232b79726eb482af077bdcd19a358`  
**Repository:** https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean  
**PR:** https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/44

## Purpose and guardrails

Obtain independent evidence for the three remaining release approvals without misrepresenting automated CI as a human audit.

- Do not describe this candidate as production-approved, certified, independently audited, or fully WCAG-conformant.
- Ask for eligibility, scope, availability, cost, sponsorship or pro-bono options before accepting any paid engagement.
- Do not agree to fees, contracts, public disclosure dates, or scope changes without maintainer approval.
- Reviewers must disclose conflicts of interest and identify the exact commit reviewed.
- Any code change after review invalidates the affected review evidence until the changed code is retested.

## Track A — Independent security review

### Preferred first route: OSTIF

OSTIF coordinates independent professional security audits for open-source projects and describes a process covering scope definition, auditor selection, audit, remediation, and publication of a report. Its public guidance says initial audits may range from USD 30,000 to USD 200,000 depending on complexity, while it has helped projects raise funds and source sponsors. Therefore, request an eligibility/scoping discussion and funding or sponsorship options first; do not assume a free audit or commit to a fee.

Intake: https://ostif.org/get-an-audit/

### Scope requested

1. Threat model and trust boundaries for the CLI, browser UI, imported evidence, generated reports, and local file handling.
2. Manual source review of input validation, parser boundaries, evidence provenance, claim-to-source linkage, and report generation.
3. Browser security review: CSP, DOM construction, local storage, download handling, URL handling, and dependency exposure.
4. Dependency and build/release supply-chain review, including GitHub Actions permissions, pinned actions, artifact integrity, and reproducibility.
5. Tests for malformed, adversarial, oversized, and contradictory evidence inputs; denial-of-service and unsafe file/path handling.
6. Review of security disclosure and remediation workflow.

### Required deliverables

- Reviewer identity, qualifications, independence/conflict disclosure, scope, and exact commit SHA.
- Findings with severity, reproducible steps, affected component, impact, and remediation.
- Explicit statement of what was not reviewed.
- Retest evidence and signed/attributed final report or written disposition.

### Draft inquiry

**Subject:** Independent security review and sponsorship eligibility — ProofGap X open-source project

Hello OSTIF team,

I maintain ProofGap X / ProofGap Cite, an open-source evidence-independence and provenance project. We have completed candidate-specific automated CI, Node 20/22 validation, reproducible showcase checks, Chromium/Firefox/WebKit tests, automated axe-core scans, and dependency/security regression checks.

We are seeking an independent professional security review rather than treating these automated checks as an audit. The current review candidate is commit `d09ac993aeb232b79726eb482af077bdcd19a358`:

- Repository: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean
- Draft release-gate PR: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/44
- Security review packet: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/release/proofgap-final-gate-2026-11-24/docs/INDEPENDENT_SECURITY_REVIEW_PACKET.md
- Privacy/data-flow notes: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/release/proofgap-final-gate-2026-11-24/docs/PRIVACY_AND_DATA_FLOW.md

Could you advise whether the project is eligible for OSTIF coordination, what scope you would recommend, and whether sponsorship, grant, or other funding support may be available? We cannot commit to an audit fee before understanding eligibility, scope, and funding options.

We can provide a reproducible candidate, documentation, CI evidence, and prompt maintainer support. We would welcome an initial scoping discussion.

Thank you.

## Track B — Human accessibility review

### Potential expert providers

NV Access specifically points people seeking professional website accessibility audits toward Intopia, Even Grounds, WebAIM, and Deque, and also points to NVDA Certified Experts. This is a list of potential providers, not a claim that any has agreed to review this project.

- Intopia: https://intopia.digital/
- Even Grounds: https://evengrounds.com/
- WebAIM: https://webaim.org/
- Deque: https://www.deque.com/
- NVDA Certified Experts: https://certification.nvaccess.org/
- NV Access free NVDA testing guidance: https://www.nvaccess.org/get-help/accessibility-testing-with-nvda-free-sample/

Ask first for a pro-bono, academic, reduced-scope, or community review option. Confirm whether the reviewer has lived experience using assistive technology and/or professional accessibility testing qualifications.

### Manual test scope

1. NVDA with Firefox and Chrome on Windows: page landmarks, heading order, names/roles/states, reading order, focus order, forms, errors, status announcements, and graph alternatives.
2. Keyboard-only operation: all actions, visible focus, logical order, no traps, modal/dialog behavior, and recovery after validation errors.
3. Zoom/reflow: 200% and 400% where applicable; no loss of information or functionality.
4. RTL/Arabic and LTR/English: reading order, labels, punctuation, mixed-direction identifiers, and language announcements.
5. Mobile screen-reader spot checks with TalkBack on Android and VoiceOver on iOS if devices are available.
6. Evidence graph and provenance path: meaningful non-visual equivalent, node selection and relationship comprehension without relying on color or pointer interaction.

### Required deliverables

- Tester identity/role, assistive technology and versions, operating system, browser, and exact commit SHA.
- Task-by-task results, barriers with reproducible steps, severity/impact, and supporting evidence that does not expose private case data.
- Explicit coverage limitations and retest results after fixes.
- Signed or attributed report; do not label a volunteer walkthrough as a formal certification.

### Draft inquiry

**Subject:** Request for independent human accessibility review — open-source ProofGap X

Hello,

I maintain ProofGap X / ProofGap Cite, an open-source evidence analysis and provenance interface. Our automated axe-core scans and browser interaction tests pass on Chromium, Firefox, and WebKit, but we have not yet completed human assistive-technology testing.

We are looking for an independent accessibility specialist and/or screen-reader user to evaluate the current candidate:

- Repository: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean
- Draft release-gate PR: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/44
- Accessibility protocol: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/release/proofgap-final-gate-2026-11-24/docs/ACCESSIBILITY_REVIEW_PROTOCOL.md
- Exact candidate: `d09ac993aeb232b79726eb482af077bdcd19a358`

The requested scope includes NVDA with Firefox/Chrome, keyboard-only use, zoom/reflow, Arabic RTL and English LTR, and a review of the evidence graph's non-visual equivalent. We can provide a test build and reproducible tasks using synthetic data only.

Would you consider a pro-bono, academic, community, or reduced-cost review? Please let us know your availability, relevant experience, expected deliverables, and any fee before we schedule anything.

Thank you.

## Review status register

| Gate | Current evidence | External action still needed |
|---|---|---|
| Independent security | Automated checks pass; review packet prepared | OSTIF eligibility/scoping and independent professional audit |
| Human accessibility | axe-core scans report zero blockers/advisories across three browsers | Human NVDA/keyboard/RTL/mobile evaluation and attributed report |
| Privacy/data flow | Source-based engineering notes prepared | Deployment-specific review of hosting/CDN, endpoints, backup/retention, legal basis, and owner approval |

## Decision

Keep PR #44 in Draft and maintain NO-GO for production. No external party has been contacted by this document, no fee has been accepted, and no reviewer approval is claimed. The maintainer must submit the inquiries and approve any engagement.