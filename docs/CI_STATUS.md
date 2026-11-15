# CI status

**GitHub Actions: `BLOCKED_BY_BILLING`.** This is neither `PASSED` nor `CODE_FAILED`.

- Workflow: `.github/workflows/ci.yml` (Node 20 and 22, `npm ci --ignore-scripts`, `npm test`, demo smoke test). **Preserved unchanged for future execution.**
- Observed (GitHub API, commit `356953f`): runs 43509421759 (push) and 43509432406 (pull_request). Both matrix jobs executed **zero steps** and had no runner. Annotation: "The job was not started because recent account payments have failed or your spending limit needs to be increased."
- No remote CI result exists. Do not cite any CI result for this project until the owner resolves billing and a run actually executes.
- Billing settings were not changed; blocked jobs were not re-run; later commits use `[skip ci]` so no further blocked runs are queued. To resume CI, the owner fixes billing and re-runs the workflow (or pushes without `[skip ci]`).

## What substitutes for CI meanwhile (local only, not equivalent)
`npm run validate:local` runs the full suite, focused security / provenance / file-integrity groups and the deterministic benchmark, and records results under `validation/<UTC-id>/` (commands, exact counts, Node/npm/OS/CPU, git commit, lockfile and schema hashes, raw logs). Local runs are on one Linux machine. Since Phase 7 the suite has also been run locally on **Node 20.20.2 and 24.22.1** (159/159 each), in addition to 22.23.4. That is not a CI result, and Windows/macOS remain NOT TESTED.

## Reproduce
```sh
npm ci
npm test
npm run validate:local        # writes validation/<id>/ (fails if the directory exists; never overwrites)
npm run bench                 # benchmark only
```
Benchmark accuracy is deterministic (seeded) and is compared with `bench/results/phase3-run1.json`; latency and memory vary by machine and are not compared.
