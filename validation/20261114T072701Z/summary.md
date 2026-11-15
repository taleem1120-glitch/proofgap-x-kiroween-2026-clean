# Local validation 20261114T072701Z

Node v20.20.2, npm 11.4.2, linux 6.1.189-236.400.amzn2023.x86_64 x64, 8× Intel(R) Xeon(R) Platinum 8488C, 31560 MB
Commit 4b34eadbb039bc21a7f46b3d3cdfd26ef22c8d14 (feature/phase11-dual-application); uncommitted files at run time: 2

| Group | Command | Tests | Pass | Fail | Exit |
|---|---|---|---|---|---|
| all | `npm test` | 195 | 195 | 0 | 0 |
| security | `node --test test/security.test.js test/integrity.test.js test/observed.test.js test/fuzz.test.js test/cli.test.js test/schema.test.js` | 68 | 68 | 0 | 0 |
| provenance | `node --test test/regression.test.js test/adversarial.test.js test/metamorphic.test.js test/gaps.test.js test/proofgap.test.js` | 68 | 68 | 0 | 0 |
| fileIntegrity | `node --test test/integrity.test.js test/observed.test.js` | 26 | 26 | 0 | 0 |
| viewerAndPlanner | `node --test test/viewer.test.js test/planner.test.js test/graph.test.js` | 14 | 14 | 0 | 0 |
| coreAndCite | `node --test test/core.test.js test/cite.test.js` | 33 | 33 | 0 | 0 |
| benchmarkTests | `node --test test/benchmark.test.js test/demo.test.js` | 12 | 12 | 0 | 0 |

Benchmark accuracy identical to `bench/results/phase5-run1.json`: **true** (exit 0).
File-backed benchmark identical to `bench/results/phase6-files-heldout3.json`: **true** (exit 0).
Cite benchmark identical to `bench/results/phase11-cite-heldout.json`: **true** (exit 0).

GitHub Actions CI: **BLOCKED_BY_BILLING** (not PASSED, not CODE_FAILED).

Overall local result: **ALL LOCAL CHECKS PASSED**
NOT TESTED: Node 20, Windows, macOS, case-insensitive filesystems, real-world case data, browsers other than headless Chromium (viewer), screen readers (viewer)
