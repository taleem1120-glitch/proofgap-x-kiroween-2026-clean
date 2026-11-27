# ProofGap X — Judge Brief

## One-sentence proposition

ProofGap X tests whether apparent agreement is genuinely independent: it traces declared provenance, detects byte-identical local artifacts when the analyst explicitly supplies an evidence directory, and explains missing support or abstention. One shared, domain-neutral core powers two distinct applications.

## The problem

A large number of documents, links or citations can repeat one underlying source. Counting documents or URLs can therefore overstate corroboration. Analysts and writers need a transparent way to inspect where support comes from, what relationships are declared, what has actually been checked, and where the tool must abstain.

## What is built

- **ProofGap X** — a digital-investigation evidence case viewer and analysis workflow.
- **ProofGap Cite** — a citation-provenance checker for written claims.
- **Shared core** — common validation, provenance analysis, classification, deterministic reports and rendering contracts. Applications use the stable `src/core.js` interface.

## What is technically distinctive

1. **Origin-aware analysis:** declared derivation and shared-origin relationships are traced rather than counting every document as a new origin.
2. **Observed artifact comparison:** when local evidence files are explicitly supplied, the tool hashes safely readable files and can identify byte-identical artifacts. A hash match establishes byte equality only; it does not establish authenticity or truth.
3. **Abstention and explicit uncertainty:** declared, suspected and unknown relationships are not silently promoted to verified facts. The system can withhold a positive decision when dependencies remain unresolved.
4. **Counterfactual guidance:** reports explain what additional independent evidence could change the assessment.
5. **Bounded, reproducible output:** input and file limits, deterministic reports, offline operation and regression tests are part of the implementation.
6. **Two applications, one core:** separate user-facing applications demonstrate reuse without conflating their domain language.

## How to reproduce the demo

Use a desktop browser around 1400 px wide. The examples are synthetic and fictional.

1. Open the [main landing page](https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/).
2. Open the ProofGap X investigation demo. Show the eight-document example collapsing to one declared/observed origin, then contrast it with the independent-systems example. Explain the assumptions behind unknown links.
3. Show the abstention example and its counterfactual plan.
4. Open ProofGap Cite. Show six citations that resolve to one origin, then circular reporting and unresolved origin examples.
5. Show the CLI check and its non-zero gap exit code only if the terminal is already prepared.
6. Close by showing the known limitations and the fact that all displayed case data is synthetic.

Detailed timed narration is in [DEMO.md](DEMO.md).

## Evidence of engineering validation

The repository CI covers Node 20 and 22, security and metamorphic regressions, generated adversarial text cases, source/license checks, reproducible browser assets and Playwright interactions. The responsive browser suite checks multiple viewport widths, keyboard and pointer selection, RTL locale switching, case authoring and Pixel 7 emulation.

Cross-engine Firefox and WebKit validation is being added separately; do not claim it has passed until its workflow is green. Automated browser tests are not a substitute for a human accessibility review or physical-device testing.

## Important limitations — say these plainly

- This is a research prototype, not forensic software and not independently validated.
- It does not determine whether a claim is true or false, whether evidence is authentic, or whether a person is guilty.
- Provenance relationships are only as complete as the information supplied. An author can omit or misstate a dependency.
- Byte-identical files are the same bytes, not necessarily the same source or chain of custody.
- Re-encoded or edited copies may not be detected.
- Large overlap components may use a conservative approximation and can under-count independent origins.
- Synthetic demonstrations do not prove real-world accuracy, market superiority or commercial readiness.

## Suggested judge evaluation

Please try both applications, change locale to Arabic, select graph nodes with the keyboard, export a report, and compare the displayed provenance basis with the underlying synthetic case. The central question is whether the tool communicates what is known, what is merely declared, and what remains unknown without overstating certainty.


## Kiroween scoring alignment

The five judging dimensions are weighted equally at 20%: Potential Impact, Technological Implementation, Design, Innovation/Idea, and Presentation. The detailed judge-visible evidence map, six engineering priorities, 2:50 run-of-show, factual Kiro-usage caveats, and release gate are maintained in [KIROWEEN_JUDGE_EXECUTION.md](KIROWEEN_JUDGE_EXECUTION.md). Use it as the final rehearsal and evidence checklist; it does not replace running the tests on the submitted commit.
