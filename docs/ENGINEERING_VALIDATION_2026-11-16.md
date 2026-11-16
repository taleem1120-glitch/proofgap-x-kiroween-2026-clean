# ProofGap X — Engineering Validation Record

**Snapshot:** 2026-11-16  
**Repository:** `taleem1120-glitch/proofgap-x-kiroween-2026-clean`  
**Validated main revision:** `767b8a852c4907321b003ebc7c7188d558d4544a`

This record distinguishes automated checks and synthetic observations from real-world validation. It is not a certification, independent audit, or production-readiness claim.

## 1. Automated verification

| Check | Observed result | Evidence |
|---|---|---|
| Node 20 test suite | 270 passed, 0 failed | CI run 43912452064 |
| Node 22 test suite | 270 passed, 0 failed | CI run 43912452064 |
| Mobile Chromium smoke | Passed at 360 px viewport | Run 43912452078 |
| Ten-language builder navigation | Passed in browser smoke | Run 43912452078 |
| Case-builder total/stance count regression | 3 total, 2 supporting, 1 contradicting; UI and exported JSON agree | PR 12 checks and run 43912452078 |
| Browser core reproducibility | Passed on the preceding validated main revision; generated bundle remained in parity | Run 43912054865 |
| GitHub Pages deployment | Passed | Deployment run 43912451551 |

The mobile browser smoke also exercised local analysis, JSON export, byte-identical browser/core report output, cycle rejection, no horizontal overflow, and no JavaScript exceptions.

## 2. Performance observations

These are single-run observations on GitHub-hosted Linux runners, not hardware-normalized benchmarks or latency guarantees.

| Workload | Node 20 | Node 22 |
|---|---:|---:|
| Maximum valid case: 1,000 sources, 5,000 evidence items, 500 claims, two links per item | 1,771.7 ms | 621.0 ms |

A separate deterministic scaling workload with 288 sources, 288 evidence items and one claim took 54.08 ms on Node 20 and produced a 1,010,260-byte report.

The maximum-case test passed its 10-second safety ceiling on both Node versions. These measurements show that the tested synthetic workloads completed within the configured guard; they do not establish performance on investigators' devices, very large production datasets, or a guaranteed service-level objective.

## 3. Security and integrity changes in this development sequence

- Corrected the mobile case-builder summary so total case evidence is distinct from supporting and contradicting evidence counts.
- Added contradiction-side provenance regressions: derived copies do not create extra contradiction origins or inflate contradiction scores; non-citing bridge sources do not collapse claim-local contradiction origins.
- Hardened local file verification to reject hard-linked files before hashing and re-check link count after reading. The policy conservatively rejects hard links even when both names are inside the evidence directory.
- Updated the threat model to record the mitigation and residual filesystem race limitations.

The security suite includes static checks for prohibited network/process/eval capabilities, hostile-input and serialization checks, size and graph limits, and file-path/symlink/FIFO/integrity tests.

## 4. Known limitations — do not omit from demos or buyer discussions

1. **Declared provenance is not independently verified.** A case author can omit a real derivation or declare unrelated sources as independent. The engine cannot infer facts absent from the case data.
2. **Synthetic benchmark only.** Benchmark datasets and labels are author-generated. Strong results on declared-provenance scenarios are specification-consistency checks, not field accuracy or independent competitive proof.
3. **Undeclared, re-encoded or edited copies remain a weakness.** Different bytes and no provenance cue can make a derivative indistinguishable from an independent source using case JSON alone.
4. **Byte identity is not authenticity.** SHA-256 verification only confirms that observed bytes match a declared digest. It does not prove who created a file, when it was created, or whether its contents are true.
5. **Browser case-builder mode does not verify original evidence files.** Local file hashing is an opt-in CLI capability using an evidence directory.
6. **Filesystem coverage is incomplete.** Windows and case-insensitive/Unicode-normalising filesystems have not been validated. A time-of-check/time-of-use race involving filesystem changes is narrowed, not eliminated.
7. **No independent forensic audit, accreditation, real-case validation, customer deployment, paid pilot, or revenue evidence is established by these checks.**

## 5. Current engineering status

**Prototype with improved automated regression coverage and a narrower local file-integrity attack surface. Not certified forensic software and not yet validated for production investigations.**

The next evidence required for a stronger commercial claim is a privacy-safe evaluation using representative, independently labelled cases; an external security review; usability testing with target investigators; and a buyer-led pilot with measurable workflow outcomes.
