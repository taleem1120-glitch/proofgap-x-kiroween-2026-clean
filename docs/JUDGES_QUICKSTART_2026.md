# ProofGap X — judges' two-app testing guide (Kiroween 2026)

Category: **Skeleton Crew**. Version: prototype candidate; verify exact deployed commit and release before using a version number. Work was created during the competition submission period. All test data are invented; no real personal or police records.

## One skeleton, two distinct working applications

1. **ProofGap X:** offline evidence-dependency review. Input is structured JSON, optional saved files. Result is a claim-level report showing declared source independence, evidence integrity states, contradictory sources, abstention and what additional evidence could change the outcome.
2. **ProofGap Cite:** independent Markdown citation audit using the same versioned core. Input is a research note with footnotes and saved source copies; it detects citation loops, unresolved primary roots and repeated sources, and offers a line-numbered lint report.

Both apps use shared core interface `src/core.js`. See `apps/proofgap-x/` and `apps/proofgap-cite/`. These are separate input, workflow and output paths, not two reskinned HTML pages.

## Guided on-phone case analysis (new in the PR #6 release candidate)

From the landing page open `tools/case-builder.html`. Add sources, claims and evidence links; click **Analyze Locally / تحليل القضية على الهاتف**. This runs the same reusable ProofGap X analysis core in the browser and can download a full JSON report. Source ancestry and link strength are **user declarations**; this does not verify real-world provenance or extract files from a phone. The in-browser report has been checked for exact parity with the Node engine on synthetic cases. The browser bundle uses an MIT-licensed SHA-256 library, credited in `tools/THIRD_PARTY_LICENSES.md`.

**Deployment disclosure:** these functions belong to PR #6 until merged and verified on GitHub Pages; do not claim they are publicly available from `main` before checking a deployed release URL.

## Instant offline demonstration
Download the public GitHub repository using **Code → Download ZIP** and extract it. Open:
- `viewer/showcase.html` to inspect two fictional investigation scenarios side by side
- `apps/proofgap-cite/showcase.html` to inspect a fictional research note with six citations that share a source

These are **self-contained offline HTML files**, no account or internet access needed after downloading. A public hosted URL is a separate contest field and **not yet verified** in this document. The exported report corresponds to local CLI output.

## Repeatable CLI and tests
Prerequisite: Node.js 20+ on Linux. No runtime npm dependencies.
```bash
npm ci --ignore-scripts
npm test
node scripts/release-source-gate.js
node src/cli.js examples/showcase/deceptive.json --evidence-dir examples/showcase/evidence --format text
node apps/proofgap-cite/cli.js apps/proofgap-cite/examples/water-note.md --sources apps/proofgap-cite/examples/sources
node bench/text-copy-diagnostic.js
node bench/text-copy-performance.js
```
These commands must run from the extracted repository root. The two examples are synthetic and deterministic except timing measurements. Each demo starts from its own input data. The text resemblance feature is **experimental/advisory only**, never proof of a common origin.

## Technical evidence
- Latest reviewed PR #6 CI: 256 primary tests per runtime on Node.js 20/22, plus focused checks: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43834405939 (success). Use the exact final post-merge CI run as submission proof.
- Candidate browser smoke covering both apps, ten UI language options, mobile widths, and local phone analysis: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43834405682 (success).
- Candidate browser engine build reproducibility: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43834405561 (success).
- Earlier comparison: author-generated cases only, NOT a controlled comparison to commercial forensic vendors. See docs/BENCHMARK.md and docs/CI_COMPETITION_COMMERCIAL_EVIDENCE_2026-11-15.md.
- Current source-gate CI should be cited by exact successful run and commit **only after it completes**.

## Limitations we disclose openly
- A matching SHA-256 value establishes byte identity, not legal authenticity or source provenance.
- Provenance supplied by users cannot be independently authenticated.
- Re-encoded and paraphrased documents can evade comparison. Similar text can occur independently.
- No third-party security audit, independent real-case accuracy validation or verified commercial sale.
- This is not a forensic extraction/acquisition suite or a substitute for qualified expert review.

## What the judges should look at
1. Eight supporting documents collapse to one declared origin, with an explicit explanation.
2. Independent supporting systems are distinguished from copies; the engine abstains when confidence in origin is insufficient.
3. Cite identifies six references sharing one origin, circular reporting, unsupported statements and independent primary roots.
4. Both apps export transparent JSON; Kiro evidence is in `.kiro/KIRO_USAGE.md`.

## Contest submission items still required
- A **working live URL or test build** accessible to judges (download/ZIP works as test build, but confirm platform accepts submitted link).
- Real, publicly viewable YouTube recording **under 3 minutes**, showing both applications.
- Devpost submission completed with category, write-up, Kiro usage, repository and video links.
- Maintain unrestricted free judge access through the judging period.

Official rules: https://kiroween.devpost.com/rules
