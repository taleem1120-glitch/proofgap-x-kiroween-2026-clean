# ProofGap X — Final Release Gate and Operator Runbook

**Candidate branch:** `release/proofgap-final-gate-2026-11-24`  
**Upstream engineering branch:** `recovery/proofgap-cite-integrate-2026-11-19`  
**Release state:** NOT APPROVED FOR PRODUCTION. This document defines the evidence required before approval; it does not claim those gates have passed.

## 1. Product boundary

ProofGap is a local, offline evidence-provenance analysis aid with two applications:

- **ProofGap X:** structured JSON case analysis and optional local evidence-file byte-integrity checks.
- **ProofGap Cite:** Markdown footnote citation-lineage review, with optional saved-text review.

It is not a forensic acquisition suite, evidence-authenticity verifier, chain-of-custody system, truth detector, legal-admissibility engine, or guilt/intent classifier. A SHA-256 match establishes byte equality only. Provenance relationships remain declared unless explicitly checked by a supported local operation. Synthetic benchmark results are not real-world accuracy claims.

## 2. Safe operator workflow

1. Work on a copy of case data and preserve originals read-only. Do not point the tool at an original evidence store as a write destination.
2. Use a dedicated evidence directory containing only the files intentionally supplied for comparison. Record the source of each file outside the tool as part of the investigator's own case process.
3. Validate and analyse a case without evidence files first:
   `node src/cli.js path/to/case.json --format json`
4. If local copies are available and authorised for analysis, opt in to byte checks:
   `node src/cli.js path/to/case.json --evidence-dir path/to/evidence --format json`
5. Review every relationship basis and every `MISSING`, `MISMATCH`, `UNSAFE_PATH`, or `NOT_CHECKED` result. Never convert an unknown or declared relationship into a verified fact.
6. For citation notes, run:
   `node apps/proofgap-cite/cli.js path/to/note.md --sources path/to/saved-sources --format lint`
7. Use optional text-copy review only when saved UTF-8 text files are available and authorised:
   `node apps/proofgap-cite/cli.js path/to/note.md --sources path/to/saved-sources --review-text-copies --format json`
8. Treat similarity and shared-passage alerts as human-review cues, not attribution findings. An incomplete scan is not a negative finding.
9. Preserve the original inputs, exact command, tool version, output report, and analyst notes together under the organisation's evidence-handling policy. ProofGap itself does not sign reports or establish chain of custody.

## 3. Reproducible validation sequence

Run from a clean checkout of the exact candidate commit:

```sh
node --version
npm ci --ignore-scripts
npm test
npm run validate:local
npm run bench
npm run cite
node src/cli.js examples/demo/case.json --evidence-dir examples/demo/evidence --format text
```

Rebuild both committed showcase pages from a clean working tree and compare the resulting bytes with the committed artifacts. The commands refuse to overwrite existing outputs, so preserve the originals and use a disposable checkout or remove only the generated showcase copies in that disposable checkout:

```sh
rm viewer/showcase.html apps/proofgap-cite/showcase.html
npm run showcase
npm run showcase:cite
git diff --check
git diff --exit-code -- viewer/showcase.html apps/proofgap-cite/showcase.html
```

The final diff command must report no differences after regeneration. Keep the generated validation directory and all logs as release evidence. Do not overwrite prior benchmark records.

## 4. Remote CI and browser gate

The candidate commit itself must have successful runs for:

- Node 20 and Node 22 application test jobs.
- Responsive Chromium interaction checks.
- Chromium, Firefox, and WebKit responsive, keyboard, RTL, and case-authoring checks.
- Dependency audit and security regression suite.
- Source, package, and licence gates.

A successful run on a different commit is historical evidence only. Confirm each workflow run's checked-out SHA equals the release candidate SHA. A skipped workflow is not a pass. The CI workflow's current browser/security coverage is automated and does not establish physical-device compatibility or human accessibility conformance.

## 5. Security and usability review still required

Before production approval, obtain and retain:

- Independent security review of the threat model, source, HTML viewer/CSP, local file handling, CLI boundaries, dependency/update process, and release artifact.
- Human accessibility review with keyboard-only and screen-reader testing.
- Supported-platform tests on every platform the release intends to claim. Current documented CI evidence is Ubuntu-based; Windows and macOS behaviour must not be claimed without separate evidence.
- A privacy/data-flow review confirming that case content remains local and documenting backup, temporary-file, logging, and operator-device controls.
- User testing with representative analysts and writers, including error recovery and interpretation of abstentions.

Until these are complete, the product remains a research/prototype tool and must not be marketed as independently validated or enterprise-ready.

## 6. Scientific and benchmark release gate

Publish benchmark protocol, generator, held-out split provenance, metrics, confidence-interval caveats, and limitations with the release. Keep these failure modes visible:

- Hidden undeclared provenance can be indistinguishable from genuinely independent origins when the case contains no distinguishing information.
- Re-encoded, edited, cropped, translated, paraphrased, or OCR-transformed copies may evade byte-identity checks.
- Byte-identical public templates or documents from independent holders may be conservatively merged.
- Heuristic similarity cues may miss dependencies or flag unrelated material.
- Author-built synthetic benchmarks do not estimate field accuracy or legal reliability.

Do not optimise headline scores by hiding abstentions, changing benchmark labels after seeing held-out results, or describing synthetic consistency as independent validation.

## 7. Release artifact requirements

A production release is blocked until all items below are attached to the same immutable tag/commit:

- Versioned release notes and explicit supported Node/platform matrix.
- Reproducible source archive and package manifest with licence/NOTICE.
- Clean-install and command-line smoke-test logs.
- Validation summary, benchmark outputs, browser/security run links and exact commit SHA.
- Independent security and accessibility review summaries, including unresolved findings.
- User-facing limitations, data-handling guidance, and incident/reporting contact.
- A rollback and version-pinning procedure.

Do not publish a production tag or change the product status wording until the release owner signs off every gate. A GitHub Actions green check alone is insufficient.

## 8. Candidate acceptance record

| Gate | Required evidence | Current disposition |
|---|---|---|
| Core automated tests | Candidate-SHA Node 20/22 runs | Re-run on this candidate |
| Cross-browser | Candidate-SHA Chromium/Firefox/WebKit runs | Re-run on this candidate |
| Security regressions and dependency audit | Candidate-SHA audit job | Re-run on this candidate |
| Local validation and benchmarks | New immutable validation record | Pending |
| Showcase determinism | Clean rebuild with zero diff | Pending |
| Independent security review | Signed review report | Not evidenced |
| Human accessibility review | Review report and issue disposition | Not evidenced |
| Windows/macOS support | Platform test evidence | Not evidenced |
| Production packaging and release | Tagged artifact and release notes | Not approved |

**Decision rule:** any pending, failed, skipped, or unevidenced gate means NO-GO for production. The software may be demonstrated as a research prototype with the limitations above.
