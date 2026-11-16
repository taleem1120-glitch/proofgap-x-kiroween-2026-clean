# ProofGap X

Explainable evidence-confidence stress testing for digital investigations (Kiroween 2026).

> **Status: prototype (package 0.5.0; analysis policy 0.4.0, unchanged in Phase 11; ProofGap Cite 0.1.0).** Not forensic software; not independently reviewed or validated; not enterprise-ready. Output describes the *structure of support under declared provenance*. It never states guilt, intent, or authenticity.

## What it does
Reads a structured JSON case and answers, per claim: *how many genuinely independent origins stand behind the support, and what exactly is missing?*
- **Independence engine** – derived copies, shared origin groups, identical artifacts and bridge sources collapse into one origin, with plain-language reasons. Independence is always labelled **declared, not verified**.
- **Proof-gap engine** – LOGICAL findings (e.g. `FALSE_CORROBORATION`, `CONFLICT_UNRESOLVED`) plus ranked HEURISTIC suggestions, each stating what it would show and what it would **not** show.
- **Local integrity (opt-in)** – `--evidence-dir` checks declared SHA-256 values against real files, returning `VERIFIED | MISMATCH | MISSING | UNSAFE_PATH | NOT_CHECKED`. Without it, declared hashes are shown as unverified.
- **Reports** – deterministic JSON (`--format json`, default), human-readable text (`--format text`) and a self-contained offline HTML viewer (`--format html [--compare other.json]`).

## Two applications on one core
ProofGap is a small, dependency-free provenance core (`src/`, interface `src/core.js`, `CORE_API_VERSION` 1.0.0) with two separate applications:

| | Application | Input | Answers |
|---|---|---|---|
| 1 | **ProofGap X** (`apps/proofgap-x/`) | structured JSON evidence case + optional evidence files | how many independent origins support each claim, what is verified, the smallest evidence that would change the verdict |
| 2 | **ProofGap Cite** (`apps/proofgap-cite/`) | Markdown note with footnote citations + folder of saved source copies | whether "six sources say so" rests on one press release, a citation loop or one file saved six times, and what is missing |

Applications may import only `src/core.js` (enforced by `test/core.test.js`).

## For judges: try both in 5 minutes
**No install needed for the demos.** Open these files straight from the downloaded repository (`file://`, no server, no network). All data is synthetic and fictional.

1. **`viewer/showcase.html` (ProofGap X).**
   - **Left panel:** "eight documents agree" collapses to **1 independent origin** (false corroboration). The green graph arcs are files the tool hashed itself; A8 is "HASHED LOCALLY".
   - **Right panel:** independent systems are supported; one claim **abstains**; one is contradicted. Each claim has a counterfactual evidence plan.
2. **`apps/proofgap-cite/showcase.html` (ProofGap Cite).** A draft article about a water crisis:
   - **Line 6:** 6 citations → **1 origin**. Four outlets echo one press release, and the blog's saved copy is byte-identical to the Daily Planet's.
   - **Line 7:** two independent primary sources → corroborated.
   - **Lines 8–11:** a forum/wiki citation loop, two sources with unknown origin, two "outlets" that are the same wire URL, and an uncited sentence.
   - Each claim says **what is missing**.
3. In either page, **Export report JSON** downloads the exact engine report, byte-identical to the CLI output.

From source (Node.js 20 or newer; zero dependencies):
```sh
npm ci && npm test                       # full suite
npm run cite                             # Cite lint output: file:line: [verdict] … missing: …
node apps/proofgap-x/cli.js examples/showcase/deceptive.json --evidence-dir examples/showcase/evidence --format text
npm run demo                             # ProofGap X integrity demo
rm viewer/showcase.html apps/proofgap-cite/showcase.html && npm run showcase && npm run showcase:cite   # rebuild both showcases from the engine
npm run validate:local                   # tests + focused groups + all benchmark reproductions, recorded under validation/<id>/
```
Pull-request CI has run for the current review branches; see `docs/CI_STATUS.md` for exact commits, runs and limitations. The video storyboard is in `docs/DEMO.md`.

## What is new in 0.4.0
- **Verified byte identity:** with `--evidence-dir`, every safely readable non-empty file is hashed by the tool, also when the case declares no hash. Byte-identical files are one artifact (basis *verified*, bytes only). Without `--evidence-dir`, nothing changes. Measured effect and limits: `docs/BENCHMARK.md`.

## Introduced in 0.3.0
- **Independence graph** with four explicit relationship bases: verified (bytes checked locally), declared, suspected (heuristic), unknown (assumed, not established).
- **Corroboration-denial-resistant independence**: count = maximum set of evidence with pairwise-disjoint declared root sets, evaluated per claim. Adding evidence never lowers it; copies never raise it.
- **Abstention**: `decision` abstains when a heuristic cue links two support origins; `status` (hard classification) is reported separately.
- **Counterfactual planner**: smallest number of additional evidence outcomes that could change each verdict, with the outcome under each hypothesis computed by the same rule (tested by executing the hypotheticals).
- **Offline viewer** (`--format html`, `--compare`): CSP-locked, no network, untrusted text rendered as text only.

## Setup and commands
Node.js ≥ 20, **zero runtime dependencies**.
```sh
npm ci                                   # uses package-lock.json (empty dependency tree)
npm test                                 # all tests
npm run validate:local                   # full local validation, recorded under validation/<id>/
npm run bench                            # synthetic benchmark (writes nothing unless --out is given)
node src/cli.js case.json [--out report-file] [--evidence-dir dir] [--format json|text|html] [--compare other.json]
```
Exit codes: 0 ok, 1 invalid input/I-O failure, 2 usage. `--out` never overwrites (fails if the path exists).

## Case format (schema 1.0, `schemas/case.v1.schema.json`)
`schemaVersion: "1.0"`, `caseId`, `title`, `sources[]` (`id`, `name`, optional `derivedFrom[]`, `originGroup`), `claims[]` (`id`, `statement`), `evidence[]` (`id`, `sourceId`, `description`, optional `sha256`, optional `file` relative path used only with `--evidence-dir`, `links[]` of `{claimId, stance: supports|contradicts, strength 0..1}`). Unknown properties are rejected. IDs match `[A-Za-z0-9_.-]{1,64}`. See `examples/`.

**CI status:** PR #17 has successful Node 20, Node 22 and Chromium workflow runs on its review commit. This does not certify the default branch, eliminate all security risks, or replace independent review; see `docs/CI_STATUS.md`.

## Security defaults
Local only (no network/spawn/eval code); 1 MB input cap and item/string/depth limits; schema + semantic validation with `$`-paths; prototype-pollution keys, control/bidi characters and lone surrogates rejected; report output escaped; file verification restricted to an explicit directory (no symlinks, no traversal, regular files only, size/count/time limits). Threat model: `docs/THREAT_MODEL.md`.

## Known limitations (read before relying on anything)
- **Declared provenance cannot be verified.** If a case author hides that two sources share an origin, the hard classification cannot know (synthetic benchmark: 88/88 such claims). The decision abstains only when a cue exists. With local files, byte-identical copies are now caught; re-encoded copies are not (file-backed heldout3: 24/47 still asserted).
- Scores are an uncalibrated heuristic (noisy-OR over independent origins; threshold of 2), not probabilities.
- A SHA-256 match proves byte equality only. Hard-linked files are rejected conservatively (including when both names are inside the evidence directory). Byte-identical common files held by genuinely independent sources (a public PDF, a template) would be merged; that is a conservative error and is not measured. Windows/macOS and exotic filesystems are untested.
- The benchmark is synthetic and written by the tool's author; see `docs/BENCHMARK.md`. No real-world accuracy claim is made.
- No independent security review. In-repo schema validator (Ajv could not be installed in the sandbox).
- Viewer tested in headless Chromium only; no screen-reader or cross-browser testing.
- **Submission is not complete:** the repository is public and the default branch contains the application code, but the public demo URL, public video, Devpost entry and final owner approvals still require verification. See `docs/COMPETITION.md` and `docs/APPROVALS.md`.

## Licence
Apache License 2.0. See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE). Copyright 2026 TAALEEM ALI HAJM SULTAN AL-SIYADI. Redistributions must keep both files (Apache-2.0 §4).

## Layout
`src/` core (`core.js` = application interface) · `apps/proofgap-x/` application 1 · `apps/proofgap-cite/` application 2 (CLI, examples, showcase) · `viewer/` shared offline viewer + app-1 showcase · `schemas/` JSON Schema · `test/` tests · `bench/` benchmark · `examples/` synthetic data · `docs/` threat model, benchmark, demo · `.kiro/specs/proofgap-x/` requirements, design, tasks, acceptance (all phases) · `.kiro/steering/proofgap-x.md` project rules (added in Phase 7) · `.kiro/KIRO_USAGE.md` factual Kiro usage log.
