# Local validation 20261114T065204Z

Node v20.20.2, npm 11.4.2, linux 6.1.189-236.400.amzn2023.x86_64 x64, 8× Intel(R) Xeon(R) Platinum 8488C, 31560 MB
Commit 000e2b40828107b566e21abb26e8d19dab08d4d0 (feature/phase7-release-candidate); uncommitted files at run time: 2

| Group | Command | Tests | Pass | Fail | Exit |
|---|---|---|---|---|---|
| all | `npm test` | 159 | 159 | 0 | 0 |
| security | `node --test test/security.test.js test/integrity.test.js test/observed.test.js test/fuzz.test.js test/cli.test.js test/schema.test.js` | 67 | 67 | 0 | 0 |
| provenance | `node --test test/regression.test.js test/adversarial.test.js test/metamorphic.test.js test/gaps.test.js test/proofgap.test.js` | 68 | 68 | 0 | 0 |
| fileIntegrity | `node --test test/integrity.test.js test/observed.test.js` | 26 | 26 | 0 | 0 |
| viewerAndPlanner | `node --test test/viewer.test.js test/planner.test.js test/graph.test.js` | 14 | 14 | 0 | 0 |
| benchmarkTests | `node --test test/benchmark.test.js test/demo.test.js` | 10 | 10 | 0 | 0 |

Benchmark accuracy identical to `bench/results/phase5-run1.json`: **true** (exit 0).
File-backed benchmark identical to `bench/results/phase6-files-heldout3.json`: **true** (exit 0).

GitHub Actions CI: **BLOCKED_BY_BILLING** (not PASSED, not CODE_FAILED).

Overall local result: **ALL LOCAL CHECKS PASSED**
NOT TESTED: Node 20, Windows, macOS, case-insensitive filesystems, real-world case data, browsers other than headless Chromium (viewer), screen readers (viewer)
