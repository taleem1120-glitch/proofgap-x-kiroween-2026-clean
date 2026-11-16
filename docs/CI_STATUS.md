# CI status

**Current verified state (2026-11-17): pull-request CI is running successfully.** Earlier billing-blocked runs remain historical facts, but they no longer describe the latest workflow state.

## Successful review runs

All results below are for PR #17, branch `fix/integrity-root-containment-2026-11-17`, commit `c0dc3517744c01827e593541239674d319d23499`. They are review-branch results, not a claim that the same change is on `main`.

| Workflow | Run | Result | Details |
|---|---:|---|---|
| CI | [43969811457](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43969811457) | **success** | Node 20 and Node 22 jobs both completed successfully |
| Browser smoke for multilingual offline viewers | [43969811822](https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43969811822) | **success** | Chromium job completed; mobile visual-review artifact uploaded |

The CI workflow includes the repository's test and validation steps. The browser workflow exercises the offline viewers. These results establish that the configured jobs passed on this commit; they are not an independent penetration test, forensic validation, cross-browser certification, or proof of real-world accuracy.

## Historical billing-blocked runs

Earlier runs 43509421759 and 43509432406 on commit `356953f` did not start because GitHub reported an account billing/spending-limit issue. Those runs were **BLOCKED_BY_BILLING**, not code failures and not passes. The later successful PR #17 runs supersede the old statement that no remote CI result exists.

## Scope and remaining gaps

- PR #17 remains an open draft and has **not** been merged into `main`.
- Do not describe PR #17 as released or as part of the default branch until it is merged by the owner.
- Windows/macOS and Firefox/Safari remain untested.
- No independent security review or penetration test has been performed.
- Synthetic benchmark results are not real-world accuracy evidence.

## Reproduce locally

```sh
npm ci
npm test
npm run validate:local
npm run bench
```

Local validation is useful additional evidence, but is not interchangeable with CI or independent review.
