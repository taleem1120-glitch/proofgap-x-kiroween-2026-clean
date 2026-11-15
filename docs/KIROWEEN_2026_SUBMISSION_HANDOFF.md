# Kiroween 2026 — release and submission handoff

**Status:** This is a submission-ready *draft*, not proof of a completed Devpost submission or published YouTube video.

## Official competition requirements (verified 2026-11-15)
- Category: **Skeleton Crew** (a reusable skeleton + **two distinct applications in separate repository folders**)
- Build with authentic Kiro usage; keep `.kiro` directory tracked at repository root; explain concrete Kiro features honestly.
- Public GitHub repository with a detectable open-source license; working demo or test build freely accessible to judges.
- Public YouTube demo **under three minutes**, with real functionality on the target platform.
- Competition deadline **December 4, 2026, 2:00 p.m. PST** (**December 5, 2026, 1:00 a.m. Baghdad**).
- Judging: Potential Impact, Technological Implementation with Kiro, Design, Innovation/Idea, Presentation (20% each).
- Official source: https://kiroween.devpost.com/rules

## Links for the entry
- Repository: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean
- App landing: https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/
- ProofGap X investigation demo: https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/viewer/showcase.html
- ProofGap Cite: https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/apps/proofgap-cite/showcase.html
- Test instructions: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/main/docs/JUDGES_QUICKSTART_2026.md
- Kiro audit: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/main/.kiro/KIRO_USAGE.md
- YouTube: **TO RECORD, PUBLISH AND VERIFY**; never invent a URL.
- Devpost submission: **TO COMPLETE AND VERIFY**.

## Suggested project title
**ProofGap X — Detect Evidence Echoes, Find the Missing Independent Source**

## Short English pitch (accurate scope)
Ten reports can appear to agree while quietly relying on the same original source. ProofGap X is a reusable, offline-first evidence-dependency analysis core with two working applications. ProofGap X investigates structured case evidence, explains declared independence and abstains when provenance is uncertain. ProofGap Cite audits research references, surfaces circular citation chains and suggests missing corroboration. Both generate transparent reports using fictional demonstration data. A separate optional text resemblance audit flags near-copy text for human review, not verified source ancestry.

## 2:45 video storyboard (real screen recordings, no mock results)
- 0:00–0:18: problem — ten reports, one origin; explain audience.
- 0:18–0:58: open ProofGap X, show collapse of dependent sources, integrity caveat and what evidence is missing.
- 0:58–1:27: show a contrasting independently sourced case and abstention.
- 1:27–2:08: open ProofGap Cite, demonstrate a copied press release and a citation cycle; export actual JSON.
- 2:08–2:28: open public GitHub CI results; show 212 passing unit tests per runtime (current evidence) plus both working demos, not a real-world detection score.
- 2:28–2:45: show factual `.kiro/KIRO_USAGE.md`, specs and actual Kiro usage. End with the tagline: **Count independent origins, not repeated reports.**

Avoid tiny mobile text and app browser bars in the **edited** video; preserve authenticity of UI behavior and results. No unauthorized logos, copyrighted music or personal evidence.

## Release verification checklist
- [x] Public repository, Apache-2.0, tracked `.kiro`, two app folders
- [x] Main branch CI passed Nov 15, 2026, commit `e643dc13`
- [x] GitHub Pages deploy passed, run 43750069480
- [x] Owner-provided mobile screen recordings of both app views and a JSON export
- [ ] Current final hardening PR reviewed, merged, and CI passed on main
- [ ] Judge accessibility independently rechecked after final deployment
- [ ] Final video published publicly on YouTube, <3 min, link recorded
- [ ] Devpost submission marked Submitted, with correct Skeleton Crew category
- [ ] External security audit/independent blinded field trial (commercial certification only; **not** prerequisite claimed by rules)

## Disclosure
Synthetic performance and generated-fixture scores are **NOT** independent evidence of commercial superiority. This is a prototype, not a forensic acquisition platform. No ATHARNEX or EvidenceForge X proprietary code has been copied into this repository in this finalization round.
