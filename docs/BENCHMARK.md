# ProofGap X — Benchmark

## Phase 12: opt-in saved-text review — fresh cohort, measurement pending

Phase 11's file-backed Cite benchmark did **not** enable `reviewTextCopies`; its 66 false positives on `reencoded_repost` therefore remain valid for that exact configuration. They must not be presented as a measured result for the newer opt-in saved-text review path.

A separate synthetic cohort is reserved at seeds **700001–700150** (`textReviewHeldout`), disjoint from the Phase 11 development and held-out seed ranges. In this cohort, `reencoded_repost` cases contain long UTF-8 documents with a small textual edit and formatting/encoding changes, so the opt-in shared-passage and near-duplicate saved-text cues are actually exercised. Historical Phase 11 cases retain their original generator and are unchanged.

Reproduce the new diagnostic with:

```sh
node --expose-gc bench/cite/run.js textReviewHeldout --review-text-copies
```

The CI job runs this diagnostic on Node 22. **Metrics are pending until that exact job completes.** This is still an author-generated synthetic test, not an independent or real-world accuracy evaluation. Keep false positives, false negatives, abstentions, per-scenario results, and limitations visible; do not tune thresholds against this cohort and then describe it as untouched validation.

## Phase 11: ProofGap Cite (application 2)
**Read first.** The benchmark is synthetic and author-built (`bench/cite/dataset.js`), and its scenarios encode the rules Cite implements. The numbers show the implementation follows its specification and expose its designed blind spots. They are **not** evidence of real-world accuracy, and there is no external comparison.

- **Task.** Per claim, decide whether it is *independently corroborated*. Hidden truth, never written into the note: ≥ 2 truly independent primary origins and no contradiction. Positive prediction means verdict `independently_corroborated`.
- **Scenarios.** 11 templates, including two that are deliberately **indistinguishable from the note alone**:
  - `undeclared_independent` (truth yes) and `undeclared_echo` (truth no) look identical, and Cite abstains on both;
  - `reencoded_repost` (truth no): two "primary" refs with different URLs whose saved copies differ by a suffix.
- **Splits.** dev: seeds 1–150, used during development. **held-out:** seeds 500001–500150, generated and evaluated **once** after the Phase 11 code freeze. Tests assert the splits are disjoint and that truth never appears in the notes.
- **Baselines** count supporting citations, distinct normalised URLs, or distinct outlet names.

| Split | Detector | TP | FP | TN | FN | Precision | Recall | FPR |
|---|---|---|---|---|---|---|---|---|
| dev | ≥ 2 citations | 170 | 413 | 78 | 0 | 29.2% (170/583) | 100.0% (170/170) | 84.1% (413/491) |
| dev | ≥ 2 distinct URLs | 170 | 356 | 135 | 0 | 32.3% (170/526) | 100.0% (170/170) | 72.5% (356/491) |
| dev | ≥ 2 distinct outlets | 170 | 413 | 78 | 0 | 29.2% (170/583) | 100.0% (170/170) | 84.1% (413/491) |
| dev | Cite, no saved files | 112 | 117 | 374 | 58 | 48.9% (112/229) | 65.9% (112/170) | 23.8% (117/491) |
| dev | Cite, with saved files | 112 | 55 | 436 | 58 | 67.1% (112/167) | 65.9% (112/170) | 11.2% (55/491) |
| held-out | ≥ 2 citations | 170 | 447 | 78 | 0 | 27.6% (170/617) | 100.0% (170/170) | 85.1% (447/525) |
| held-out | ≥ 2 distinct URLs | 170 | 393 | 132 | 0 | 30.2% (170/563) | 100.0% (170/170) | 74.9% (393/525) |
| held-out | ≥ 2 distinct outlets | 170 | 447 | 78 | 0 | 27.6% (170/617) | 100.0% (170/170) | 85.1% (447/525) |
| held-out | Cite, no saved files | 123 | 137 | 388 | 47 | 47.3% (123/260) | 72.4% (123/170) | 26.1% (137/525) |
| held-out | Cite, with saved files | 123 | 66 | 459 | 47 | 65.1% (123/189) | 72.4% (123/170) | 12.6% (66/525) |

**Held-out per scenario** (positive predictions; claims per scenario = n):

| Scenario | Truly corroborated | n | ≥ 2 URLs | Cite, no files | Cite, with files | Cite verdicts (with files) |
|---|---|---|---|---|---|---|
| circular | no | 75 | 75 | 0 | 0 | circular_reporting 75 |
| conflicting | no | 33 | 33 | 0 | 0 | conflicting 33 |
| echo_declared | no | 91 | 91 | 0 | 0 | single_origin 91 |
| echo_identical_files | no | 71 | 71 | 71 | 0 | single_origin 71 |
| reencoded_repost | no | 66 | 66 | 66 | 66 | independently_corroborated 66 |
| single_primary | no | 48 | 0 | 0 | 0 | single_origin 48 |
| syndicated_same_url | no | 54 | 0 | 0 | 0 | abstain_suspected_shared_origin 54 |
| two_primaries | yes | 123 | 123 | 123 | 123 | independently_corroborated 123 |
| undeclared_echo | no | 57 | 57 | 0 | 0 | origin_unresolved 57 |
| undeclared_independent | yes | 47 | 47 | 0 | 0 | origin_unresolved 47 |
| unsupported | no | 30 | 0 | 0 | 0 | unsupported 30 |

**Reading the held-out table honestly:**
- **All 66 Cite false positives are `reencoded_repost`.** Bytes differ, URLs differ, and nothing declared links them, so the tool cannot see it. This is the main open weakness.
- **All 47 false negatives are `undeclared_independent`.** Cite deliberately abstains (`origin_unresolved`) when no primary source is declared. Crediting them would also credit the 57 `undeclared_echo` claims, which look identical.
- **Saved-file hashing removes the 71 `echo_identical_files` false positives** (no files 137 FP → with files 66 FP).
- **Same-URL syndication** (54) is caught by the identifier cue without files.
- 95% Wilson intervals treat claims as independent, which is optimistic.

**Latency and memory** (Node v22.23.4, one machine, one pass): median 2.23 ms per note including saved-file hashing. A large note (200 claims, 500 references) took 65.4 ms with heap +15.4 MB.

Application 1's benchmarks below are unchanged: Phase 11 did not change the analysis policy (0.4.0), and `npm run validate:local` re-checks them byte for byte.

---

## Phase 6 (engine 0.4.0): verified byte identity from local files

### Root cause of "37/88" (Phase 5, heldout2)
- **Metric.** "37/88" is the *heuristic-warning recall* on claims whose ground truth has an **undeclared** shared origin. The same 37 claims are the abstentions, so the decision's false-positive rate on that slice is 51/88. Denominator: 88 claims, made up of 51 `undeclared_copy` and 37 `undeclared_copy_with_cues`.
- **Failure mode.** All 37 caught claims are `undeclared_copy_with_cues` (same source name or identical description). **All 51 missed claims are `undeclared_copy`**, which by construction carries no cue.
- **What case data alone can show.** On heldout2, each of those 51 claims has exactly the same structural signature as 78 `genuine_independent` claims: same item and source counts, no derivation, no group, no hash, distinct names, distinct descriptions. The split is 26 vs 31 with 3 items and 25 vs 47 with 2 items. Only the generator's naming words differ, and a fair detector must not use them. **From case JSON alone these claims are indistinguishable.** Any rule that flagged them would flag genuine corroboration equally often. The Phase 5 result is a limit of the information available, not a tunable defect.
- **What can be verified instead.** When the evidence files are available, the bytes can be checked. 0.3.0 compared files only against *declared* hashes, so a copy whose hash the author never recorded stayed "unknown". 0.4.0 hashes every safely readable non-empty file under `--evidence-dir` and treats identical bytes as one artifact. The relationship basis is **verified for the bytes only**. That the holders share an origin is the same policy inference already applied to declared hashes, and the SHARED_ARTIFACT warning still fires.

### File-backed benchmark (`bench/files.js`, `bench/run-files.js`)
- Same generator and seeds as the case-data benchmark; no RNG call was added. Each evidence item gets one local file. Items that declare a synthetic `sha256` get no file, because their fake digests would only produce MISMATCH.
- Each undeclared copy gets a copy mode chosen deterministically from `sha256(caseId|claimId)`:
  - **byte_identical:** one attachment forwarded through two channels.
  - **re-encoded:** the same text plus an item-specific suffix, so the bytes differ.
  The roughly 50/50 mix is **arbitrary**, so aggregate numbers depend on it. Read the per-mode columns.
- Before and after run on **identical materialized cases**, both with `--evidence-dir`: 0.3.0 from `bench/legacy/v0.3.0` (a verbatim git snapshot of `d8698a5`) and the current 0.4.0.
- Splits: **dev** (seeds 1–200) was used during development. **heldout3** (seeds 300001–300200) was generated and evaluated **once**, after the engine freeze. heldout2 was not reused.
- Sanity check: on dev, the 0.3.0 file-backed undeclared FPR (57/95) equals the Phase 5 case-data-only dev figure. Materializing files therefore does not change 0.3.0 outcomes.

| Split / engine | Declared FPR | Declared recall | Undeclared byte-identical: falsely asserted | Undeclared re-encoded: falsely asserted | Undeclared FPR (decision) | Precision (all) | FPR (all) |
|---|---|---|---|---|---|---|---|
| dev · 0.3.0 (before) | 0/465 | 327/327 | 27/47 | 30/48 | 57/95 | 327/384 | 57/560 |
| dev · 0.4.0 (after) | 0/465 | 327/327 | 0/47 | 30/48 | 30/95 | 327/357 | 30/560 |
| heldout3 · 0.3.0 (before) | 0/479 | 315/315 | 32/43 | 24/47 | 56/90 | 315/371 | 56/569 |
| heldout3 · 0.4.0 (after) | 0/479 | 315/315 | 0/43 | 24/47 | 24/90 | 315/339 | 24/569 |

New verified (local-hashing) links: dev 47 claims, heldout3 43 claims; of these, on truly corroborated claims: 0 and 0. Median time per case on heldout3 (hashing + analysis): 0.3.0 0.54 ms, 0.4.0 0.76 ms (machine dependent, one pass).

### What this does and does not show
- **Shows the mechanism works:** byte-identical undeclared copies are no longer asserted as corroboration (heldout3: 32/43 before, 0/43 after). Declared scenarios are unchanged (FPR 0/479 and recall 315/315 for both engines). Without `--evidence-dir`, results are identical to 0.3.0 (tested on 120 generated cases).
- **Does not show real-world detection rates.** The data is synthetic and the copy-mode mix is arbitrary.
- **Over-merging is not measured.** In this generator, independent sources never share byte-identical files. In real cases they can (a public PDF, a logo, a template), and 0.4.0 would then **over-merge**. That is a conservative error that lowers recall, and this benchmark cannot measure it.
- **Re-encoded, cropped or transcribed copies remain undetectable.** On heldout3, 24/47 are still falsely asserted. The ones that are caught were caught by the Phase 5 cues, not by hashing.

---

## Phase 5 record (engine 0.3.0, case data only; still reproducible and unchanged)
**Read this first.** Synthetic benchmark written by the same engineer who wrote the tool. The "declared-provenance" scenarios encode the same independence model the tool implements, so a perfect score there is a **consistency check against the specification, not evidence of real-world accuracy**. No claim of superior accuracy on real investigations is made or supported.

## Phase 5 (current: engine 0.3.0, `bench/results/phase5-run1.json`)

### What changed and why (all changes documented, none hidden)
1. **The "100% false positive" result, investigated.** Its denominator was the *undeclared-copy* slice only: 89 held-out claims in Phase 3 (44 + 45 in dev), where two sources truly share an origin but the case does not say so. Every detector that trusts declared provenance must call those "corroborated"; the 100% is a property of the task, not a bug. Phase 3 also scored only the hard classification, so warnings and abstention were invisible. Phase 5 therefore reports three things **separately**:
   - **hard classification** (`status`, unchanged policy: ≥2 independent declared origins),
   - **decision** (`decision`: same, except it ABSTAINS when a heuristic cue touches two of the claim's support origins; abstention = "not asserted"),
   - **heuristic warnings** as their own detection task (cue fired on a claim vs hidden dependence in ground truth).
2. **Label correction (`bridge_three_roots`).** Phase 3 labelled "r1, r2 and a bridge derived from both" as **1** true origin. That label copied the engine's own union-find rule, which defect D10 showed to be wrong: a bridge derived from r1 and r2 does not make r1 and r2 depend on each other. The generator creates r1 and r2 as separate originals, so the true count is **2**. The fix happened after the engine was redesigned, and Phase 3's 0.2.0 numbers on this scenario were wrong **because of the label**. Both versions are reported below on the corrected label.
3. **Two scenario templates added before any Phase 5 held-out run:** `bridge_only` (1 origin + a merge of it → 1) and `denial_bridge` (D10 attack: 2 originals + a cited derivative of both → 2).
4. **Splits.** Adding templates changes what every seed generates, so the Phase 3 held-out *seeds* (100001–100200) now produce different cases; that split is reported but is **not pristine** (its seed range was used in Phase 3 and engine fixes D9–D12 were made after it). **`heldout2` (seeds 200001–200200) is the clean evaluation**: generated and evaluated once, after the Phase 5 engine freeze.
5. **New detectors:** `P_proofgap_0_2_0` (Phase 3 engine, verbatim snapshot in `bench/legacy/v0.2.0/`) and `P_proofgap_current_decision`.

### Headline (heldout2, 885 claims; 95% Wilson CIs in the tables below)
| Measure | Value |
|---|---|
| Declared scenarios: current FPR / recall | 0/485, 312/312 |
| Declared scenarios: 0.2.0 recall (over-merging, D10) | 263/312 |
| Declared scenarios: "originals only" baseline recall | 249/312 (FPR 0/485) |
| Undeclared copies: hard-classification FPR (all detectors) | 88/88 |
| Undeclared copies: decision FPR with abstention | 51/88 |
| Heuristic warnings: precision / recall / FPR | 37/37, 37/88, 0/797 |
| Abstentions on truly corroborated claims | 0 of 37 abstentions |

Interpretation: abstention catches **only** undeclared copies that leave a cue (same source name, identical description, shared artifact across lineages). The `undeclared_copy` template with no cues is still missed 100% by design, and is the open problem.

### Results (generated by `node bench/format.js bench/results/phase5-run1.json`)

### dev: 200 cases, 887 claims, 327 truly corroborated (seeds 1..200)

**Declared-provenance scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 47.4% (43.7–51.1) 327/690 | 100.0% (98.8–100.0) 327/327 | 78.1% (74.1–81.6) 363/465 |
| B1_distinct_sources | 51.1% (47.2–54.9) 327/640 | 100.0% (98.8–100.0) 327/327 | 67.3% (62.9–71.4) 313/465 |
| B2_dedupe_hash_then_sources | 57.0% (52.9–61.0) 327/574 | 100.0% (98.8–100.0) 327/327 | 53.1% (48.6–57.6) 247/465 |
| B3_originals_only | 100.0% (98.6–100.0) 267/267 | 81.7% (77.1–85.5) 267/327 | 0.0% (0.0–0.8) 0/465 |
| P_proofgap_0_1_0 | 80.9% (76.8–84.5) 327/404 | 100.0% (98.8–100.0) 327/327 | 16.6% (13.5–20.2) 77/465 |
| P_proofgap_0_2_0 | 100.0% (98.6–100.0) 273/273 | 83.5% (79.1–87.1) 273/327 | 0.0% (0.0–0.8) 0/465 |
| P_proofgap_current | 100.0% (98.8–100.0) 327/327 | 100.0% (98.8–100.0) 327/327 | 0.0% (0.0–0.8) 0/465 |
| P_proofgap_current_decision | 100.0% (98.8–100.0) 327/327 | 100.0% (98.8–100.0) 327/327 | 0.0% (0.0–0.8) 0/465 |

**Undeclared-copy scenarios (hidden dependence)**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 0.0% (0.0–3.9) 0/95 | n/a | 100.0% (96.1–100.0) 95/95 |
| B1_distinct_sources | 0.0% (0.0–3.9) 0/95 | n/a | 100.0% (96.1–100.0) 95/95 |
| B2_dedupe_hash_then_sources | 0.0% (0.0–3.9) 0/95 | n/a | 100.0% (96.1–100.0) 95/95 |
| B3_originals_only | 0.0% (0.0–3.9) 0/95 | n/a | 100.0% (96.1–100.0) 95/95 |
| P_proofgap_0_1_0 | 0.0% (0.0–3.9) 0/95 | n/a | 100.0% (96.1–100.0) 95/95 |
| P_proofgap_0_2_0 | 0.0% (0.0–3.9) 0/95 | n/a | 100.0% (96.1–100.0) 95/95 |
| P_proofgap_current | 0.0% (0.0–3.9) 0/95 | n/a | 100.0% (96.1–100.0) 95/95 |
| P_proofgap_current_decision | 0.0% (0.0–6.3) 0/57 | n/a | 60.0% (49.9–69.3) 57/95 |

**All scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 41.7% (38.3–45.1) 327/785 | 100.0% (98.8–100.0) 327/327 | 81.8% (78.4–84.8) 458/560 |
| B1_distinct_sources | 44.5% (40.9–48.1) 327/735 | 100.0% (98.8–100.0) 327/327 | 72.9% (69.0–76.4) 408/560 |
| B2_dedupe_hash_then_sources | 48.9% (45.1–52.7) 327/669 | 100.0% (98.8–100.0) 327/327 | 61.1% (57.0–65.0) 342/560 |
| B3_originals_only | 73.8% (69.0–78.0) 267/362 | 81.7% (77.1–85.5) 267/327 | 17.0% (14.1–20.3) 95/560 |
| P_proofgap_0_1_0 | 65.5% (61.3–69.6) 327/499 | 100.0% (98.8–100.0) 327/327 | 30.7% (27.0–34.7) 172/560 |
| P_proofgap_0_2_0 | 74.2% (69.5–78.4) 273/368 | 83.5% (79.1–87.1) 273/327 | 17.0% (14.1–20.3) 95/560 |
| P_proofgap_current | 77.5% (73.3–81.2) 327/422 | 100.0% (98.8–100.0) 327/327 | 17.0% (14.1–20.3) 95/560 |
| P_proofgap_current_decision | 85.2% (81.3–88.4) 327/384 | 100.0% (98.8–100.0) 327/327 | 10.2% (7.9–13.0) 57/560 |

**Per-scenario correct counts**

| Scenario | kind | truth | claims | 0.1.0 | 0.2.0 | current status | current decision |
|---|---|---|---|---|---|---|---|
| bridge_only | declared | not | 40 | 0 | 40 | 40 | 40 |
| bridge_three_roots | declared | corroborated | 28 | 28 | 0 | 28 | 28 |
| declared_copies | declared | not | 105 | 105 | 105 | 105 | 105 |
| denial_bridge | declared | corroborated | 26 | 26 | 0 | 26 | 26 |
| derived_from_distinct_roots | declared | corroborated | 60 | 60 | 60 | 60 | 60 |
| genuine_independent | declared | corroborated | 127 | 127 | 127 | 127 | 127 |
| genuine_with_copy | declared | corroborated | 86 | 86 | 86 | 86 | 86 |
| group_plus_derivation | declared | not | 37 | 0 | 37 | 37 | 37 |
| hash_laundering | declared | not | 66 | 66 | 66 | 66 | 66 |
| no_support | declared | not | 45 | 45 | 45 | 45 | 45 |
| same_source_duplicates | declared | not | 50 | 50 | 50 | 50 | 50 |
| shared_origin_group | declared | not | 65 | 65 | 65 | 65 | 65 |
| single_item | declared | not | 57 | 57 | 57 | 57 | 57 |
| undeclared_copy | undeclared | not | 57 | 0 | 0 | 0 | 0 |
| undeclared_copy_with_cues | undeclared | not | 38 | 0 | 0 | 0 | 38 |

**Heuristic warnings** (cue fired on a claim (abstentionCues non-empty) vs hidden undeclared dependence in ground truth): precision 100.0% (90.8–100.0) 38/38, recall 40.0% (30.7–50.1) 38/95, FPR 0.0% (0.0–0.5) 0/792.

**Abstention:** 38 of 422 status-SUPPORTED claims abstained (38 truly uncorroborated, 0 truly corroborated).

Latency per case (analyzeCase, ms): median 0.482, p95 1.241, max 5.608.

### heldout: 200 cases, 887 claims, 296 truly corroborated (seeds 100001..100200)

**Declared-provenance scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 43.1% (39.4–46.8) 296/687 | 100.0% (98.7–100.0) 296/296 | 78.4% (74.5–81.7) 391/499 |
| B1_distinct_sources | 46.1% (42.3–50.0) 296/642 | 100.0% (98.7–100.0) 296/296 | 69.3% (65.2–73.2) 346/499 |
| B2_dedupe_hash_then_sources | 53.8% (49.6–57.9) 296/550 | 100.0% (98.7–100.0) 296/296 | 50.9% (46.5–55.3) 254/499 |
| B3_originals_only | 100.0% (98.4–100.0) 242/242 | 81.8% (77.0–85.7) 242/296 | 0.0% (0.0–0.8) 0/499 |
| P_proofgap_0_1_0 | 80.7% (76.3–84.4) 296/367 | 100.0% (98.7–100.0) 296/296 | 14.2% (11.4–17.6) 71/499 |
| P_proofgap_0_2_0 | 100.0% (98.4–100.0) 243/243 | 82.1% (77.3–86.0) 243/296 | 0.0% (0.0–0.8) 0/499 |
| P_proofgap_current | 100.0% (98.7–100.0) 296/296 | 100.0% (98.7–100.0) 296/296 | 0.0% (0.0–0.8) 0/499 |
| P_proofgap_current_decision | 100.0% (98.7–100.0) 296/296 | 100.0% (98.7–100.0) 296/296 | 0.0% (0.0–0.8) 0/499 |

**Undeclared-copy scenarios (hidden dependence)**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 0.0% (0.0–4.0) 0/92 | n/a | 100.0% (96.0–100.0) 92/92 |
| B1_distinct_sources | 0.0% (0.0–4.0) 0/92 | n/a | 100.0% (96.0–100.0) 92/92 |
| B2_dedupe_hash_then_sources | 0.0% (0.0–4.0) 0/92 | n/a | 100.0% (96.0–100.0) 92/92 |
| B3_originals_only | 0.0% (0.0–4.0) 0/92 | n/a | 100.0% (96.0–100.0) 92/92 |
| P_proofgap_0_1_0 | 0.0% (0.0–4.0) 0/92 | n/a | 100.0% (96.0–100.0) 92/92 |
| P_proofgap_0_2_0 | 0.0% (0.0–4.0) 0/92 | n/a | 100.0% (96.0–100.0) 92/92 |
| P_proofgap_current | 0.0% (0.0–4.0) 0/92 | n/a | 100.0% (96.0–100.0) 92/92 |
| P_proofgap_current_decision | 0.0% (0.0–7.0) 0/51 | n/a | 55.4% (45.3–65.2) 51/92 |

**All scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 38.0% (34.7–41.5) 296/779 | 100.0% (98.7–100.0) 296/296 | 81.7% (78.4–84.6) 483/591 |
| B1_distinct_sources | 40.3% (36.8–43.9) 296/734 | 100.0% (98.7–100.0) 296/296 | 74.1% (70.4–77.5) 438/591 |
| B2_dedupe_hash_then_sources | 46.1% (42.3–50.0) 296/642 | 100.0% (98.7–100.0) 296/296 | 58.5% (54.5–62.4) 346/591 |
| B3_originals_only | 72.5% (67.4–77.0) 242/334 | 81.8% (77.0–85.7) 242/296 | 15.6% (12.9–18.7) 92/591 |
| P_proofgap_0_1_0 | 64.5% (60.0–68.7) 296/459 | 100.0% (98.7–100.0) 296/296 | 27.6% (24.1–31.3) 163/591 |
| P_proofgap_0_2_0 | 72.5% (67.5–77.0) 243/335 | 82.1% (77.3–86.0) 243/296 | 15.6% (12.9–18.7) 92/591 |
| P_proofgap_current | 76.3% (71.8–80.3) 296/388 | 100.0% (98.7–100.0) 296/296 | 15.6% (12.9–18.7) 92/591 |
| P_proofgap_current_decision | 85.3% (81.2–88.6) 296/347 | 100.0% (98.7–100.0) 296/296 | 8.6% (6.6–11.2) 51/591 |

**Per-scenario correct counts**

| Scenario | kind | truth | claims | 0.1.0 | 0.2.0 | current status | current decision |
|---|---|---|---|---|---|---|---|
| bridge_only | declared | not | 36 | 0 | 36 | 36 | 36 |
| bridge_three_roots | declared | corroborated | 27 | 27 | 0 | 27 | 27 |
| declared_copies | declared | not | 101 | 101 | 101 | 101 | 101 |
| denial_bridge | declared | corroborated | 26 | 26 | 0 | 26 | 26 |
| derived_from_distinct_roots | declared | corroborated | 54 | 54 | 54 | 54 | 54 |
| genuine_independent | declared | corroborated | 124 | 124 | 124 | 124 | 124 |
| genuine_with_copy | declared | corroborated | 65 | 65 | 65 | 65 | 65 |
| group_plus_derivation | declared | not | 35 | 0 | 35 | 35 | 35 |
| hash_laundering | declared | not | 92 | 92 | 92 | 92 | 92 |
| no_support | declared | not | 46 | 46 | 46 | 46 | 46 |
| same_source_duplicates | declared | not | 45 | 45 | 45 | 45 | 45 |
| shared_origin_group | declared | not | 82 | 82 | 82 | 82 | 82 |
| single_item | declared | not | 62 | 62 | 62 | 62 | 62 |
| undeclared_copy | undeclared | not | 51 | 0 | 0 | 0 | 0 |
| undeclared_copy_with_cues | undeclared | not | 41 | 0 | 0 | 0 | 41 |

**Heuristic warnings** (cue fired on a claim (abstentionCues non-empty) vs hidden undeclared dependence in ground truth): precision 100.0% (91.4–100.0) 41/41, recall 44.6% (34.8–54.7) 41/92, FPR 0.0% (0.0–0.5) 0/795.

**Abstention:** 41 of 388 status-SUPPORTED claims abstained (41 truly uncorroborated, 0 truly corroborated).

Latency per case (analyzeCase, ms): median 0.420, p95 0.782, max 1.688.

### heldout2: 200 cases, 885 claims, 312 truly corroborated (seeds 200001..200200)

**Declared-provenance scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 45.2% (41.5–48.9) 312/691 | 100.0% (98.8–100.0) 312/312 | 78.1% (74.3–81.6) 379/485 |
| B1_distinct_sources | 48.8% (44.9–52.6) 312/640 | 100.0% (98.8–100.0) 312/312 | 67.6% (63.3–71.6) 328/485 |
| B2_dedupe_hash_then_sources | 54.7% (50.6–58.8) 312/570 | 100.0% (98.8–100.0) 312/312 | 53.2% (48.7–57.6) 258/485 |
| B3_originals_only | 100.0% (98.5–100.0) 249/249 | 79.8% (75.0–83.9) 249/312 | 0.0% (0.0–0.8) 0/485 |
| P_proofgap_0_1_0 | 83.2% (79.1–86.6) 312/375 | 100.0% (98.8–100.0) 312/312 | 13.0% (10.3–16.3) 63/485 |
| P_proofgap_0_2_0 | 100.0% (98.6–100.0) 263/263 | 84.3% (79.8–87.9) 263/312 | 0.0% (0.0–0.8) 0/485 |
| P_proofgap_current | 100.0% (98.8–100.0) 312/312 | 100.0% (98.8–100.0) 312/312 | 0.0% (0.0–0.8) 0/485 |
| P_proofgap_current_decision | 100.0% (98.8–100.0) 312/312 | 100.0% (98.8–100.0) 312/312 | 0.0% (0.0–0.8) 0/485 |

**Undeclared-copy scenarios (hidden dependence)**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 0.0% (0.0–4.2) 0/88 | n/a | 100.0% (95.8–100.0) 88/88 |
| B1_distinct_sources | 0.0% (0.0–4.2) 0/88 | n/a | 100.0% (95.8–100.0) 88/88 |
| B2_dedupe_hash_then_sources | 0.0% (0.0–4.2) 0/88 | n/a | 100.0% (95.8–100.0) 88/88 |
| B3_originals_only | 0.0% (0.0–4.2) 0/88 | n/a | 100.0% (95.8–100.0) 88/88 |
| P_proofgap_0_1_0 | 0.0% (0.0–4.2) 0/88 | n/a | 100.0% (95.8–100.0) 88/88 |
| P_proofgap_0_2_0 | 0.0% (0.0–4.2) 0/88 | n/a | 100.0% (95.8–100.0) 88/88 |
| P_proofgap_current | 0.0% (0.0–4.2) 0/88 | n/a | 100.0% (95.8–100.0) 88/88 |
| P_proofgap_current_decision | 0.0% (0.0–7.0) 0/51 | n/a | 58.0% (47.5–67.7) 51/88 |

**All scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 40.1% (36.7–43.5) 312/779 | 100.0% (98.8–100.0) 312/312 | 81.5% (78.1–84.5) 467/573 |
| B1_distinct_sources | 42.9% (39.3–46.5) 312/728 | 100.0% (98.8–100.0) 312/312 | 72.6% (68.8–76.1) 416/573 |
| B2_dedupe_hash_then_sources | 47.4% (43.6–51.2) 312/658 | 100.0% (98.8–100.0) 312/312 | 60.4% (56.3–64.3) 346/573 |
| B3_originals_only | 73.9% (68.9–78.3) 249/337 | 79.8% (75.0–83.9) 249/312 | 15.4% (12.6–18.5) 88/573 |
| P_proofgap_0_1_0 | 67.4% (63.0–71.5) 312/463 | 100.0% (98.8–100.0) 312/312 | 26.4% (22.9–30.1) 151/573 |
| P_proofgap_0_2_0 | 74.9% (70.1–79.2) 263/351 | 84.3% (79.8–87.9) 263/312 | 15.4% (12.6–18.5) 88/573 |
| P_proofgap_current | 78.0% (73.7–81.8) 312/400 | 100.0% (98.8–100.0) 312/312 | 15.4% (12.6–18.5) 88/573 |
| P_proofgap_current_decision | 86.0% (82.0–89.1) 312/363 | 100.0% (98.8–100.0) 312/312 | 8.9% (6.8–11.5) 51/573 |

**Per-scenario correct counts**

| Scenario | kind | truth | claims | 0.1.0 | 0.2.0 | current status | current decision |
|---|---|---|---|---|---|---|---|
| bridge_only | declared | not | 17 | 0 | 17 | 17 | 17 |
| bridge_three_roots | declared | corroborated | 25 | 25 | 0 | 25 | 25 |
| declared_copies | declared | not | 113 | 113 | 113 | 113 | 113 |
| denial_bridge | declared | corroborated | 24 | 24 | 0 | 24 | 24 |
| derived_from_distinct_roots | declared | corroborated | 63 | 63 | 63 | 63 | 63 |
| genuine_independent | declared | corroborated | 127 | 127 | 127 | 127 | 127 |
| genuine_with_copy | declared | corroborated | 73 | 73 | 73 | 73 | 73 |
| group_plus_derivation | declared | not | 46 | 0 | 46 | 46 | 46 |
| hash_laundering | declared | not | 70 | 70 | 70 | 70 | 70 |
| no_support | declared | not | 46 | 46 | 46 | 46 | 46 |
| same_source_duplicates | declared | not | 51 | 51 | 51 | 51 | 51 |
| shared_origin_group | declared | not | 82 | 82 | 82 | 82 | 82 |
| single_item | declared | not | 60 | 60 | 60 | 60 | 60 |
| undeclared_copy | undeclared | not | 51 | 0 | 0 | 0 | 0 |
| undeclared_copy_with_cues | undeclared | not | 37 | 0 | 0 | 0 | 37 |

**Heuristic warnings** (cue fired on a claim (abstentionCues non-empty) vs hidden undeclared dependence in ground truth): precision 100.0% (90.6–100.0) 37/37, recall 42.0% (32.3–52.5) 37/88, FPR 0.0% (0.0–0.5) 0/797.

**Abstention:** 37 of 400 status-SUPPORTED claims abstained (37 truly uncorroborated, 0 truly corroborated).

Latency per case (analyzeCase, ms): median 0.391, p95 0.815, max 2.771.

### Scaling (single run, max-size input)

input 1000 sources / 5000 evidence / 500 claims (651671 bytes) → report 8923625 bytes; wall 300 ms; heapUsed Δ 66.1 MB; RSS 179 MB (gc exposed: true).

Environment: Node v22.23.4, linux/x64, 8× Intel(R) Xeon(R) Platinum 8488C, 31560 MB RAM.


---

# Phase 3 record (historical; engine 0.2.0, Phase 3 generator, `bench/results/phase3-run1.json`)
## Task
For each claim: *is it corroborated by at least 2 truly independent origins?* (positive = yes). A false positive is a **false corroboration**: the detector calls a claim corroborated when its support actually traces to fewer than 2 origins. That is the failure mode ProofGap X exists to catch.

## Dataset construction (`bench/dataset.js`)
- Cases are generated deterministically from seeds with a seeded PRNG. Each case has 3–6 claims; each claim is built from one of 13 scenario templates (`SCENARIOS`, weights chosen by me).
- **Ground truth is hidden origin count** known only to the generator (it is never written into the case JSON). Label = `trueOrigins >= 2`.
- Scenario kinds: `declared` (the dependence is expressed in the case: copies via `derivedFrom`, shared `originGroup`, identical sha256 under different sources, bridge sources, …) and `undeclared` (copies exist in the ground truth but the case does **not** say so).
- Splits: **dev** seeds 1–200, **held-out** seeds 100001–100200 (200 cases each, ~887 claims each). Tests assert the seed ranges are disjoint, no case is byte-identical across splits, all cases pass the strict validator, and detectors cannot see the truth (`test/benchmark.test.js`).

## Detectors compared (`bench/detectors.js`)
| ID | Rule |
|---|---|
| B0_item_count | ≥2 supporting evidence items |
| B1_distinct_sources | ≥2 distinct source ids |
| B2_dedupe_hash_then_sources | drop identical-sha256 duplicates, then ≥2 distinct sources |
| B3_originals_only | as B2, also ignoring any source that declares `derivedFrom` or `originGroup` |
| P_proofgap_0_1_0 | ProofGap X Phase 1/2 engine, extracted verbatim from git (`cac4ef7`) into `bench/legacy/` |
| P_proofgap_current | ProofGap X 0.2.0 (≥2 independent origins) |

B0–B3 are simple baselines I wrote; they are plausible but not strong. B3 is the fairest competitor. A better baseline written by someone else might do better.

## Process and honesty notes
- The adversarial/metamorphic tests (not this benchmark) found defects D1–D8 (see `.kiro/specs/proofgap-x/tasks.md`). The dev split was run during development; after the first dev run only the report `trust` block (no scoring effect) was added.
- The held-out split was **run once after code freeze** (`bench/results/phase3-run1.json`; same run also contains dev). It uses the same generator, so it protects against tuning to specific seeds, **not** against generator bias or distribution shift.
- Confidence intervals are 95% Wilson intervals treating claims as independent. Claims within a case share a generator and are correlated, so the intervals are optimistic.
- Accuracy numbers are deterministic and reproducible (`npm run bench`). Latency and memory are **machine-dependent**, from a single pass, and noisy.

## Findings (do not over-read)
1. Counting items or distinct sources (B0/B1) is badly fooled by derived copies, shared groups and relabeled duplicates (FPR 67–82%).
2. The simple "originals only" filter (B3) has low FPR on declared scenarios but loses ~21% recall because it discards legitimate derived-from-different-roots sources.
3. ProofGap 0.1.0 had a measurable false-corroboration problem on declared scenarios; the per-scenario table shows it fails exactly `bridge_three_roots` (defect D5) and `group_plus_derivation` (defect D4). 0.2.0 gets these right on this dataset. This measures fixes on scenarios I built to exercise them; defects D1–D3 and D6–D8 are covered by unit/metamorphic tests, not by this scenario mix.
4. **Every detector, including ProofGap X, fails 100% on undeclared copies** (FPR 100%). No method relying on declared provenance can catch them. ProofGap's heuristic warnings (same name / identical description) are not scored and are not evaluated here for precision/recall.
5. On the mixed "all scenarios" view ProofGap's precision is limited by the undeclared slice (see tables).

## Results (generated by `node bench/format.js bench/results/phase3-run1.json`)

### dev: 200 cases, 887 claims, 285 truly corroborated (seeds 1..200)

**Declared-provenance scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 42.0% (38.4–45.8) 285/678 | 100.0% (98.7–100.0) 285/285 | 76.8% (72.9–80.2) 393/512 |
| B1_distinct_sources | 45.5% (41.7–49.4) 285/626 | 100.0% (98.7–100.0) 285/285 | 66.6% (62.4–70.5) 341/512 |
| B2_dedupe_hash_then_sources | 52.0% (47.8–56.2) 285/548 | 100.0% (98.7–100.0) 285/285 | 51.4% (47.0–55.7) 263/512 |
| B3_originals_only | 82.8% (77.9–86.9) 222/268 | 77.9% (72.7–82.3) 222/285 | 9.0% (6.8–11.8) 46/512 |
| P_proofgap_0_1_0 | 77.0% (72.5–81.0) 285/370 | 100.0% (98.7–100.0) 285/285 | 16.6% (13.6–20.1) 85/512 |
| P_proofgap_current | 100.0% (98.7–100.0) 285/285 | 100.0% (98.7–100.0) 285/285 | 0.0% (0.0–0.7) 0/512 |

**Undeclared-copy scenarios (hidden dependence)**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| B1_distinct_sources | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| B2_dedupe_hash_then_sources | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| B3_originals_only | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| P_proofgap_0_1_0 | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |
| P_proofgap_current | 0.0% (0.0–4.1) 0/90 | n/a | 100.0% (95.9–100.0) 90/90 |

**All scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 37.1% (33.8–40.6) 285/768 | 100.0% (98.7–100.0) 285/285 | 80.2% (76.9–83.2) 483/602 |
| B1_distinct_sources | 39.8% (36.3–43.4) 285/716 | 100.0% (98.7–100.0) 285/285 | 71.6% (67.9–75.1) 431/602 |
| B2_dedupe_hash_then_sources | 44.7% (40.9–48.5) 285/638 | 100.0% (98.7–100.0) 285/285 | 58.6% (54.7–62.5) 353/602 |
| B3_originals_only | 62.0% (56.9–66.9) 222/358 | 77.9% (72.7–82.3) 222/285 | 22.6% (19.4–26.1) 136/602 |
| P_proofgap_0_1_0 | 62.0% (57.4–66.3) 285/460 | 100.0% (98.7–100.0) 285/285 | 29.1% (25.6–32.8) 175/602 |
| P_proofgap_current | 76.0% (71.4–80.0) 285/375 | 100.0% (98.7–100.0) 285/285 | 15.0% (12.3–18.0) 90/602 |

**Per-scenario accuracy of ProofGap current vs 0.1.0**

| Scenario | kind | truth | claims | 0.1.0 correct | current correct |
|---|---|---|---|---|---|
| bridge_three_roots | declared | not | 46 | 0 | 46 |
| declared_copies | declared | not | 105 | 105 | 105 |
| derived_from_distinct_roots | declared | corroborated | 63 | 63 | 63 |
| genuine_independent | declared | corroborated | 126 | 126 | 126 |
| genuine_with_copy | declared | corroborated | 96 | 96 | 96 |
| group_plus_derivation | declared | not | 39 | 0 | 39 |
| hash_laundering | declared | not | 78 | 78 | 78 |
| no_support | declared | not | 54 | 54 | 54 |
| same_source_duplicates | declared | not | 52 | 52 | 52 |
| shared_origin_group | declared | not | 73 | 73 | 73 |
| single_item | declared | not | 65 | 65 | 65 |
| undeclared_copy | undeclared | not | 59 | 0 | 0 |
| undeclared_copy_with_cues | undeclared | not | 31 | 0 | 0 |

Latency per case (analyzeCase, ms): median 0.271, p95 0.571, max 3.109.

### heldout: 200 cases, 887 claims, 263 truly corroborated (seeds 100001..100200)

**Declared-provenance scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 38.3% (34.8–42.0) 263/686 | 100.0% (98.6–100.0) 263/263 | 79.1% (75.4–82.3) 423/535 |
| B1_distinct_sources | 42.2% (38.4–46.1) 263/623 | 100.0% (98.6–100.0) 263/263 | 67.3% (63.2–71.1) 360/535 |
| B2_dedupe_hash_then_sources | 49.3% (45.1–53.6) 263/533 | 100.0% (98.6–100.0) 263/263 | 50.5% (46.2–54.7) 270/535 |
| B3_originals_only | 88.1% (83.3–91.6) 207/235 | 78.7% (73.4–83.2) 207/263 | 5.2% (3.6–7.5) 28/535 |
| P_proofgap_0_1_0 | 78.7% (74.0–82.8) 263/334 | 100.0% (98.6–100.0) 263/263 | 13.3% (10.7–16.4) 71/535 |
| P_proofgap_current | 100.0% (98.6–100.0) 263/263 | 100.0% (98.6–100.0) 263/263 | 0.0% (0.0–0.7) 0/535 |

**Undeclared-copy scenarios (hidden dependence)**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| B1_distinct_sources | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| B2_dedupe_hash_then_sources | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| B3_originals_only | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| P_proofgap_0_1_0 | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |
| P_proofgap_current | 0.0% (0.0–4.1) 0/89 | n/a | 100.0% (95.9–100.0) 89/89 |

**All scenarios**

| Detector | Precision (95% Wilson CI) | Recall | False-positive rate |
|---|---|---|---|
| B0_item_count | 33.9% (30.7–37.3) 263/775 | 100.0% (98.6–100.0) 263/263 | 82.1% (78.8–84.9) 512/624 |
| B1_distinct_sources | 36.9% (33.5–40.5) 263/712 | 100.0% (98.6–100.0) 263/263 | 72.0% (68.3–75.3) 449/624 |
| B2_dedupe_hash_then_sources | 42.3% (38.5–46.2) 263/622 | 100.0% (98.6–100.0) 263/263 | 57.5% (53.6–61.4) 359/624 |
| B3_originals_only | 63.9% (58.5–68.9) 207/324 | 78.7% (73.4–83.2) 207/263 | 18.8% (15.9–22.0) 117/624 |
| P_proofgap_0_1_0 | 62.2% (57.5–66.7) 263/423 | 100.0% (98.6–100.0) 263/263 | 25.6% (22.4–29.2) 160/624 |
| P_proofgap_current | 74.7% (69.9–79.0) 263/352 | 100.0% (98.6–100.0) 263/263 | 14.3% (11.7–17.2) 89/624 |

**Per-scenario accuracy of ProofGap current vs 0.1.0**

| Scenario | kind | truth | claims | 0.1.0 correct | current correct |
|---|---|---|---|---|---|
| bridge_three_roots | declared | not | 28 | 0 | 28 |
| declared_copies | declared | not | 121 | 121 | 121 |
| derived_from_distinct_roots | declared | corroborated | 56 | 56 | 56 |
| genuine_independent | declared | corroborated | 123 | 123 | 123 |
| genuine_with_copy | declared | corroborated | 84 | 84 | 84 |
| group_plus_derivation | declared | not | 43 | 0 | 43 |
| hash_laundering | declared | not | 90 | 90 | 90 |
| no_support | declared | not | 53 | 53 | 53 |
| same_source_duplicates | declared | not | 63 | 63 | 63 |
| shared_origin_group | declared | not | 78 | 78 | 78 |
| single_item | declared | not | 59 | 59 | 59 |
| undeclared_copy | undeclared | not | 44 | 0 | 0 |
| undeclared_copy_with_cues | undeclared | not | 45 | 0 | 0 |

Latency per case (analyzeCase, ms): median 0.239, p95 0.547, max 2.212.

### Scaling (single run, max-size input)

input 1000 sources / 5000 evidence / 500 claims (651671 bytes) → report 5177246 bytes; wall 251 ms; heapUsed Δ 32.7 MB; RSS 137 MB (gc exposed: true).

Environment: Node v22.23.4, linux/x64, 8× Intel(R) Xeon(R) Platinum 8488C, 31560 MB RAM.

## Limitations
Synthetic data; single author; scenario mix and weights are arbitrary; baselines are simple; correlated claims; no real case data; latency from one machine and one pass; memory from one scaling run; benchmark is not a security or forensic validation. Re-running after any code change must be recorded as a new results file; do not overwrite `phase3-run1.json`.
