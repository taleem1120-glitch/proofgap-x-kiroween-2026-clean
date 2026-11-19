# ProofGap Cite: citation lineage analysis for research and news notes

**Who it is for:** a writer, researcher or editor checking a draft before publication.
**Question it answers:** "I cite six sources for this sentence. How many independent origins do they actually rest on, and what is missing?"

Built only on the ProofGap core interface (`src/core.js`, `CORE_API_VERSION` 1.x). Zero dependencies, offline, deterministic. Synthetic examples only.

## Try it (no install)
Open `apps/proofgap-cite/showcase.html` in a browser, or run from the repository root:
```sh
npm run cite               # lint output for apps/proofgap-cite/examples/water-note.md, saved copies checked
node apps/proofgap-cite/cli.js apps/proofgap-cite/examples/water-note.md --sources apps/proofgap-cite/examples/sources --format html --out my-report.html
node apps/proofgap-cite/cli.js my-draft.md --fail-on-gaps    # exit 3 if any claim is not independently corroborated
```
`--format lint|json|html`; `--sources DIR` enables saved-file verification; `--out` never overwrites. Exit codes: 0 ok, 1 invalid note or I/O error (issues listed with line numbers), 2 usage, 3 gaps (only with `--fail-on-gaps`).

### Optional saved-text copy review

Use `--review-text-copies` together with `--sources DIR` to compare explicitly cited, saved UTF-8 text files for long shared passages:
```sh
node apps/proofgap-cite/cli.js my-draft.md --sources ./saved-sources --review-text-copies --format json
```
Only `.txt`, `.md`, `.csv`, and `.json` files are extracted (bounded to 30 files, 256 KiB per file, 2 MiB total, and 5 seconds). PDF, HTML, XML, images, OCR, binary data, network retrieval, symlinks, and unsafe paths are not supported. Shared passages, text resemblance, and incomplete scans are review cues only; they do not prove copying or common origin, merge origins, or establish authorship. An incomplete scan must not be treated as a negative finding.

## Note format
```markdown
# Title
## Claims
- Riverton's water budget rose 40%. [^pr] [^dp] [^nb]       <- [^id] supports
- The new pipeline halves losses. [^op] [-^audit]           <- [-^id] contradicts
- A sentence with no citation.                              <- reported as unsupported
## References
[^pr]: City Hall press release {kind=primary, url=https://..., saved=pr.txt}
[^dp]: Daily Planet story {kind=secondary, cites=pr, saved=dp.txt}
[^nb]: Neighbourhood blog {kind=secondary, saved=nb.txt}
```
Attributes, all optional: `kind=primary|secondary|unknown` (default unknown), `url`, `doi`, `saved` (path inside `--sources`), `cites=id;id`. Text inside fenced code blocks is ignored. Limits: 512 KB, 200 claims, 500 references, 50 citations per claim, 4,000-character lines. Control and bidirectional characters, unknown attributes, undefined references and duplicate ids are rejected with line numbers.

## Verdicts (per claim)
| Verdict | Meaning |
|---|---|
| `independently_corroborated` | ≥ 2 independent origins that each trace to a reference declared `kind=primary` with no upstream of its own, and no cue linking them |
| `abstain_suspected_shared_origin` | enough primary origins, but the same URL or DOI after normalisation, the same title, or a shared saved file suggests they may be one |
| `origin_unresolved` | separately declared origins, but fewer than two trace to a declared primary source |
| `single_origin` | every citation traces to one origin (for example a press release and its echoes) |
| `circular_reporting` | support comes only from references that cite each other |
| `conflicting` / `contradicted` / `unsupported` | as named |
Every non-corroborated verdict lists **what is missing**.

## What it does not trust
- `kind`, `url`, `doi` and `cites` are the author's declarations.
- **Different URLs or outlets never count as independence.** Identical URLs or DOIs are only a cue, never proof of sameness.
- Only one thing is verified: byte identity of saved copies inside `--sources`. Symlinks, traversal, empty files and missing files never create links.
- URLs are never fetched.

## How it differs from ProofGap X (application 1)
| | ProofGap X | ProofGap Cite |
|---|---|---|
| User | investigator or analyst | writer, researcher or editor |
| Input | structured JSON case (schema 1.0) | Markdown note with footnote citations, plus a folder of saved copies |
| Domain rules | cycles are **invalid input** | citation cycles are a **finding** (circular reporting) |
| Primary vs secondary | not modelled | required for `independently_corroborated` |
| Identifiers | none | URL/DOI normalisation, used **only** as an abstention cue |
| Main output | evidence report, JSON / text / HTML | lint lines `file:line: [verdict]` with what is missing; exit code for gating; JSON / HTML |
| Shared | core validation, independence engine, verified byte identity, abstention, graph, viewer, file safety ||

## Known limitations (measured in `docs/BENCHMARK.md`)
- A repost saved with different bytes (re-encoded, edited) under a different URL is **not** detected. In the held-out benchmark all 66 such claims were wrongly called corroborated.
- Genuinely independent sources that do not declare `kind=primary` or an upstream are **not** credited: 47 held-out claims abstained (`origin_unresolved`). This is deliberate caution.
- Parsing covers the documented subset of Markdown footnotes only. Inline links and bibliography formats (BibTeX, CSL) are not read.
