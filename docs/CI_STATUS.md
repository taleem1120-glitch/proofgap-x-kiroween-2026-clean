# CI status — 18 November 2026

## Verified pre-merge validation

- PR #28 head `c92a48a24de34e9613b55ba6047f733e7f0ade35` passed the standard CI workflow on Node.js 20 and 22.
- The same PR head passed the cross-browser and security workflow: Chromium, Firefox, WebKit, dependency audit, adversarial security regressions, and source/release gate.
- PR #28 was merged into `main` with merge commit `0be10c760f295de094f5934f81a45c31cfd5719e`.

## Post-merge status

- The first standard CI and Pages runs for the merge commit were cancelled when subsequent documentation-only commits superseded the commit being built.
- The cross-browser/security workflow for the merge commit was still in progress at the last check.
- A new push of this status correction will trigger fresh checks on the current `main`. Treat those post-merge checks as pending until GitHub reports a final successful conclusion.
- [GitHub Actions runs](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions).

## Historical billing-blocked runs

Earlier runs on November 15–16 were blocked before jobs started because of an account billing/spending-limit restriction. Those runs were neither code failures nor successful CI results. They are historical and do not describe the successful PR #28 head validation.

## Reproduce locally

```sh
npm ci --ignore-scripts
npm test
npm run validate:local
npm run bench
```

Local validation is useful but is not a substitute for CI or independent security review. Benchmark inputs are synthetic and author-built. Latency and memory vary by machine.