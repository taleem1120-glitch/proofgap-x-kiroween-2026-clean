# CI status — 21 November 2026

## Verified integration state

- PR #33, **Integrate bounded ProofGap Cite shared-passage review**, was merged into `main`.
- Merge commit: `daf82b5980bb7d817f2b84a85b8db7bee5521de3`.
- The merged integration includes bounded shared-passage review and opt-in local saved-text extraction, with Unicode-safe text review, extraction limits, safety checks, and abstention/reporting behavior.
- GitHub Actions screenshots provided on 21 November show successful green runs on `main` for standard CI, browser-core reproducibility, published Pages release-byte verification, multilingual offline viewer smoke tests, cross-browser compatibility/security audit, and Pages deployment. These are screenshot-observed statuses; this document does not independently retrieve the underlying run logs.

## Scope and limitations

- CI success is evidence that the configured checks completed successfully; it is not proof of correctness, real-world accuracy, forensic admissibility, or production security.
- Cite text-copy/shared-passage cues remain human-review signals. They do not establish copying or common authorship, merge evidence origins, or change core confidence scores.
- Saved-text extraction is opt-in and restricted by the implementation's documented file types and resource limits.
- Benchmark datasets are synthetic and author-built. No independent validation or third-party security review is claimed.

## Reproduce locally

```sh
npm ci --ignore-scripts
npm test
npm run validate:local
npm run bench
```

Re-run these commands against the exact checkout being evaluated and preserve the resulting validation artifacts. Machine-dependent latency and memory results must be measured anew.