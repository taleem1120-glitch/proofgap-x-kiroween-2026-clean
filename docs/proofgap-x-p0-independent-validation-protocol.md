# ProofGap X — P0 Independent Validation Protocol

Status: protocol drafted; no external dataset or independent evaluator has been run.
Date: 2026-11-22

## Purpose
Validate whether ProofGap X conservatively distinguishes evidence independence, shared text, declared lineage, and uncertainty. This protocol is designed to prevent benchmark leakage and overclaiming.

## Non-negotiable interpretation rules
- A hash match is evidence of matching bytes, not source authenticity.
- A normalized text match is evidence of matching text, not common origin.
- Shared-passage or similarity signals are review cues; they must not automatically merge sources or establish dependence.
- Declared lineage is a metadata assertion, not independently verified provenance.
- Missing, contradictory, or incomplete inputs must lead to an explicit uncertainty/abstention state, never a reassuring independence claim.
- A test suite passing is not external validation.

## Evaluation tiers
1. **L1 Synthetic:** deterministic generated cases; useful for regression, not real-world claims.
2. **L2 Adversarial synthetic:** hostile variants and edge cases; useful for robustness testing.
3. **L3 Curated real-world:** source provenance and ground truth documented by a curator; split by source family to prevent leakage.
4. **L4 Blind external evaluation:** evaluator receives a frozen release and sealed cases; developer does not tune against results.
5. **L5 Cross-domain replication:** independently curated datasets across news, research, reports, and investigative evidence.

## Case matrix (minimum P0 coverage)
| ID | Scenario | Expected behavior |
|---|---|---|
| P0-01 | 8 records copied verbatim from one origin | Report shared-text/lineage cues; do not count as 8 independent origins |
| P0-02 | 8 identical records, origin unknown | Flag matching text; abstain from asserting origin |
| P0-03 | Two independent origins share common boilerplate | Do not infer dependence from boilerplate alone |
| P0-04 | Partial copy with unique additions | Identify bounded shared segment; preserve uncertainty about full-source relationship |
| P0-05 | Reordered blocks | Detect shared blocks only within documented bounds |
| P0-06 | Paraphrase with same facts | No unsupported origin assertion; similarity may be a review cue |
| P0-07 | Translation/back-translation | Document detector limitations; abstain if no supported signal |
| P0-08 | Date/numeric-only edits | Avoid treating trivial edits as independence evidence |
| P0-09 | Two independent original accounts | Preserve independence when no evidence of shared lineage exists |
| P0-10 | Shared passage plus independent firsthand details | Do not collapse entire records into one source |
| P0-11 | Repeated source with new IDs | Deduplicate/lineage logic must not be fooled by identifiers |
| P0-12 | Contradictory independent evidence | Preserve conflict; do not erase it via cluster consolidation |
| P0-13 | Missing/corrupt evidence or capped scan | Explicit incomplete/abstain status |
| P0-14 | Oversized/pathological inputs | Bounded processing and fail-closed/manual-review outcome |

## Benchmark separation
- Keep development, calibration, and blind evaluation data separated by origin/source family, not random rows.
- Never tune thresholds against blind evaluation.
- Record dataset version, case IDs, ground-truth rationale, exclusions, and reviewer.
- Synthetic cases must be labelled synthetic in reports.
- A real-world case must not enter the blind set if any detector implementation or threshold was tuned using it.
- Publish confusion matrix, precision, recall, false-positive rate, false-negative rate, abstention rate, sample size, and confidence intervals; report per-domain results and aggregate results.

## Release acceptance gates
- Every P0 scenario has a deterministic regression test with expected behavior.
- No scenario yields an unsupported independence/dependence assertion.
- Incomplete scans never produce a positive-confidence clean verdict.
- Benchmark data split audit passes with zero source-family leakage.
- Results are reproducible from a documented command and pinned environment.
- At least one blind evaluation is performed by a person who did not author the detector or tune its thresholds before claims of validated performance.

## Claim policy
Until L3/L4 evidence exists, describe results as **synthetic/adversarial regression performance** and **review cues**, not forensic proof, source attribution, or demonstrated real-world accuracy.
