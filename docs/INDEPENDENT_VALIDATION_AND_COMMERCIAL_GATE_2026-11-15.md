# ProofGap X — independent validation and commercial evidence gate
Date: 2026-11-15. Scope: competition build only. Status: **NOT CERTIFIED**.

## Verified repository facts
- The public `main` branch contains both ProofGap X and ProofGap Cite, the shared `src/core.js`, `.kiro/` evidence, LICENSE and NOTICE; merged at commit `289ae9249f2df69d6db2f5d15a3520aca19dbf66`.
- An older gate document asserts `main` is 19 commits behind and repository is private. **Those statements are stale** after the merge and public-visibility change on 2026-11-15. Do not reuse them.
- `package.json` declares Apache-2.0 and no runtime dependencies. Licensing files are visible. Do not infer exclusive resale rights.
- Test suites and synthetic benchmark documents exist, but this audit has NOT executed the complete suite from a fresh clone. GitHub Actions outcomes must be inspected independently; a blocked/no-run job is not a pass.
- No third-party security certification, paid customer, real-world accuracy study, or market transaction has been verified.

## Competition obligations — official rules checked 2026-11-15
Source: https://kiroween.devpost.com/rules
- Deadline: 2026-12-04 14:00 PST (22:00 UTC), no extensions.
- New work from submission period 2026-10-30 onward. Preserve truthful git and Kiro authorship chronology.
- Public GitHub repo with OSI open-source license visible at repository level, full reproducible instructions, working application URL or accessible test deployment, public YouTube video under 3 minutes, feature explanation, genuine Kiro usage write-up.
- Stage-one viability/tools gate; five criteria weighted 20% each: impact, Kiro implementation, design, innovation, presentation.
- Skeleton Crew requires a reusable template shown by **two distinct applications**. Verify both apps perform their advertised independent workflows and are not merely renamed skins.
- A public Apache-2.0 release allows commercial third-party redistribution/modification. Copyright ownership is retained but proprietary exclusivity over published code is not.
- Check eligibility, region exclusions, category and live deployment before pressing Submit. Submission not verified in this audit.

## Must-pass engineering gate (all reproducible)
1. Freeze commit SHA, Node/npm versions, platform and complete commands. Clean clone of `main`; `npm ci --ignore-scripts && npm test && npm run validate:local`. Attach raw stdout/stderr, exit codes and git status. No undocumented fixes or selective reruns.
2. Rebuild both offline showcases from source; compare bytes with committed exports. Test functional inputs, malformed JSON, zero/duplicate origins, cycles, conflicting assertions, unknown roots, Unicode and large inputs.
3. Security: static secret scan on full public history; investigate file root/symlink races, hard links, size/time limits, archive/path traversal, HTML XSS, CSP, output escaping and prototype pollution. A passing test suite is NOT an independent security audit.
4. Adversarial metamorphic tests: permutations cannot change verdict; duplicating an identical source cannot inflate independent origins; a derivative bridge cannot collapse unrelated roots; extra uncited sources cannot change a claim's local decision; hidden dependency without a signal must be marked as a limitation.
5. Browser UX: test offline and hosted versions on Android Chrome, Firefox, Safari and screen-reader keyboard usage; 320px layout; export report unchanged from CLI. Currently not independently verified.
6. Performance: 30 repeated cold/warm runs per predeclared case size, median/p95, peak RSS, CPU/OS, timeout/resource rate; keep failed runs in denominator; measure against same machine and corpus.

## Fair head-to-head benchmark protocol
- Freeze executable and the evaluator before opening the independent cases.
- Have an evaluator who did NOT write the model assemble consented, legally shareable real or realistically transformed evidence cases; preserve signed ground truth with provenance, unknown/ambiguous class and adjudicator disagreements.
- Compare EXACT SAME task and input accessibility for ProofGap X vs baseline B0 naive-document-count, B1 distinct-origin-label count, B2 cryptographic deduplication, B3 independent human review. Do not claim broad superiority over Cellebrite/Magnet without licensed access and identical-task tests.
- Stratify declared/undeclared duplication, byte-identical/re-encoded copies, common public documents, contradictory evidence, cyclic citation, temporal red herrings, and inaccessible sources. Split by **source family**, not merely random seed.
- Score positive independent corroboration by precision, recall, FPR, abstention rate, calibration error only if probability calibrated; also investigator time and corrective actions. Report confusion matrices, Wilson/bootstrapped 95% intervals and every excluded case.
- Predeclare primary success: materially lower FPR than B1 at non-inferior recall, plus zero critical integrity/privacy regressions. Failure to achieve either blocks a superiority claim.
- Explicit known weakness from existing author-built synthetic benchmark: ProofGap Cite with saved files held-out FP 66/525 and FN 47/170; re-encoded reposts missed 66/66. These are not population performance estimates.

## Competitive claims boundary
Official product pages (feature claims, not independent experimental comparisons):
- Cellebrite Pathfinder: https://cellebrite.com/en/products/pathfinder/ — multi-source investigative analytics, timeline, relationships.
- Cellebrite Guardian: https://cellebrite.com/en/products/guardian/ — evidence lifecycle, chain of custody and collaboration.
- Magnet AXIOM: https://www.magnetforensics.com/products/magnet-axiom/ — acquisition/analysis across device/cloud artifacts.
ProofGap X: offline small-core explainable evidence-dependence and explicit counterfactual proof gaps. **Potential complementary niche**, not a proven replacement for forensic acquisition suites. No measured head-to-head win recorded.

## Commercial value gate
- **Commercial thesis (hypothesis, not validation):** paid expert workflows that detect unsupported corroboration and generate defensible, exportable evidence-gap explanations.
- Interview at least 10 qualified independent purchasers (law enforcement review units, litigation eDiscovery, newsroom fact-checking); capture unmet need, budget holder, existing procurement process, security constraints and willingness to pay.
- Obtain 3 documented pilots with approved non-sensitive datasets; compare investigator time and confirmed erroneous corroboration prevented against current workflow.
- Obtain at least one signed paid pilot, purchase order, or verifiable letter of intent before claiming monetary market validation. Record price, license scope, support burden and deployment costs.
- Prepare a buyer diligence data room: source provenance, SBOM, license obligations, reproducible benchmarks, test logs, security review, threat model, IP chain of title, liabilities, customer permissions and support obligations.
- **Sale options:** open-source-compatible paid support/hosting/integration, a separately developed proprietary premium module without copied ATHARNEX/EvidenceForge X code, or sale of project assets/brand and future rights **subject to existing Apache-2.0 licenses**. No claim of exclusive ownership over previously published Apache-licensed copies.
- No invented valuation. Use verified recurring revenue, margins, comparable transactions and buyer interest to justify a price; a contest win alone does not prove enterprise acquisition value.

## Release decision
**Engineering:** NOT CERTIFIED — clean-clone test rerun + independent security + external dataset absent.
**Competition:** PARTIAL — public code/license/Kiro records present; live working URL, video and Devpost submission not verified here.
**Superiority:** NOT PROVEN outside author-built synthetic scenarios.
**Commercial value:** PLAUSIBLE HYPOTHESIS, not verified sales or valuation.

Never use ATHARNEX or EvidenceForge X source, data, credentials, or assets in this repository. Never replace an unknown result with a green badge.
