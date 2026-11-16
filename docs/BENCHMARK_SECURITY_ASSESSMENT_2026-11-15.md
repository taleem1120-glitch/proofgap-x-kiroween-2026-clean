# ProofGap X — Evidence-based benchmark and security review scope
Date: 2026-11-15
Status: **INTERNAL REVIEW; NOT INDEPENDENTLY CERTIFIED**.

## 1. Benchmark findings that can be stated accurately

Primary evidence: `docs/BENCHMARK.md`, file-backed heldout3 split in the existing project. This benchmark is synthetic, created by the product author, and is not an independent real-world comparison.

| Metric (heldout3) | Earlier engine 0.3.0 | Engine 0.4.0 |
|---|---:|---:|
| False assertions on undeclared byte-identical copies | 32/43 | **0/43** |
| False assertions on re-encoded copies | 24/47 | **24/47** |
| Overall false positives | 56/569 | **24/569** |
| Declared-case recall | 315/315 | **315/315** |

Interpretation: local byte hashing successfully suppresses the synthetic identical-file false positives; *it does not detect altered/re-encoded copies*. The generator is explicitly designed to include these modes; exact figures must never be marketed as real-world accuracy or superiority over Cellebrite/Magnet/other commercial products. The 0.4.0 method also potentially **over-merges legitimately independent identical public/template documents**, a failure mode not measured by this dataset.

For the additional ProofGap Cite application, held-out synthetic precision is 123/189 (65.1%) with saved files, recall 123/170 (72.4%), and FPR 66/525 (12.6%); baseline ≥2 distinct URLs FPR 393/525 (74.9%). All 66 remaining false positives are reencoded reposts. These are **application-2** results and must not be attributed to ProofGap X.

## 2. Security code-review observations

Reviewed directly from GitHub `src/integrity.js`, `test/integrity.test.js`, `test/security.test.js` and `docs/THREAT_MODEL.md`.

- Positive controls in source: filename allowlist; explicit root restriction; symlink refusal; `O_NOFOLLOW`; non-regular-file refusal; capped input sizes; `wx` exclusive output; zero runtime dependencies; an offline self-contained HTML viewer and CSP.
- A concrete resource-limit gap was found: initial file `fstat` does **not** bound a file that grows while being read; elapsed-time checking occurred only before the hash loop. The source change in this branch adds **per-chunk** deadline and total-byte checks, with deterministic regression tests modeling a growing file and deadline expiry.
- **Residual risks:** TOCTOU races during path checks cannot be ruled out by the current implementation; identical bytes do not imply a shared original source; file hash matching does not prove authenticity; reports are not signed or authenticated; the project has not been tested on every filesystem/OS; adversarially manipulated declared provenance can still deceive the analyzer.
- The current threat model is for a **local CLI/offline viewer**, not a multi-tenant public hosted evidence service. Do not expose a new network server using this security assessment alone.

**Test status:** the new regression tests are committed for execution, but at the time of writing they have **not** been run from this assistant's environment against the entire freshly cloned repository. GitHub Actions is documented as BLOCKED_BY_BILLING. No PASS claim is made for those tests.

## 3. Independent assessor brief (needed for actual independence)

A reviewer unaffiliated with the implementation should:
1. Clone the exact public main commit and the proposed security patch, record SHA, Node version, OS and commands. Run `npm ci --ignore-scripts`, `npm test`, `npm run validate:local`.
2. Review untrusted JSON parsing, nested schema, prototype-pollution and bidi controls; file boundaries, symlinks, hard links, path TOCTOU, hostile files growing during reads, memory/time ceilings and report escaping.
3. Reproduce headless Chromium tests, CSP/XSS checks, offline network isolation and zero-dependency assertions.
4. Run a genuinely independently prepared/blinded dataset with provenance truth, re-encoded/cropped copies, shared public documents, misleading metadata and negative controls. Report TP/FP/TN/FN, precision, recall, false-positive rate and failure examples.
5. Record severity, reproduction, remediation and retest for each finding. Sign/date a report with reviewer identity and independence declaration; clearly distinguish manual audit, scanner findings and any penetration testing.

Reference methods: OWASP ASVS 5.0.0 (https://asvs.owasp.org/) where applicable to any hosted interface, and NIST SSDF SP 800-218 (https://csrc.nist.gov/pubs/sp/800/218/final) for secure development.

## 4. Release decision

- **Internal technical improvement:** PATCH COMMITTED; REGRESSION TESTS ADDED, EXECUTION PENDING.
- **Synthetic relative-to-old-engine benefit:** DOCUMENTED, NOT EXTERNAL SUPERIORITY.
- **Independent penetration/security audit:** NOT DONE.
- **Commercial-grade, real-case accuracy:** NOT PROVEN.
- **Competition video:** record only documented, reproducible features; avoid independent-certified or 100%-accuracy claims.

This file is an internal engineering record, not an independent audit certificate or third-party endorsement.
