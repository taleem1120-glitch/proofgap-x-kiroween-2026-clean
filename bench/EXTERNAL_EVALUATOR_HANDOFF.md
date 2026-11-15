# External evaluator handoff — labels-first benchmark

**This is a protocol and tool, NOT an external validation result.** No real victims, police files or private evidence should be submitted to a public repository.

## Evaluation harness
Usage:
```bash
node bench/evaluate-heldout.js /path/to/authorized-heldout.json > /path/to/heldout-results.json
```

The tool accepts a JSON object of the following shape (only fictional placeholders):
```json
{
  "independentAdjudication": false,
  "cases": [
    {
      "id": "example_001",
      "group": "formatting_change",
      "label": "same_origin",
      "a": "Long first authorized source text with at least 30 tokens ...",
      "b": "Long second authorized source text with at least 30 tokens ..."
    },
    {
      "id": "example_002",
      "group": "independent_reporting",
      "label": "different_origin",
      "a": "Authorized text one ...",
      "b": "Authorized text two ..."
    },
    {
      "id": "example_003",
      "group": "uncertain_lineage",
      "label": "unknown",
      "a": "Authorized source text ...",
      "b": "Authorized source text ..."
    }
  ]
}
```

Labels must be based on original source ownership/lineage established *outside* the algorithm, not on textual overlap. `same_origin` cannot mean merely 'similar text'. `unknown` cases are counted but excluded from denominator of precision/recall/FPR rather than forced into either class.

The tool computes two confusion matrices: byte-identical SHA-256 baseline and advisory lexical-overlap cue. It includes group breakdown and outputs **no raw texts**, filenames or case IDs. Metrics with zero denominators are `null`, never invented as perfect.

## Independent review prerequisites
- Curate and adjudicate legally shareable cases, blinded from developers; lock source-family holdout hashes and case definitions.
- Do not mix the same source family's publications across training and test sets.
- Record classes with boilerplate/quotations, partial verbatim reuse, different languages and genuine independent reporting of shared facts.
- Have an independent third party run the exact frozen commit and verify the JSON result against the input labels.
- Report FPR, precision, recall, abstention, group sizes, confidence intervals, hardware, elapsed time and any exclusions.
- Distinguish offline author-generated samples from independently adjudicated cases; publish only anonymized permission-cleared aggregate results.
- Do not claim superiority over commercial vendors without task-equivalent, authorized head-to-head testing.

**Current release gate:** independent blind corpus = NOT PROVIDED; independent evaluator = NOT ENGAGED; external test result = NOT AVAILABLE. GitHub Actions unit tests verify software, not ground-truth lineage accuracy.
