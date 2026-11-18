# CI status — 18 November 2026

## Current verified state

- The pre-merge head of PR #28 (`c92a48a24de34e9613b55ba6047f733e7f0ade35`) passed the standard CI workflow on Node.js 20 and 22.
- The same PR head passed the cross-browser and security workflow:
  - Chromium compatibility: success
  - Firefox compatibility: success
  - WebKit compatibility: success
  - Dependency and security regression audit: success
- PR #28 was merged into `main` with merge commit `0be10c760f295de094f5934f81a45c31cfd5719e`.
- Post-merge runs on `main` were started on 18 November 2026 and were still queued / in progress when this file was updated:
  - [CI](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/44268373432)
  - [Cross-browser compatibility and security audit](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/44268373400)
  - [GitHub Pages deployment](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/44268373102)

Do not describe the post-merge `main` checks or deployment as passed until those runs complete successfully. The earlier `BLOCKED_BY_BILLING` observations below are historical and do not describe the latest PR #28 validation.

## Historical billing-blocked runs

Earlier runs on November 15–16 were blocked before jobs started because of an account billing/spending-limit restriction. Those runs were neither code failures nor successful CI results. They are retained in GitHub history but have been superseded by the successful PR #28 validation.

## Reproduce locally

```sh
npm ci --ignore-scripts
npm test
npm run validate:local
npm run bench
```

Local validation is useful but is not a substitute for CI or independent security review. Benchmark inputs are synthetic and author-built. Latency and memory vary by machine.