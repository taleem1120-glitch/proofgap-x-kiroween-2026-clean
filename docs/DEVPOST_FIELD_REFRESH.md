# Devpost field-by-field refresh — ProofGap X

Use these answers in the **existing** Devpost project page:
https://devpost.com/software/proofgap-x-evidence-independence-provenance

This is copy-ready text based on the public page and repository evidence reviewed on 27 November 2026. It does not claim that Devpost has been edited.

## What it does

ProofGap X helps reviewers test whether apparent agreement comes from independent evidence origins or from repeated copies of the same underlying source. It traces declared source relationships, detects byte-identical files when the reviewer explicitly supplies local evidence copies, surfaces missing provenance, and can abstain when independence is uncertain.

The project contains two separate applications built on one reusable core:

- **ProofGap X** analyses structured digital-investigation cases and produces an explainable provenance graph, findings, integrity observations, and counterfactual evidence plans.
- **ProofGap Cite** reviews Markdown citations and explicitly saved source copies to identify citation loops, repeated origins, unresolved sources, byte-identical copies, and bounded text-overlap review cues.

Both applications run locally/offline and produce deterministic reports. A hash match proves byte equality only. The tool does not decide whether evidence is authentic or a claim is true.

## How we built it

The initial implementation was developed iteratively in Kiro Web Vibe sessions using written phase briefs and a versioned shared core. The repository contains requirements, design, tasks, and acceptance documents as files in the `.kiro/specs/` directory. We used the Playwright Power for browser interaction, responsive, offline, and regression checks.

The project has two application folders that import only the shared `src/core.js` interface. Node.js tests cover validation, provenance relationships, integrity handling, deterministic reports, security regressions, and adversarial/metamorphic cases. Browser workflows cover both showcases, keyboard interaction, responsive layouts, locale/RTL switching, and report export.

Later integration, publication and documentation work also used ChatGPT-assisted GitHub changes; these are not claimed as Kiro actions.

**Kiro-use transparency:** we did not use Kiro's spec workflow UI, agent hooks, custom agents, Kiro Crew, or other MCP servers. The steering file was added in Phase 7 and was not loaded by earlier sessions. The Playwright Power was used in later phases. See `.kiro/KIRO_USAGE.md` for the factual record. Do not claim features that were not used.

## Challenges we ran into

The hardest problem was separating the number of documents from the number of independent origins. Derivative sources, bridge sources, circular citations, and repeated files can make weak support look stronger than it is. We also had to keep declared provenance separate from observed byte equality and heuristic review cues.

Another challenge was making uncertainty visible. A missing relationship is not proof of independence, and an ambiguous case should not be forced into a confident result. We added explicit abstention, bounded analysis, deterministic output, safe local-file handling, and limitations in the reports.

A remaining limitation is that re-encoded, edited, translated, paraphrased, cropped, or OCR-transformed copies may evade byte matching or bounded text cues. Hidden or misstated provenance also cannot always be inferred.

## Accomplishments that we're proud of

- One reusable, versioned core supports two genuinely distinct applications.
- Eight apparently corroborating items collapse to one origin in the synthetic ProofGap X showcase.
- Six citations collapse to one origin in the synthetic ProofGap Cite showcase.
- The analysis distinguishes declared relationships, locally verified byte equality, heuristic review cues, and unknown relationships.
- Ambiguous support can lead to abstention, with an explanation of what additional evidence could change the result.
- The project includes deterministic reports, offline showcases, bounded input/file handling, and reproducible test workflows.
- Exact deployed main CI and publication verification passed. Fifteen public files matched the source bytes, and four excluded-path probes passed. Both showcase reports were exported on a physical Android phone. [Release evidence](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/pull/45#issuecomment-7227417351).
- Recorded candidate CI passed Node 20/22 tests, showcase reproducibility, Chromium/Firefox/WebKit browser checks, automated axe-core scans, and dependency/security regression checks. These are automated results, not an independent security audit or human accessibility certification.

## What we learned

Evidence volume is not the same as independent corroboration. Provenance assumptions must be visible, and uncertainty should be reported rather than hidden. A byte hash is useful for identifying identical bytes, but it cannot establish authenticity, authorship, custody, or truth. We also learned to publish benchmark errors and limitations rather than treating synthetic test performance as real-world accuracy.

## What's next for ProofGap X — Evidence Independence & Provenance

The next stage is independent security review, human assistive-technology testing, deployment-specific privacy review, and representative user evaluation. We will address any verified findings and rerun the affected tests on the exact candidate commit. We also plan to expand carefully controlled evaluation beyond synthetic data, with appropriate privacy and legal safeguards.

The project remains a research prototype and is not approved for production use. No independent security audit or human screen-reader review has been completed.

## Existing project links — verify each before saving

- Working application: https://taleem1120-glitch.github.io/proofgap-x-kiroween-2026-clean/
- GitHub repository: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean
- Demonstration video: https://youtu.be/Amn78mLgUQ4
- Judge brief: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/a8f98fe9f86f7053268d7fad28f249517c75aeec/docs/JUDGE_BRIEF.md
- Benchmark: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/a8f98fe9f86f7053268d7fad28f249517c75aeec/docs/BENCHMARK.md
- Kiro usage log: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/blob/a8f98fe9f86f7053268d7fad28f249517c75aeec/.kiro/KIRO_USAGE.md

## Critical checks before publishing the update

1. Confirm the GitHub Pages app still loads and demonstrates the exact features described.
2. Verified deployed source: `a8f98fe9f86f7053268d7fad28f249517c75aeec`; [publication run](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/46061739240). Recheck access before saving.
3. Keep the current public demo video only if it still accurately shows the current public build and remains under the hackathon's three-minute judging limit.
4. Keep the factual Kiro usage disclosure above. Do not add claims about Hooks, Kiro spec workflow UI, Kiro Crew, custom agents, MCP, or property-based testing.
5. Save changes to the existing Devpost entry and verify its update status. Do not create a duplicate entry.
