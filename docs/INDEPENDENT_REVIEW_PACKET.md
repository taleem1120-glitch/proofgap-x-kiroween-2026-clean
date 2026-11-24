# ProofGap X — Independent Evaluation & Assurance Brief

**Purpose:** invite an evaluator who did not implement ProofGap X to assess its technical claims and limitations. This brief is a request for independent work, not evidence that such work has occurred.

## Candidate under consideration

- Repository: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean
- Candidate code commit to pin for an evaluation: `50a1d017dc79d7863c78880a61b2ca5d9a5f2609`
- Evaluation date requested: to be agreed with the reviewer.
- Product status: open-source research prototype; not forensic software, not certified, and not independently validated.
- Two applications: ProofGap X and ProofGap Cite, sharing a domain-neutral core.

The reviewer must independently verify the commit and record the exact SHA actually tested. If the candidate changes, the review must identify whether the changed code was included and repeat affected tests.

## A. Independent benchmark evaluation

The evaluator should not be given expected labels until the corpus, test plan, and scoring rules are frozen. The evaluator should create or adjudicate a permission-cleared corpus independently of the implementation team.

Required scenario families:
1. Single-origin amplification through reposts, aggregators, summaries and derivative publications.
2. Truly independent sources with overlapping boilerplate, templates, common public documents or standard language.
3. Circular citation and citation laundering, including unresolved primary sources.
4. Exact, partial, reordered, lightly edited, paraphrased, translated, OCR-altered and re-encoded content.
5. Ambiguous or missing provenance, including cases where the correct outcome is unresolved/abstain.
6. Mixed support and contradiction, including leave-one-origin-out tests.
7. Input order permutations and repeated-run determinism.
8. Malformed, missing, unsafe and resource-limited evidence files.

Evaluation safeguards:
- Separate development and held-out source families; do not split near-duplicates across both.
- Freeze labels, thresholds, corpus manifest, scoring code and random seeds before running the candidate.
- Keep an adjudication record and mark disputed cases as ambiguous rather than forcing labels.
- Do not tune against the held-out set. Any post-result change requires a new held-out set.
- Preserve every failed case and report exclusions with reasons.

Minimum report:
- Confusion matrix and denominators for each decision class.
- False-corroboration and false-abstention rates, with confidence intervals.
- Abstention rate and coverage; results broken down by scenario family.
- Detection performance for each content transformation, including explicit misses.
- Incomplete-scan disclosure rate under resource limits.
- Order-invariance and repeated-run determinism.
- Runtime and peak memory by input-size bucket.
- Limitations, ambiguous labels, exclusions and reproducibility instructions.

## B. Independent security review

Review the source and run the application in a controlled environment. At minimum assess:
- Path traversal, symlinks, hard links, intermediate-component races and output-file overwrite behavior.
- Input parsing, schema validation, prototype-pollution cases, Unicode/bidi/control characters and terminal/report injection.
- HTML viewer CSP, DOM sinks, hostile report content, browser network requests and content-security boundaries.
- Denial-of-service limits, CPU/memory behavior and incomplete-scan semantics.
- Dependency and build provenance, lockfile integrity, package publication settings and license notices.
- Privacy boundaries, local file access, logging and report handling.

Deliver a severity-ranked findings register with reproduction steps, affected commit, evidence, remediation recommendation and residual risk. State what was not tested. Do not issue a certification unless the reviewer is authorized and the applicable certification scheme is actually used.

## C. Accessibility and usability review

Test keyboard-only navigation, visible focus, semantic structure, screen-reader announcements, zoom/reflow, contrast, RTL Arabic, language switching, mobile layouts and report export. Identify assistive technology/browser/OS versions and every untested area.

## D. Independence and conflict disclosure

The evaluator should disclose:
- Whether they contributed code, tests, labels, benchmarks or funding.
- Any financial or personal relationship with the project owner.
- Whether the review was paid, pro bono or limited-scope.
- The exact scope, dates, tools and environments used.

The evaluator must be free to report negative results. The project team must not edit the evaluator's findings except to correct factual errors with the evaluator's agreement.

## E. Commercial validation is separate

A technical review does not establish product-market fit, legal admissibility, forensic certification, customer demand, or acquisition value. Commercial validation additionally requires documented buyer interviews, a defined deployment/security model, data-processing terms, support commitments, and paid pilots or other verifiable customer intent.

## Requested reviewer deliverables

1. Signed or attributable report naming the reviewer/organization and scope.
2. Exact commit SHA and reproducible test environment.
3. Raw or safely shareable result tables, scripts and corpus manifest hashes.
4. Findings register and remediation retest results.
5. Explicit limitations and an unambiguous conclusion: pass, pass with conditions, or fail for the stated scope.

**No reviewer has been engaged and no independent evaluation has been completed as of the date this brief is prepared.**
