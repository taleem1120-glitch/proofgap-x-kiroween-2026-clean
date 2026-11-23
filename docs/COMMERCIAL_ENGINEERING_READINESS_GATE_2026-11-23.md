# ProofGap X — Commercial & Engineering Readiness Gate

**Status:** Engineering acceptance plan (not a claim of completed validation)  
**Branch:** `commercial/readiness-gate-2026-11-23`  
**Purpose:** Establish auditable release criteria for competition submission, technical evaluation, and commercial diligence.

## Product boundary

ProofGap X evaluates whether apparently corroborating evidence is genuinely independent or whether multiple items depend on shared, copied, transformed, or otherwise linked origins. It is an evidence-independence and provenance analysis aid—not an investigator, fact-verification oracle, or substitute for expert judgment.

## Release principles

1. **No unsupported confidence:** output confidence must not increase merely because dependent copies are counted as independent items.
2. **Explainability:** every detected dependency or warning must point to the evidence IDs and signals that triggered it.
3. **Conservative abstention:** when signals are insufficient, ambiguous, or conflicting, report uncertainty and avoid categorical claims.
4. **Reproducibility:** identical inputs, configuration, and version must produce deterministic outputs where deterministic behavior is intended.
5. **No silent degradation:** parse failures, unsupported evidence types, and resource limits must be visible in output.
6. **Separation of signal and conclusion:** similarity, shared passage, metadata, and provenance cues are signals; none alone proves common authorship or a common origin.

## Acceptance gates

| Gate | Required proof | Release evidence |
|---|---|---|
| A. Functional correctness | Valid, invalid, empty, and boundary inputs handled predictably | Test results and fixture coverage |
| B. Independence reasoning | Copy/near-copy, shared-source, independent-source, and mixed cases distinguish correctly | Benchmark cases with ground truth and rationale |
| C. False corroboration | Cases with many derivative items do not inflate support as if independent | False-corroboration rate and per-case outputs |
| D. Abstention | Ambiguous or weak evidence produces a qualified/abstaining result | Abstention precision/recall and examples |
| E. Adversarial robustness | Reordering, superficial edits, punctuation/spacing, Arabic mark variants, and bait signals are tested | Threat matrix, expected/actual outcomes |
| F. Reproducibility | Repeated runs and clean environments agree | Determinism check and environment metadata |
| G. Performance | Runtime and memory measured across declared sizes | Raw measurements, machine/runtime details, scaling plots or tables |
| H. Security | Input limits, path containment, HTML output escaping, and safe handling of untrusted data checked | Security checklist and tests |
| I. UX and accessibility | Empty states, errors, keyboard access, responsive layout, and clear labels reviewed | Browser smoke tests and manual checklist |
| J. Commercial handoff | Demo, technical summary, limitations, license, and buyer evaluation steps packaged | Diligence folder / release bundle |

## Benchmark protocol

- Keep benchmark fixtures versioned and label the ground truth before running the evaluator.
- Include balanced scenarios: truly independent sources; exact duplicates; near duplicates; shared passage; chain of derivative reposts; mixed independent/derivative evidence; conflicting claims; insufficient evidence.
- Split tuning and held-out evaluation data. Do not tune thresholds against held-out cases.
- Report counts and rates with denominators. Never publish a percentage without the number of cases behind it.
- Report confusion matrix counts (TP, FP, TN, FN), precision, recall, F1, and false-corroboration rate. For abstention, report coverage and selective error rate together.
- Publish raw result files and the exact command, commit SHA, Node version, and benchmark dataset version.
- Treat synthetic benchmarks as synthetic. They demonstrate behavior against designed scenarios, not real-world effectiveness.

## Adversarial test matrix

| Attack / edge case | Expected behavior |
|---|---|
| Exact copies with changed filenames | Detect duplicate/dependency cues; do not count as independent support |
| Near-copy with punctuation/spacing changes | Detect where supported; explain cue, avoid certainty |
| Shared passage embedded in otherwise different text | Flag passage overlap separately from whole-document similarity |
| Reordered paragraphs or sentence fragments | Robustness test; no unsupported claim if detection misses |
| Arabic diacritics and mark normalization | Preserve text; normalization behavior documented and tested |
| Evidence graph with cycles or repeated IDs | Reject or safely handle; no infinite traversal |
| Missing, malformed, or oversized evidence | Explicit validation error or bounded handling |
| Conflicting evidence | Surface conflict; avoid automatic resolution |
| HTML/script-like untrusted text | Render inert and escape output |
| Very large graph / long text | Enforce documented resource bounds and fail predictably |

## Output contract for a buyer-facing report

Every report should include:

- Run ID, timestamp, software version/commit, and configuration
- Evidence item count and accepted/rejected item count
- Detected dependency groups and evidence IDs
- Signals used, with concise explanations
- Independent-support estimate and how it was computed
- Warnings, conflicts, unsupported inputs, and limitations
- Abstention or qualification status
- Reproducibility instructions

## Commercial demo sequence (5–7 minutes)

1. **Problem:** a large number of articles/reports can create a misleading appearance of independent corroboration.
2. **Baseline:** show the naive item count and a case where items share origins or passages.
3. **Analysis:** run ProofGap X and reveal dependency groups, signals, and uncertainty.
4. **Contrast:** compare the derivative-heavy case with genuinely independent evidence.
5. **Audit:** open the report and show IDs, explanations, limitations, and reproducibility metadata.
6. **Buyer value:** discuss reduced analyst time, better evidence-quality review, and more defensible intelligence workflows—without claiming ProofGap X verifies truth.

## Commercial diligence checklist

- [ ] One-command installation and demo documented
- [ ] Clean-environment reproduction instructions
- [ ] Benchmark data, labels, and methodology available
- [ ] No unsupported performance or accuracy claims
- [ ] Known limitations and intended-use statement
- [ ] Software bill of materials / dependency review
- [ ] License and ownership review
- [ ] Security review of input, file, and rendering paths
- [ ] Buyer-facing demo and report examples
- [ ] Evaluation plan for a prospective customer (sample data, success criteria, duration, exit criteria)

## Go / no-go rule

Do not call the release “commercially validated” until gates A–I have evidence attached and an external evaluator or prospective buyer can reproduce the key benchmark. A polished demo is not a substitute for validation. If a gate is incomplete, mark it **Not yet verified**, assign an owner, and capture the exact evidence needed to close it.

## Current evidence status

This document defines the acceptance bar. It does **not** assert that the listed gates have passed. Populate the status table from actual test, benchmark, security, and browser results before making release claims.
