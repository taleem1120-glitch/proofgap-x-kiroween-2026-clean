# Kiroween 2026 — Submission Refresh Pack

**Purpose:** provide accurate, copy-ready material for updating the existing ProofGap X submission. This is an update pack, not a second submission and not evidence that the Devpost form has been edited.

## Existing submission

- Competition: Kiroween 2026
- Submitted title: **ProofGap X — Evidence Independence & Provenance**
- Submission receipt: previously confirmed by Devpost email.
- Editable until: **4 December 2026, 2:00 PM PST** (as shown in the user's submission history).
- Category recorded in the prior submission workflow: **Skeleton Crew**.
- Do not create a duplicate submission. Update the existing entry only.

## Recommended title

**ProofGap X — Evidence Independence & Provenance**

## Short description

ProofGap X helps investigators and researchers test whether apparent corroboration comes from genuinely independent evidence origins. It traces declared source relationships, identifies byte-identical local evidence copies when explicitly supplied, exposes missing provenance, and abstains when support cannot be established. Its companion application, ProofGap Cite, applies the same core to citation lineage and saved source copies. It runs locally/offline and produces reproducible reports. All demo data is synthetic; the tool does not determine truth, authenticity, guilt, or legal admissibility.

## Extended project description

### The problem
A large number of documents, URLs, screenshots, or citations can repeat one underlying source. Counting items can therefore exaggerate corroboration. Reviewers need to understand where support originates, which relationships are declared, what has actually been checked, and what remains unknown.

### The solution
ProofGap X is a local evidence-independence analysis prototype with two separate applications powered by one versioned core:

- **ProofGap X:** analyses structured evidence cases, traces declared derivation/shared-origin relationships, optionally hashes supplied local evidence files to find byte-identical copies, identifies support gaps, and produces counterfactual evidence plans.
- **ProofGap Cite:** reviews Markdown footnote citations and explicitly saved source copies to surface citation loops, repeated origins, byte-identical files, bounded text-overlap cues, and unresolved provenance.

The system distinguishes verified byte equality, declared relationships, suspected review cues, and unknown relationships. It can abstain instead of treating uncertainty as corroboration. Reports are deterministic and the demonstrations can be opened offline.

### What judges can reproduce
1. In the ProofGap X showcase, eight supporting items collapse to one independent origin in the fictional badge-export example.
2. In the contrasting example, multiple systems are shown with their declared assumptions; an ambiguous claim abstains.
3. In ProofGap Cite, six citations resolve to one origin; other examples show circular reporting, unresolved origin, abstention, and unsupported claims.
4. Export the report JSON and compare it with the engine output.

### Engineering evidence
The recorded candidate CI evidence includes Node 20/22 tests, clean-checkout validation, deterministic rebuilds of both showcases, responsive browser checks across Chromium/Firefox/WebKit, automated axe-core WCAG 2.0/2.1 A/AA checks, and dependency/security regression checks. The run records and exact candidate SHA are listed in `docs/CI_STATUS.md` and PR #44. Re-run evidence is required for any later code-changing candidate.

### Honest limitations
- This is a research/prototype tool, not a forensic acquisition suite or production-approved forensic product.
- It does not determine truth, authenticity, authorship, chain of custody, guilt, intent, or legal admissibility.
- Provenance analysis is limited by information supplied by the case author; hidden or misstated common origins cannot always be discovered.
- SHA-256 matching establishes byte equality only, not authenticity or common real-world origin.
- Re-encoded, edited, paraphrased, translated, cropped, OCR-transformed, or otherwise altered copies may evade byte matching; bounded text cues are review prompts, not proof.
- Benchmarks are synthetic and author-generated, not independent or real-world accuracy validation.
- Independent security review and human assistive-technology review have not been completed. Deployment-specific privacy-owner approval remains open.
- Do not claim enterprise readiness, certification, independent audit, customer deployment, or real-world accuracy.

## Links to use in the existing submission

- Public repository: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean
- Live demo: https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/
- Existing demo video: https://youtu.be/Amn78mLgUQ4
- Judge brief: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/release/proofgap-final-gate-2026-11-24/docs/JUDGE_BRIEF.md
- Judge execution/evidence matrix: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/release/proofgap-final-gate-2026-11-24/docs/KIROWEEN_JUDGE_EXECUTION.md
- Benchmark limitations/results: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/release/proofgap-final-gate-2026-11-24/docs/BENCHMARK.md

## Submission update checklist

- [ ] Open the existing Devpost/Kiroween submission; do not create a second entry.
- [ ] Confirm the current repository URL, live demo URL, and video still open.
- [ ] Replace the description with the text above; preserve the existing title unless the platform requires a change.
- [ ] Verify the video remains within the event's duration limit and demonstrates only functionality actually shown.
- [ ] Verify the public repository contains the exact code corresponding to the submitted demo. Do not point judges to an unmerged branch as though it were the deployed public version.
- [ ] Reconcile the exact commit SHA used by the live demo, repository and final video. If the Pages demo still serves a different branch/commit, disclose that and do not imply the Draft PR candidate is deployed.
- [ ] Save the updated submission and verify the platform shows the existing entry as submitted/updated.

**Important:** this file does not update Devpost itself. The existing submission page must be opened and saved through the authenticated competition account. If the page's current fields differ from this pack, preserve the platform's actual field structure and do not invent missing data.
