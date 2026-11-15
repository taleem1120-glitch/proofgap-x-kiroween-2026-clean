
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
