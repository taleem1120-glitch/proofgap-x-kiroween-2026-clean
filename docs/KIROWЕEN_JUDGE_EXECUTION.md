# Kiroween 2026 — Judge Execution & Evidence Matrix

Status: competition-facing acceptance plan for the existing ProofGap X / ProofGap Cite implementation. This document does not claim new test results, independent validation, or unperformed Kiro features.

## The central proposition

**ProofGap X measures independence of evidence origins, not the number of documents.** It exposes when apparent corroboration is a citation loop, a derivative chain, a shared-origin group, or a byte-identical local artifact. When the available information cannot distinguish genuine independence from an echo, it reports uncertainty or abstains instead of manufacturing certainty.

The product is a research prototype for inspecting the *structure of support under declared provenance*. It does not decide truth, authenticity, guilt, or legal admissibility.

## Five judge criteria — 20% each

| Criterion | What judges should see | Concrete proof in the repository | What must not be claimed |
|---|---|---|---|
| Potential Impact (20%) | A realistic evidence-review failure: many documents repeat one origin and create false corroboration. Show both investigative evidence and written citations. | viewer/showcase.html (8 items → 1 origin); apps/proofgap-cite/showcase.html (6 citations → 1 origin); docs/DEMO.md. | Do not claim deployed use by police, banks, courts, or customers; all showcase data is synthetic. |
| Technological Implementation (20%) | One versioned core, bounded validation, provenance graph, deterministic output, local byte checks, offline viewer, abstention, and counterfactual evidence planning. | src/core.js; src/analyze.js; src/independence.js; src/integrity.js; src/planner.js; test/; docs/THREAT_MODEL.md; docs/BENCHMARK.md. | Do not call declared provenance verified. A byte hash proves byte equality only. Do not describe synthetic benchmark results as real-world accuracy. |
| Design (20%) | A judge can understand the finding, inspect why sources were grouped, navigate graph relationships, change locale to Arabic, use keyboard controls, and export a report. | Both offline showcases; language selector; graph trace panel; test/viewer.test.js; browser test suite where present. | Do not claim a human accessibility audit or physical-device testing unless separately completed. |
| Innovation / Idea (20%) | The differentiator is not another document counter: it separates item count, declared origin lineage, observed byte identity, heuristic cues, and unknown provenance; it can abstain. | src/analyze.js; src/independence.js; src/gaps.js; src/planner.js; adversarial, regression and metamorphic tests. | Do not say the system detects every paraphrase, translation, re-encoded copy, or hidden common source. |
| Presentation (20%) | A concise end-to-end story: deceptive case → explainable collapse → contrasting independent case → abstention → missing-evidence plan → Cite use case → limitations. | Timed 2:50 narration in docs/DEMO.md; this matrix; docs/JUDGE_BRIEF.md. | Never imply a demo or CI run passed unless it was observed on the exact submitted commit. |

## Six engineering priorities translated into judge-visible proof

### 1. Independence must be inspectable
Show the eight-document case. Open the claim and trace the source/evidence relationships. Explain the distinction between declared derivation or shared origin; byte-identical local artifacts (verified as byte equality only); suspected relationships (review cues, not proof); and unknown relationships (not established).

A missing provenance declaration is not evidence of independence.

### 2. False corroboration must be adversarially tested
Use the existing adversarial, regression and metamorphic suites. Explain the bridge-source case: a source derived from two originals must not silently merge those two originals into one origin. Explain why duplicate artifacts must retain both supporting and contradicting links.

Do not modify benchmark truth labels or reuse the held-out split for tuning. The held-out benchmark is a one-time evaluation after a code freeze. Any future detector change requires a new, separately generated held-out set and transparent disclosure.

### 3. Abstention must be a first-class outcome
Show the alarm-off example. Distinguish the hard classification (status) from the operational decision (decision). Explain that the system can preserve the hard status while withholding a positive decision when a review cue indicates possible undeclared dependence.

### 4. Robustness must be measurable and honestly bounded
Use the committed benchmark tables, including per-scenario errors. Explicitly call out:
- byte-identical undeclared copies can be detected when the local files are supplied;
- re-encoded reposts remain a known false-positive mode in the Cite held-out benchmark;
- indistinguishable undeclared-independent and undeclared-echo cases both remain unresolved;
- the data is synthetic and author-built, so it validates implementation against a declared test model, not real-world performance.

### 5. Kiro workflow evidence must be factual
The current .kiro/KIRO_USAGE.md records:
- Specs were maintained as files, but the Kiro spec workflow UI was not used;
- Steering was added in Phase 7 and did not steer Phases 1–6;
- Playwright Power was used in later phases;
- Hooks were not used.

Therefore, **do not claim Hooks, Kiro spec workflow, or Steering-guided execution were used historically**. If the team uses Kiro before submission to add and execute a real hook and run the formal spec workflow, record the exact action, files, and observed output in .kiro/KIRO_USAGE.md before showing it to judges. A configuration file alone is not proof that a hook executed.

### 6. The end-to-end experience must be reproducible
Open the committed offline showcase pages from the repository. Export each report and, if showing CLI parity, compare the export with the CLI output from the same input. The two applications share only src/core.js; they must remain separate applications and must not import each other's code.

## Recommended 2:50 judge run

| Time | Action | One sentence to say |
|---|---|---|
| 0:00–0:15 | State the problem and show repository structure | “Eight documents can still be one origin; ProofGap measures origins, not volume.” |
| 0:15–0:55 | App 1 deceptive case, open graph trace | “Eight supporting items collapse to one origin; the graph shows why, and which relationships are only declared.” |
| 0:55–1:15 | Independent case and alarm-off abstention | “The engine can support, contradict, or abstain; the counterfactual plan identifies what additional evidence could change the assessment.” |
| 1:15–1:55 | ProofGap Cite line 6 and line 8–10 | “Six citations can be one source; circular and unresolved lineage are surfaced instead of counted as corroboration.” |
| 1:55–2:20 | Arabic locale, keyboard graph selection, export | “The reviewer can inspect the provenance basis, use Arabic, and export the deterministic report.” |
| 2:20–2:40 | Show tests / benchmark record, not a live unverified CI claim | “The committed tests cover adversarial and order-invariance cases; the benchmark also documents where the system fails.” |
| 2:40–2:50 | Show limitations | “This is not a truth detector or a substitute for investigators; uncertainty is an explicit output.” |

## Release gate — no submission claim without evidence

- [ ] Run npm ci and npm test on the exact candidate commit; save the full output and environment.
- [ ] Run npm run validate:local; inspect every group and all three benchmark reproducibility checks.
- [ ] Rebuild both showcases from their source commands and verify the committed generated files are byte-identical to fresh output. Do not hand-edit generated HTML.
- [ ] Run the browser suite on the exact candidate commit; inspect console errors, failed requests, keyboard path, RTL and narrow viewport overflow.
- [ ] Confirm no external network requests from either offline showcase and no unsafe rendering of hostile text.
- [ ] Check licence, repository visibility, submission links, video length, and exact commit hash.
- [ ] Record GitHub Actions status accurately. Billing-blocked means not started; it is neither a code failure nor a CI pass.
- [ ] Record Kiro Specs / Steering / Hooks evidence accurately. Never retrofit claims about earlier work.
- [ ] Keep the held-out benchmark frozen; do not tune against it.
- [ ] Obtain independent security/accessibility review where possible; if unavailable, disclose it.

## Current limitations to disclose

- Provenance is only as complete as the supplied declarations.
- Byte identity does not establish authenticity, custody, or a shared real-world origin.
- Re-encoded, paraphrased, translated, cropped, or OCR-transformed copies may evade byte matching.
- Similarity cues are bounded review signals, not proof of copying.
- The benchmark is synthetic and author-built; no real-world accuracy, legal admissibility, or commercial-readiness claim is established.
- Independent third-party security review and human accessibility review have not been completed.

## Definition of done for this competition

The candidate is ready to submit only when the release gate is checked against one immutable commit, both demos are reproducible, every visible claim is backed by a test or artifact, all known limitations are disclosed, and the final video demonstrates the product rather than slides alone.
