# Independent, blinded verification gate — ProofGap X

Status: PROTOCOL ONLY. No independent test result is implied by this document.

## What is being measured?
Task 1: identify truly duplicated/reposted reports without treating independently authored articles about identical events as copies.
Task 2: recognize shared passages worth a human look, without confusing recurring public boilerplate with proof of common provenance.
Task 3: evaluate abstention and missing-corroboration reports against independently adjudicated source-lineage cases.

## Evaluation design
- Freeze repository commit, thresholds, normalization, scripts, and evaluation protocol before obtaining test labels.
- Recruit independent curators. Collect at least 150 **legally usable and consented** source-family groups, separated by original publication/source, with translations and paraphrases segregated. Avoid any sensitive victim, police, financial, medical or unlicensed text.
- Establish three annotators per ambiguous case, record adjudication and inter-rater agreement. Separate *known ancestry*, *different origin*, and *unknown*. Do not force unknown into positive or negative.
- Split by underlying source family (never by article row). Keep 70% development, 15% calibration, 15% final held-out. Freeze the held-out set and hashes before scoring.
- Include independent articles sharing generic press releases, government notices, boilerplate, syndicated headlines, different language translations, paraphrases, partial reuse, near-match OCR/transcription errors, adversarial Unicode, and wholly unrelated articles.
- Report confusion matrices, precision/recall/FPR, false-negative rates, abstention coverage, false alarms per 100 documents, subgroup results and bootstrap 95% intervals. Distinguish document pairs from source families to avoid inflated sample sizes.
- Establish task-matched baselines: SHA-256 exact equality, same normalized 5-gram/Jaccard, and an openly available independent-citation or plagiarism checker *only when its evaluation task and licensing permit it*. No comparison with Cellebrite extraction capability is task-equivalent.
- Two evaluators re-run on Linux and Windows/macOS if claimed, record Node version, CPU, RAM, median/p95/peak memory, timeouts, malformed input behavior; report all failures.
- Expert pen-test on file-system races, path traversal/symlinks, Unicode confusables, large JSON arrays, XSS/script injection, file export integrity, CSP, absence of telemetry, dependency provenance, and denial-of-service.
- Run only on fresh public or legally authorized fixtures, keep consent and chain-of-custody documents, and preserve scripts/results independently.

## Decision gates
- CI passes Node.js 20+22 on exact release SHA and produces byte-identical demo builds.
- No unexplained severe security issue and no unbounded processing on accepted inputs.
- At minimum independent evaluator signs off on reproduced held-out results and includes confidence intervals.
- No headline superiority claim without statistically supported matched-baseline difference.
- All 10 advertised languages require human linguistic and RTL/layout review; untranslated explanation bodies are marked as such.

## Current evidence — not independent
- Published main CI and Pages: 2026-11-15 commits in GitHub Actions.
- Candidate PR6: test coverage, 10-language viewer chrome, partial-copy review-only signal.
- The developer-authored challenge achieved zero false positives in its limited cases, **not** an external accuracy guarantee. Shared boilerplate can trigger passage warnings; those are not proof of copying.
- Actual submission and video must be verified separately in Devpost and YouTube.

## Conservative business interpretation
Until independent evaluation and buyer pilots succeed, refer to the artifact as an open-source research prototype and potential licensing/support platform. Do not claim a market-leading forensic suite, guaranteed detection, institutional certification or a validated sale price.
