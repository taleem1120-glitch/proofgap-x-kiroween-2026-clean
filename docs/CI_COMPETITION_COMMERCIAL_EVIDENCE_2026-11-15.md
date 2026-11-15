# ProofGap X — CI evidence, competition fit and market differentiation
Evidence date: 2026-11-15. Branch commit: b31881dd79ce6ecba91c224e5815e23145819d74.
Run: https://github.com/taleem1120-glitch/proofgap-x-kiroween-2026-clean/actions/runs/43747304551

## Verified CI results
- GitHub-hosted runner: Node.js 20 and 22 jobs both SUCCESS. Jobs execute npm ci --ignore-scripts, npm test, and smoke tests for BOTH applications.
- Node 22 full suite: 209 pass, 0 fail; targeted security/metamorphic/benchmark suite: 27 pass, 0 fail (subset re-run, NOT additional distinct coverage).
- Synthetic 300-fixture diagnostic: exact SHA-256 baseline TP=100, FP=0, TN=100, FN=100, recall 50%; advisory normalized-text 5-token-shingles TP=200, FP=0, TN=100, FN=0, recall 100%.
- The 300 fixtures are author-generated (100 exact copies, 100 formatting-only changes, 100 unrelated texts). This is only a mechanism sanity test. There is no blinded dataset, independent ground-truth panel, quantified out-of-distribution false-positive rate or commercial-vendor head-to-head.
- Text resemblance remains advisory and is NOT integrated into evidentiary verdicts. High textual overlap cannot validate genuine common origin.

## Explicit competitive boundary, based on official vendor descriptions
| Product | Published vendor capabilities | ProofGap X evidence | Competitive inference |
|---|---|---|---|
| Cellebrite Pathfinder | Aggregation from 30+ digital data sources, timelines, link analysis, media AI | Offline declared-origin counting, abstention, counterfactual missing-evidence plan | Complementary reasoning layer, NOT an equivalent acquisition/analytics suite |
| Magnet AXIOM | Recovery and analysis of mobile/computer/cloud/vehicle sources, visual connections and timeline | Structured-case evidence analysis with optional local-file integrity | Complementary provenance review, NOT a replacement |

Official vendor sources:
- https://cellebrite.com/en/products/pathfinder/
- https://www.magnetforensics.com/products/magnet-axiom/

Vendor statistics are vendor claims, not independently verified performance. No direct task-equivalent benchmark has been run.

## Mandatory validation before a superiority or enterprise-ready claim
1. Independent blind held-out corpus with documented adjudication, permissions and source-family separation; measure precision, recall, FPR and abstention including quotation, syndicated boilerplate and genuinely independent identical files.
2. Performance profile with n≥30 runs per workload, cold/warm median and p95, peak RSS; failures and timeouts included.
3. Independent penetration review: race conditions, symlink/file swaps, malicious HTML/Markdown/JSON, denial-of-service, content leakage, and supply-chain integrity; evaluate browsers and OS supported by sales claims.
4. End-to-end publicly accessible two-app demo on the intended platform plus a public YouTube demo <3 minutes showing authentic operation.
5. Confirm the submission license is detectable in the repo header, Kiro usage is authentic, and submit by Dec 4 2026 2pm PST. Skeleton Crew category requires one reusable skeleton and two distinct implementations.
6. Commercial proof must come from actual buyer interviews, written pilot permissions, time-saved metrics, signed intent or payments. Avoid unsupported high valuations.

## Licensing/IP
Apache-2.0 published source remains reusable under its license; sale of proprietary exclusivity over already-released copies is not possible. Support, hosting, bespoke integration or separately owned future innovations can be commercial. Never copy ATHARNEX or EvidenceForge X proprietary code into this competition repo.

## Release status
CI regression gate = PASS at the cited commit. Independent security = NOT DONE. External benchmarks = NOT DONE. Public live demo/video = NOT VERIFIED. Market validation = NOT DONE. Overall release = NOT YET CERTIFIED.
